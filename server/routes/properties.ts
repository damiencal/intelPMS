import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import type { AppVariables } from '../middleware/auth'
import { requireRole } from '../middleware/auth'

const properties = new Hono<{ Variables: AppVariables }>()

// GET /api/properties
properties.get('/', async (c) => {
  const user = c.get('user')
  const { page = '1', per_page = '20' } = c.req.query()

  const skip = (parseInt(page) - 1) * parseInt(per_page)
  const take = parseInt(per_page)

  const [data, total] = await Promise.all([
    prisma.property.findMany({
      where: { organizationId: user.organizationId },
      include: {
        listings: { select: { id: true, channel: true, channelName: true, isActive: true } },
        _count: { select: { reservations: true, reviews: true } },
      },
      orderBy: { name: 'asc' },
      skip,
      take,
    }),
    prisma.property.count({ where: { organizationId: user.organizationId } }),
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

// GET /api/properties/:id
properties.get('/:id', async (c) => {
  const user = c.get('user')
  const property = await prisma.property.findFirst({
    where: { id: c.req.param('id'), organizationId: user.organizationId },
    include: {
      listings: true,
      roomTypes: true,
      _count: { select: { reservations: true, reviews: true } },
    },
  })

  if (!property) {
    return c.json({ error: 'Property not found' }, 404)
  }

  return c.json({ data: property })
})

// GET /api/properties/:id/calendar
properties.get('/:id/calendar', async (c) => {
  const user = c.get('user')
  const { start_date, end_date } = c.req.query()

  const property = await prisma.property.findFirst({
    where: { id: c.req.param('id'), organizationId: user.organizationId },
    select: { id: true, listings: { select: { id: true } } },
  })

  if (!property) {
    return c.json({ error: 'Property not found' }, 404)
  }

  const listingIds = property.listings.map((l) => l.id)

  const entries = await prisma.calendarEntry.findMany({
    where: {
      listingId: { in: listingIds },
      ...(start_date && end_date
        ? { date: { gte: new Date(start_date), lte: new Date(end_date) } }
        : {}),
    },
    include: { listing: { select: { id: true, channel: true, channelName: true } } },
    orderBy: { date: 'asc' },
  })

  return c.json({ data: entries })
})

// PUT /api/properties/:id/calendar — bulk update calendar entries
properties.put('/:id/calendar', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const propertyId = c.req.param('id')

  const property = await prisma.property.findFirst({
    where: { id: propertyId, organizationId: user.organizationId },
    select: { id: true, name: true, listings: { select: { id: true } } },
  })

  if (!property) {
    return c.json({ error: 'Property not found' }, 404)
  }

  const listingIds = new Set(property.listings.map((l) => l.id))

  const body = await c.req.json<{
    entries: {
      listingId: string
      date: string
      price?: number | null
      available?: boolean
      minStay?: number | null
      maxStay?: number | null
      closedOnArrival?: boolean
      closedOnDeparture?: boolean
    }[]
  }>()

  if (!Array.isArray(body.entries) || body.entries.length === 0) {
    return c.json({ error: 'No entries provided' }, 400)
  }

  // Validate all listing IDs belong to this property
  for (const entry of body.entries) {
    if (!listingIds.has(entry.listingId)) {
      return c.json({ error: `Listing ${entry.listingId} does not belong to this property` }, 400)
    }
  }

  const results = await Promise.all(
    body.entries.map((entry) =>
      prisma.calendarEntry.upsert({
        where: {
          listingId_date: {
            listingId: entry.listingId,
            date: new Date(entry.date),
          },
        },
        create: {
          listingId: entry.listingId,
          date: new Date(entry.date),
          price: entry.price ?? null,
          available: entry.available ?? true,
          minStay: entry.minStay ?? null,
          maxStay: entry.maxStay ?? null,
          closedOnArrival: entry.closedOnArrival ?? false,
          closedOnDeparture: entry.closedOnDeparture ?? false,
        },
        update: {
          ...(entry.price !== undefined && { price: entry.price }),
          ...(entry.available !== undefined && { available: entry.available }),
          ...(entry.minStay !== undefined && { minStay: entry.minStay }),
          ...(entry.maxStay !== undefined && { maxStay: entry.maxStay }),
          ...(entry.closedOnArrival !== undefined && { closedOnArrival: entry.closedOnArrival }),
          ...(entry.closedOnDeparture !== undefined && { closedOnDeparture: entry.closedOnDeparture }),
          syncedAt: new Date(),
        },
      })
    )
  )

  await prisma.activityLog.create({
    data: {
      organizationId: user.organizationId,
      userId: user.id,
      type: 'calendar_updated',
      description: `Updated ${results.length} calendar entries for ${property.name}`,
      metadata: { propertyId, count: results.length },
    },
  })

  return c.json({ data: results, count: results.length })
})

// GET /api/properties/:id/reservations
properties.get('/:id/reservations', async (c) => {
  const user = c.get('user')
  const { page = '1', per_page = '20', status } = c.req.query()

  const property = await prisma.property.findFirst({
    where: { id: c.req.param('id'), organizationId: user.organizationId },
    select: { id: true },
  })

  if (!property) {
    return c.json({ error: 'Property not found' }, 404)
  }

  const where = {
    propertyId: property.id,
    ...(status ? { status } : {}),
  }

  const [data, total] = await Promise.all([
    prisma.reservation.findMany({
      where,
      orderBy: { checkIn: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(per_page),
      take: parseInt(per_page),
    }),
    prisma.reservation.count({ where }),
  ])

  return c.json({
    data,
    meta: {
      total,
      page: parseInt(page),
      perPage: parseInt(per_page),
      totalPages: Math.ceil(total / parseInt(per_page)),
    },
  })
})

// GET /api/properties/:id/reviews
properties.get('/:id/reviews', async (c) => {
  const user = c.get('user')
  const { page = '1', per_page = '20' } = c.req.query()

  const property = await prisma.property.findFirst({
    where: { id: c.req.param('id'), organizationId: user.organizationId },
    select: { id: true },
  })

  if (!property) {
    return c.json({ error: 'Property not found' }, 404)
  }

  const [data, total] = await Promise.all([
    prisma.review.findMany({
      where: { propertyId: property.id },
      orderBy: { reviewDate: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(per_page),
      take: parseInt(per_page),
    }),
    prisma.review.count({ where: { propertyId: property.id } }),
  ])

  return c.json({
    data,
    meta: {
      total,
      page: parseInt(page),
      perPage: parseInt(per_page),
      totalPages: Math.ceil(total / parseInt(per_page)),
    },
  })
})

export default properties
