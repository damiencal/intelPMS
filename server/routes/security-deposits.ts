import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { type AppVariables, requireRole } from '../middleware/auth'

const securityDeposits = new Hono<{ Variables: AppVariables }>()

// GET /api/security-deposits
securityDeposits.get('/', async (c) => {
  const user = c.get('user')
  const page = Number(c.req.query('page') ?? '1')
  const perPage = Number(c.req.query('per_page') ?? '20')
  const propertyId = c.req.query('property_id')
  const status = c.req.query('status')
  const search = c.req.query('search')

  const where: any = { organizationId: user.organizationId }
  if (propertyId) where.propertyId = propertyId
  if (status) where.status = status
  if (search) {
    where.OR = [
      { guestName: { contains: search } },
      { reservationId: { contains: search } },
    ]
  }

  const [data, total] = await Promise.all([
    prisma.securityDeposit.findMany({
      where,
      include: { property: { select: { id: true, name: true } } },
      orderBy: { collectedDate: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.securityDeposit.count({ where }),
  ])

  return c.json({
    data,
    meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
  })
})

// GET /api/security-deposits/stats
securityDeposits.get('/stats', async (c) => {
  const user = c.get('user')
  const orgFilter = { organizationId: user.organizationId }

  const deposits = await prisma.securityDeposit.findMany({
    where: orgFilter,
    select: { amount: true, refundAmount: true, claimAmount: true, status: true },
  })

  const totalHeld = deposits
    .filter((d) => d.status === 'held')
    .reduce((s, d) => s + d.amount, 0)
  const totalRefunded = deposits
    .filter((d) => d.status === 'refunded' || d.status === 'partially_refunded')
    .reduce((s, d) => s + (d.refundAmount || 0), 0)
  const totalClaimed = deposits
    .filter((d) => d.status === 'claimed')
    .reduce((s, d) => s + (d.claimAmount || d.amount), 0)
  const disputed = deposits.filter((d) => d.status === 'disputed').length

  return c.json({
    data: {
      total: deposits.length,
      held: deposits.filter((d) => d.status === 'held').length,
      totalHeld: Math.round(totalHeld * 100) / 100,
      totalRefunded: Math.round(totalRefunded * 100) / 100,
      totalClaimed: Math.round(totalClaimed * 100) / 100,
      disputed,
    },
  })
})

// POST /api/security-deposits
securityDeposits.post('/', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const body = await c.req.json()

  const property = await prisma.property.findFirst({
    where: { id: body.propertyId, organizationId: user.organizationId },
  })
  if (!property) return c.json({ error: 'Property not found' }, 404)

  const record = await prisma.securityDeposit.create({
    data: {
      organizationId: user.organizationId,
      propertyId: body.propertyId,
      reservationId: body.reservationId || null,
      guestName: body.guestName,
      amount: body.amount,
      currency: body.currency || 'USD',
      status: 'held',
      collectedDate: new Date(body.collectedDate || new Date()),
      notes: body.notes || null,
      createdBy: user.name || user.email,
    },
    include: { property: { select: { id: true, name: true } } },
  })

  return c.json({ data: record }, 201)
})

// PUT /api/security-deposits/:id
securityDeposits.put('/:id', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const body = await c.req.json()

  const existing = await prisma.securityDeposit.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!existing) return c.json({ error: 'Deposit not found' }, 404)

  const updateData: any = {
    guestName: body.guestName ?? existing.guestName,
    amount: body.amount ?? existing.amount,
    status: body.status ?? existing.status,
    notes: body.notes !== undefined ? body.notes : existing.notes,
  }

  // Handle refund
  if (body.status === 'refunded' || body.status === 'partially_refunded') {
    updateData.refundAmount = body.refundAmount ?? existing.amount
    updateData.refundDate = new Date()
  }

  // Handle claim
  if (body.status === 'claimed') {
    updateData.claimAmount = body.claimAmount ?? existing.amount
    updateData.claimReason = body.claimReason ?? existing.claimReason
    updateData.damagePhotos = body.damagePhotos ? (body.damagePhotos as any) : existing.damagePhotos
  }

  if (body.refundAmount !== undefined) updateData.refundAmount = body.refundAmount
  if (body.claimAmount !== undefined) updateData.claimAmount = body.claimAmount
  if (body.claimReason !== undefined) updateData.claimReason = body.claimReason

  const record = await prisma.securityDeposit.update({
    where: { id },
    data: updateData,
    include: { property: { select: { id: true, name: true } } },
  })

  return c.json({ data: record })
})

// DELETE /api/security-deposits/:id
securityDeposits.delete('/:id', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  const existing = await prisma.securityDeposit.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!existing) return c.json({ error: 'Deposit not found' }, 404)

  await prisma.securityDeposit.delete({ where: { id } })
  return c.json({ data: { success: true } })
})

export default securityDeposits
