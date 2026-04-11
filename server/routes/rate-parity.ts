import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { type AppVariables, requireRole } from '../middleware/auth'

const rateParity = new Hono<{ Variables: AppVariables }>()

// GET /api/rate-parity — list checks
rateParity.get('/', async (c) => {
  const user = c.get('user')
  const page = Number(c.req.query('page') ?? '1')
  const perPage = Number(c.req.query('per_page') ?? '20')
  const propertyId = c.req.query('property_id')
  const parityStatus = c.req.query('parity_status')

  const where: any = { organizationId: user.organizationId }
  if (propertyId) where.propertyId = propertyId
  if (parityStatus) where.parityStatus = parityStatus

  const [data, total] = await Promise.all([
    prisma.rateParityCheck.findMany({
      where,
      include: { property: { select: { id: true, name: true } } },
      orderBy: { checkDate: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.rateParityCheck.count({ where }),
  ])

  return c.json({
    data,
    meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
  })
})

// GET /api/rate-parity/summary — overview of latest checks per property
rateParity.get('/summary', async (c) => {
  const user = c.get('user')

  const properties = await prisma.property.findMany({
    where: { organizationId: user.organizationId },
    select: { id: true, name: true },
  })

  // Get the latest check for each property
  const latestChecks = await Promise.all(
    properties.map(async (p) => {
      const latest = await prisma.rateParityCheck.findFirst({
        where: { propertyId: p.id, organizationId: user.organizationId },
        orderBy: { checkDate: 'desc' },
      })
      return { ...p, latestCheck: latest }
    })
  )

  const inParity = latestChecks.filter((p) => p.latestCheck?.parityStatus === 'in_parity').length
  const minorDiff = latestChecks.filter((p) => p.latestCheck?.parityStatus === 'minor_diff').length
  const majorDiff = latestChecks.filter((p) => p.latestCheck?.parityStatus === 'major_diff').length
  const unchecked = latestChecks.filter((p) => !p.latestCheck).length

  return c.json({
    data: {
      properties: latestChecks,
      summary: { inParity, minorDiff, majorDiff, unchecked, total: properties.length },
    },
  })
})

// POST /api/rate-parity — create a parity check
rateParity.post('/', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const body = await c.req.json()

  const property = await prisma.property.findFirst({
    where: { id: body.propertyId, organizationId: user.organizationId },
  })
  if (!property) return c.json({ error: 'Property not found' }, 404)

  // Calculate parity from channels data
  const channels: { channel: string; price: number; available: boolean }[] = body.channels || []
  const prices = channels.filter((ch) => ch.available && ch.price > 0).map((ch) => ch.price)
  const lowestPrice = prices.length ? Math.min(...prices) : null
  const highestPrice = prices.length ? Math.max(...prices) : null
  const basePrice = body.basePrice || null

  let priceDiffPct: number | null = null
  let parityStatus = 'in_parity'

  if (lowestPrice && highestPrice && highestPrice > 0) {
    priceDiffPct = Math.round(((highestPrice - lowestPrice) / lowestPrice) * 10000) / 100
    if (priceDiffPct > 10) parityStatus = 'major_diff'
    else if (priceDiffPct > 3) parityStatus = 'minor_diff'
  }

  const record = await prisma.rateParityCheck.create({
    data: {
      organizationId: user.organizationId,
      propertyId: body.propertyId,
      checkDate: new Date(body.checkDate || new Date()),
      channels: channels as any,
      basePrice,
      lowestPrice,
      highestPrice,
      priceDiffPct,
      parityStatus,
      notes: body.notes || null,
    },
    include: { property: { select: { id: true, name: true } } },
  })

  return c.json({ data: record }, 201)
})

// DELETE /api/rate-parity/:id
rateParity.delete('/:id', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  const existing = await prisma.rateParityCheck.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!existing) return c.json({ error: 'Check not found' }, 404)

  await prisma.rateParityCheck.delete({ where: { id } })
  return c.json({ data: { success: true } })
})

export default rateParity
