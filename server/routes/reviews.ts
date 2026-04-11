import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import type { AppVariables } from '../middleware/auth'

const reviews = new Hono<{ Variables: AppVariables }>()

// GET /api/reviews — all reviews across all properties
reviews.get('/', async (c) => {
  const user = c.get('user')
  const { page = '1', per_page = '20', sentiment, response_status, property_id, search } = c.req.query()

  const skip = (parseInt(page) - 1) * parseInt(per_page)
  const take = parseInt(per_page)

  const where = {
    property: { organizationId: user.organizationId },
    ...(sentiment ? { sentiment } : {}),
    ...(response_status ? { responseStatus: response_status } : {}),
    ...(property_id ? { propertyId: property_id } : {}),
    ...(search
      ? {
          OR: [
            { guestName: { contains: search } },
            { content: { contains: search } },
          ],
        }
      : {}),
  }

  const [data, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        property: { select: { id: true, name: true, imageUrl: true } },
      },
      orderBy: { reviewDate: 'desc' },
      skip,
      take,
    }),
    prisma.review.count({ where }),
  ])

  return c.json({
    data,
    meta: {
      total,
      page: parseInt(page),
      perPage: parseInt(per_page),
      totalPages: Math.ceil(total / take),
    },
  })
})

// PATCH /api/reviews/:id — update review (e.g., response draft, status)
reviews.patch('/:id', async (c) => {
  const user = c.get('user')
  const reviewId = c.req.param('id')
  const body = await c.req.json()

  const existing = await prisma.review.findFirst({
    where: { id: reviewId, property: { organizationId: user.organizationId } },
  })

  if (!existing) {
    return c.json({ error: 'Review not found' }, 404)
  }

  const review = await prisma.review.update({
    where: { id: reviewId },
    data: {
      ...(body.responseStatus !== undefined && { responseStatus: body.responseStatus }),
      ...(body.responseDraft !== undefined && { responseDraft: body.responseDraft }),
      ...(body.sentiment !== undefined && { sentiment: body.sentiment }),
      ...(body.respondedAt !== undefined && { respondedAt: new Date(body.respondedAt) }),
    },
  })

  return c.json({ data: review })
})

export default reviews
