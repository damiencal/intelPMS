import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { type AppVariables, requireRole } from '../middleware/auth'

const pricingRecs = new Hono<{ Variables: AppVariables }>()

// GET /api/pricing-recommendations
pricingRecs.get('/', async (c) => {
  const user = c.get('user')
  const page = Number(c.req.query('page') ?? '1')
  const perPage = Number(c.req.query('per_page') ?? '20')
  const propertyId = c.req.query('property_id')
  const status = c.req.query('status')

  const where: any = { organizationId: user.organizationId }
  if (propertyId) where.propertyId = propertyId
  if (status) where.status = status

  const [data, total] = await Promise.all([
    prisma.pricingRecommendation.findMany({
      where,
      include: { property: { select: { id: true, name: true } } },
      orderBy: { date: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.pricingRecommendation.count({ where }),
  ])

  return c.json({
    data,
    meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
  })
})

// GET /api/pricing-recommendations/stats
pricingRecs.get('/stats', async (c) => {
  const user = c.get('user')
  const orgFilter = { organizationId: user.organizationId }

  const recs = await prisma.pricingRecommendation.findMany({
    where: orgFilter,
    select: {
      status: true,
      currentPrice: true,
      recommendedPrice: true,
      confidence: true,
    },
  })

  const total = recs.length
  const pending = recs.filter((r) => r.status === 'pending').length
  const accepted = recs.filter((r) => r.status === 'accepted').length
  const rejected = recs.filter((r) => r.status === 'rejected').length

  const avgConfidence =
    recs.length > 0
      ? Math.round(
          (recs.filter((r) => r.confidence != null).reduce((s, r) => s + (r.confidence ?? 0), 0) /
            recs.filter((r) => r.confidence != null).length) *
            100
        ) / 100
      : 0

  const avgPriceDiffPct =
    recs.length > 0
      ? Math.round(
          (recs.reduce(
            (s, r) =>
              s +
              ((r.recommendedPrice - r.currentPrice) / (r.currentPrice || 1)) *
                100,
            0
          ) /
            recs.length) *
            100
        ) / 100
      : 0

  const potentialRevenue = recs
    .filter((r) => r.status === 'pending' && r.recommendedPrice > r.currentPrice)
    .reduce((s, r) => s + (r.recommendedPrice - r.currentPrice), 0)

  return c.json({
    data: {
      total,
      pending,
      accepted,
      rejected,
      avgConfidence,
      avgPriceDiffPct,
      potentialRevenue: Math.round(potentialRevenue * 100) / 100,
    },
  })
})

// POST /api/pricing-recommendations/generate
pricingRecs.post('/generate', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const body = await c.req.json()
  const propertyId = body.propertyId

  const property = await prisma.property.findFirst({
    where: { id: propertyId, organizationId: user.organizationId },
    include: {
      listings: { select: { basePrice: true, channel: true } },
      reservations: {
        where: {
          checkIn: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
        },
        select: { totalPrice: true, checkIn: true, checkOut: true },
        orderBy: { checkIn: 'desc' },
        take: 50,
      },
    },
  })
  if (!property) return c.json({ error: 'Property not found' }, 404)

  // Simple recommendation logic based on available data
  const avgListingPrice =
    property.listings.length > 0
      ? property.listings.reduce((s, l) => s + (l.basePrice || 0), 0) / property.listings.length
      : 100

  const recentBookings = property.reservations.length
  const demandFactor = recentBookings > 10 ? 1.15 : recentBookings > 5 ? 1.05 : 0.95

  // Check competitor rates
  const competitorRates = await prisma.competitorRate.findMany({
    where: {
      organizationId: user.organizationId,
      propertyId,
      checkDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
    select: { competitorPrice: true },
  })

  const avgCompetitorPrice =
    competitorRates.length > 0
      ? competitorRates.reduce((s, r) => s + r.competitorPrice, 0) / competitorRates.length
      : avgListingPrice

  // Generate recommendations for the next 14 days
  const recommendations = []
  const now = new Date()

  for (let i = 1; i <= 14; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() + i)
    const dayOfWeek = date.getDay()

    // Weekend premium
    const weekendFactor = dayOfWeek === 5 || dayOfWeek === 6 ? 1.12 : 1.0

    // Seasonal factor (simplified)
    const month = date.getMonth()
    const seasonFactor =
      month >= 5 && month <= 8 ? 1.2 : month >= 11 || month <= 1 ? 1.1 : 0.95

    const basePrice = avgListingPrice
    const recommended =
      Math.round(basePrice * demandFactor * weekendFactor * seasonFactor * 100) / 100
    const confidence = Math.min(
      0.95,
      0.5 + recentBookings * 0.02 + competitorRates.length * 0.03
    )

    const factors = {
      demand: Math.round(demandFactor * 100) / 100,
      seasonality: Math.round(seasonFactor * 100) / 100,
      weekend: Math.round(weekendFactor * 100) / 100,
      competitorAvg: Math.round(avgCompetitorPrice * 100) / 100,
    }

    const reasons = []
    if (demandFactor > 1) reasons.push(`High demand (${recentBookings} recent bookings)`)
    if (weekendFactor > 1) reasons.push('Weekend premium')
    if (seasonFactor > 1) reasons.push('Peak season')
    if (seasonFactor < 1) reasons.push('Off-season')
    if (competitorRates.length > 0)
      reasons.push(`Competitor avg: $${avgCompetitorPrice.toFixed(2)}`)

    recommendations.push(
      prisma.pricingRecommendation.create({
        data: {
          organizationId: user.organizationId,
          propertyId,
          date,
          currentPrice: basePrice,
          recommendedPrice: recommended,
          minPrice: Math.round(recommended * 0.85 * 100) / 100,
          maxPrice: Math.round(recommended * 1.15 * 100) / 100,
          confidence: Math.round(confidence * 100) / 100,
          reason: reasons.join('. ') || 'Standard pricing recommendation',
          factors: factors as any,
          status: 'pending',
        },
      })
    )
  }

  const created = await prisma.$transaction(recommendations)

  return c.json({ data: created, count: created.length }, 201)
})

// PUT /api/pricing-recommendations/:id/accept
pricingRecs.put('/:id/accept', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  const existing = await prisma.pricingRecommendation.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!existing) return c.json({ error: 'Recommendation not found' }, 404)

  const record = await prisma.pricingRecommendation.update({
    where: { id },
    data: { status: 'accepted', acceptedAt: new Date() },
    include: { property: { select: { id: true, name: true } } },
  })

  return c.json({ data: record })
})

// PUT /api/pricing-recommendations/:id/reject
pricingRecs.put('/:id/reject', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  const existing = await prisma.pricingRecommendation.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!existing) return c.json({ error: 'Recommendation not found' }, 404)

  const record = await prisma.pricingRecommendation.update({
    where: { id },
    data: { status: 'rejected', rejectedAt: new Date() },
    include: { property: { select: { id: true, name: true } } },
  })

  return c.json({ data: record })
})

// DELETE /api/pricing-recommendations/:id
pricingRecs.delete('/:id', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  const existing = await prisma.pricingRecommendation.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!existing) return c.json({ error: 'Recommendation not found' }, 404)

  await prisma.pricingRecommendation.delete({ where: { id } })
  return c.json({ message: 'Deleted' })
})

export default pricingRecs
