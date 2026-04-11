import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { type AppVariables, requireRole } from '../middleware/auth'

const competitorRates = new Hono<{ Variables: AppVariables }>()

// GET /api/competitor-rates
competitorRates.get('/', async (c) => {
  const user = c.get('user')
  const page = Number(c.req.query('page') ?? '1')
  const perPage = Number(c.req.query('per_page') ?? '20')
  const propertyId = c.req.query('property_id')
  const platform = c.req.query('platform')
  const search = c.req.query('search')

  const where: any = { organizationId: user.organizationId }
  if (propertyId) where.propertyId = propertyId
  if (platform) where.platform = platform
  if (search) {
    where.OR = [
      { competitorName: { contains: search } },
      { competitorUrl: { contains: search } },
    ]
  }

  const [data, total] = await Promise.all([
    prisma.competitorRate.findMany({
      where,
      include: { property: { select: { id: true, name: true } } },
      orderBy: { checkDate: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.competitorRate.count({ where }),
  ])

  return c.json({
    data,
    meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
  })
})

// GET /api/competitor-rates/summary
competitorRates.get('/summary', async (c) => {
  const user = c.get('user')

  const rates = await prisma.competitorRate.findMany({
    where: { organizationId: user.organizationId },
    include: { property: { select: { id: true, name: true } } },
    orderBy: { checkDate: 'desc' },
  })

  // Group by property, get latest for each
  const propertyMap = new Map<string, any>()
  for (const rate of rates) {
    if (!propertyMap.has(rate.propertyId)) {
      propertyMap.set(rate.propertyId, {
        propertyId: rate.propertyId,
        propertyName: rate.property.name,
        latestCheck: rate.checkDate,
        competitorCount: 0,
        avgPriceDiff: 0,
        cheaperCount: 0,
        moreExpensiveCount: 0,
        rates: [] as any[],
      })
    }
    const entry = propertyMap.get(rate.propertyId)!
    entry.rates.push(rate)
  }

  for (const entry of propertyMap.values()) {
    const latestRates = entry.rates.filter(
      (r: any) => r.checkDate.getTime() === entry.latestCheck.getTime()
    )
    entry.competitorCount = latestRates.length
    entry.avgPriceDiff =
      latestRates.length > 0
        ? Math.round(
            (latestRates.reduce((s: number, r: any) => s + r.priceDiffPct, 0) /
              latestRates.length) *
              100
          ) / 100
        : 0
    entry.cheaperCount = latestRates.filter((r: any) => r.priceDiff < 0).length
    entry.moreExpensiveCount = latestRates.filter((r: any) => r.priceDiff > 0).length
    delete entry.rates
  }

  const totalChecks = rates.length
  const avgDiff =
    rates.length > 0
      ? Math.round(
          (rates.reduce((s, r) => s + r.priceDiffPct, 0) / rates.length) * 100
        ) / 100
      : 0
  const cheaperThanYou = rates.filter((r) => r.priceDiff < 0).length
  const moreExpensive = rates.filter((r) => r.priceDiff > 0).length

  return c.json({
    data: {
      totalChecks,
      avgDiff,
      cheaperThanYou,
      moreExpensive,
      propertiesTracked: propertyMap.size,
      properties: Array.from(propertyMap.values()),
    },
  })
})

// POST /api/competitor-rates
competitorRates.post('/', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const body = await c.req.json()

  const property = await prisma.property.findFirst({
    where: { id: body.propertyId, organizationId: user.organizationId },
  })
  if (!property) return c.json({ error: 'Property not found' }, 404)

  const priceDiff = body.competitorPrice - body.yourPrice
  const priceDiffPct =
    body.yourPrice > 0 ? Math.round((priceDiff / body.yourPrice) * 10000) / 100 : 0

  const record = await prisma.competitorRate.create({
    data: {
      organizationId: user.organizationId,
      propertyId: body.propertyId,
      competitorName: body.competitorName,
      competitorUrl: body.competitorUrl || null,
      platform: body.platform,
      competitorPrice: body.competitorPrice,
      yourPrice: body.yourPrice,
      priceDiff,
      priceDiffPct,
      checkDate: new Date(body.checkDate || new Date()),
      checkInDate: new Date(body.checkInDate),
      checkOutDate: new Date(body.checkOutDate),
      guests: body.guests || null,
      bedrooms: body.bedrooms || null,
      rating: body.rating || null,
      reviewCount: body.reviewCount || null,
      notes: body.notes || null,
    },
    include: { property: { select: { id: true, name: true } } },
  })

  return c.json({ data: record }, 201)
})

// DELETE /api/competitor-rates/:id
competitorRates.delete('/:id', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  const existing = await prisma.competitorRate.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!existing) return c.json({ error: 'Record not found' }, 404)

  await prisma.competitorRate.delete({ where: { id } })
  return c.json({ message: 'Deleted' })
})

export default competitorRates
