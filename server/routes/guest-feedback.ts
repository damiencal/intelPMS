import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { type AppVariables, requireRole } from '../middleware/auth'

const guestFeedback = new Hono<{ Variables: AppVariables }>()

// GET /api/guest-feedback
guestFeedback.get('/', async (c) => {
  const user = c.get('user')
  const page = Number(c.req.query('page') ?? '1')
  const perPage = Number(c.req.query('per_page') ?? '20')
  const propertyId = c.req.query('property_id')
  const status = c.req.query('status')
  const minRating = c.req.query('min_rating')

  const where: any = { organizationId: user.organizationId }
  if (propertyId) where.propertyId = propertyId
  if (status) where.status = status
  if (minRating) where.overallRating = { gte: Number(minRating) }

  const [data, total] = await Promise.all([
    prisma.guestFeedback.findMany({
      where,
      include: { property: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.guestFeedback.count({ where }),
  ])

  return c.json({
    data,
    meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
  })
})

// GET /api/guest-feedback/stats
guestFeedback.get('/stats', async (c) => {
  const user = c.get('user')
  const propertyId = c.req.query('property_id')

  const where: any = { organizationId: user.organizationId }
  if (propertyId) where.propertyId = propertyId

  const feedback = await prisma.guestFeedback.findMany({
    where,
    select: {
      overallRating: true,
      cleanlinessRating: true,
      communicationRating: true,
      locationRating: true,
      valueRating: true,
      amenitiesRating: true,
      wouldRecommend: true,
      status: true,
    },
  })

  const count = feedback.length
  if (count === 0) {
    return c.json({ data: { count: 0, avgOverall: 0, avgCleanliness: 0, avgCommunication: 0, avgLocation: 0, avgValue: 0, avgAmenities: 0, recommendRate: 0, pending: 0, reviewed: 0 } })
  }

  const avg = (arr: (number | null)[]) => {
    const valid = arr.filter((v): v is number => v !== null)
    return valid.length ? Math.round((valid.reduce((s, v) => s + v, 0) / valid.length) * 10) / 10 : 0
  }

  const recommendYes = feedback.filter((f) => f.wouldRecommend === true).length
  const recommendTotal = feedback.filter((f) => f.wouldRecommend !== null).length

  return c.json({
    data: {
      count,
      avgOverall: avg(feedback.map((f) => f.overallRating)),
      avgCleanliness: avg(feedback.map((f) => f.cleanlinessRating)),
      avgCommunication: avg(feedback.map((f) => f.communicationRating)),
      avgLocation: avg(feedback.map((f) => f.locationRating)),
      avgValue: avg(feedback.map((f) => f.valueRating)),
      avgAmenities: avg(feedback.map((f) => f.amenitiesRating)),
      recommendRate: recommendTotal > 0 ? Math.round((recommendYes / recommendTotal) * 100) : 0,
      pending: feedback.filter((f) => f.status === 'pending' || f.status === 'received').length,
      reviewed: feedback.filter((f) => f.status === 'reviewed').length,
    },
  })
})

// POST /api/guest-feedback
guestFeedback.post('/', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const body = await c.req.json()

  const property = await prisma.property.findFirst({
    where: { id: body.propertyId, organizationId: user.organizationId },
  })
  if (!property) return c.json({ error: 'Property not found' }, 404)

  const record = await prisma.guestFeedback.create({
    data: {
      organizationId: user.organizationId,
      propertyId: body.propertyId,
      reservationId: body.reservationId || null,
      guestName: body.guestName || null,
      guestEmail: body.guestEmail || null,
      overallRating: body.overallRating,
      cleanlinessRating: body.cleanlinessRating ?? null,
      communicationRating: body.communicationRating ?? null,
      locationRating: body.locationRating ?? null,
      valueRating: body.valueRating ?? null,
      amenitiesRating: body.amenitiesRating ?? null,
      comments: body.comments || null,
      improvements: body.improvements || null,
      wouldRecommend: body.wouldRecommend ?? null,
      source: body.source || 'internal',
      status: 'received',
    },
    include: { property: { select: { id: true, name: true } } },
  })

  return c.json({ data: record }, 201)
})

// PUT /api/guest-feedback/:id
guestFeedback.put('/:id', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const body = await c.req.json()

  const existing = await prisma.guestFeedback.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!existing) return c.json({ error: 'Feedback not found' }, 404)

  const record = await prisma.guestFeedback.update({
    where: { id },
    data: {
      status: body.status ?? existing.status,
      overallRating: body.overallRating ?? existing.overallRating,
      cleanlinessRating: body.cleanlinessRating !== undefined ? body.cleanlinessRating : existing.cleanlinessRating,
      communicationRating: body.communicationRating !== undefined ? body.communicationRating : existing.communicationRating,
      locationRating: body.locationRating !== undefined ? body.locationRating : existing.locationRating,
      valueRating: body.valueRating !== undefined ? body.valueRating : existing.valueRating,
      amenitiesRating: body.amenitiesRating !== undefined ? body.amenitiesRating : existing.amenitiesRating,
      comments: body.comments !== undefined ? body.comments : existing.comments,
      improvements: body.improvements !== undefined ? body.improvements : existing.improvements,
      wouldRecommend: body.wouldRecommend !== undefined ? body.wouldRecommend : existing.wouldRecommend,
      respondedAt: body.status === 'reviewed' && existing.status !== 'reviewed' ? new Date() : existing.respondedAt,
    },
    include: { property: { select: { id: true, name: true } } },
  })

  return c.json({ data: record })
})

// DELETE /api/guest-feedback/:id
guestFeedback.delete('/:id', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  const existing = await prisma.guestFeedback.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!existing) return c.json({ error: 'Feedback not found' }, 404)

  await prisma.guestFeedback.delete({ where: { id } })
  return c.json({ data: { success: true } })
})

export default guestFeedback
