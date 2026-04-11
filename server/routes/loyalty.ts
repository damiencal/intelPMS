import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { type AppVariables, requireRole } from '../middleware/auth'

const loyalty = new Hono<{ Variables: AppVariables }>()

// GET /api/loyalty
loyalty.get('/', async (c) => {
  const user = c.get('user')
  const page = Number(c.req.query('page') ?? '1')
  const perPage = Number(c.req.query('per_page') ?? '20')
  const tier = c.req.query('tier')
  const status = c.req.query('status')
  const search = c.req.query('search')

  const where: any = { organizationId: user.organizationId }
  if (tier) where.tier = tier
  if (status) where.status = status
  if (search) {
    where.OR = [
      { guestName: { contains: search } },
      { guestEmail: { contains: search } },
      { phone: { contains: search } },
    ]
  }

  const [data, total] = await Promise.all([
    prisma.loyaltyMember.findMany({
      where,
      orderBy: { totalSpent: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.loyaltyMember.count({ where }),
  ])

  return c.json({
    data,
    meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
  })
})

// GET /api/loyalty/stats
loyalty.get('/stats', async (c) => {
  const user = c.get('user')
  const orgFilter = { organizationId: user.organizationId }

  const members = await prisma.loyaltyMember.findMany({
    where: { ...orgFilter, status: 'active' },
    select: { tier: true, totalStays: true, totalSpent: true, pointsBalance: true },
  })

  const totalMembers = members.length
  const tierCounts = {
    bronze: members.filter((m) => m.tier === 'bronze').length,
    silver: members.filter((m) => m.tier === 'silver').length,
    gold: members.filter((m) => m.tier === 'gold').length,
    platinum: members.filter((m) => m.tier === 'platinum').length,
  }
  const totalStays = members.reduce((s, m) => s + m.totalStays, 0)
  const totalRevenue = Math.round(members.reduce((s, m) => s + m.totalSpent, 0) * 100) / 100
  const outstandingPoints = members.reduce((s, m) => s + m.pointsBalance, 0)

  return c.json({
    data: {
      totalMembers,
      tierCounts,
      totalStays,
      totalRevenue,
      outstandingPoints,
    },
  })
})

// POST /api/loyalty
loyalty.post('/', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const body = await c.req.json()

  // Check for existing member with same email
  const existing = await prisma.loyaltyMember.findFirst({
    where: { organizationId: user.organizationId, guestEmail: body.guestEmail },
  })
  if (existing) return c.json({ error: 'Member with this email already exists' }, 409)

  const record = await prisma.loyaltyMember.create({
    data: {
      organizationId: user.organizationId,
      guestName: body.guestName,
      guestEmail: body.guestEmail,
      phone: body.phone || null,
      tier: body.tier || 'bronze',
      totalStays: body.totalStays || 0,
      totalSpent: body.totalSpent || 0,
      pointsBalance: body.pointsBalance || 0,
      pointsEarned: body.pointsEarned || 0,
      pointsRedeemed: body.pointsRedeemed || 0,
      lastStayDate: body.lastStayDate ? new Date(body.lastStayDate) : null,
      notes: body.notes || null,
      status: body.status || 'active',
    },
  })

  return c.json({ data: record }, 201)
})

// PUT /api/loyalty/:id
loyalty.put('/:id', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const body = await c.req.json()

  const existing = await prisma.loyaltyMember.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!existing) return c.json({ error: 'Member not found' }, 404)

  const record = await prisma.loyaltyMember.update({
    where: { id },
    data: {
      guestName: body.guestName ?? existing.guestName,
      guestEmail: body.guestEmail ?? existing.guestEmail,
      phone: body.phone !== undefined ? body.phone : existing.phone,
      tier: body.tier ?? existing.tier,
      totalStays: body.totalStays ?? existing.totalStays,
      totalSpent: body.totalSpent ?? existing.totalSpent,
      pointsBalance: body.pointsBalance ?? existing.pointsBalance,
      pointsEarned: body.pointsEarned ?? existing.pointsEarned,
      pointsRedeemed: body.pointsRedeemed ?? existing.pointsRedeemed,
      lastStayDate: body.lastStayDate ? new Date(body.lastStayDate) : existing.lastStayDate,
      notes: body.notes !== undefined ? body.notes : existing.notes,
      status: body.status ?? existing.status,
    },
  })

  return c.json({ data: record })
})

// PUT /api/loyalty/:id/add-points
loyalty.put('/:id/add-points', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const body = await c.req.json()
  const points = Number(body.points)

  if (!points || points <= 0) return c.json({ error: 'Points must be a positive number' }, 400)

  const existing = await prisma.loyaltyMember.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!existing) return c.json({ error: 'Member not found' }, 404)

  const record = await prisma.loyaltyMember.update({
    where: { id },
    data: {
      pointsBalance: existing.pointsBalance + points,
      pointsEarned: existing.pointsEarned + points,
    },
  })

  return c.json({ data: record })
})

// PUT /api/loyalty/:id/redeem-points
loyalty.put('/:id/redeem-points', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const body = await c.req.json()
  const points = Number(body.points)

  if (!points || points <= 0) return c.json({ error: 'Points must be a positive number' }, 400)

  const existing = await prisma.loyaltyMember.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!existing) return c.json({ error: 'Member not found' }, 404)
  if (existing.pointsBalance < points) return c.json({ error: 'Insufficient points' }, 400)

  const record = await prisma.loyaltyMember.update({
    where: { id },
    data: {
      pointsBalance: existing.pointsBalance - points,
      pointsRedeemed: existing.pointsRedeemed + points,
    },
  })

  return c.json({ data: record })
})

// DELETE /api/loyalty/:id
loyalty.delete('/:id', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  const existing = await prisma.loyaltyMember.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!existing) return c.json({ error: 'Member not found' }, 404)

  await prisma.loyaltyMember.delete({ where: { id } })
  return c.json({ message: 'Deleted' })
})

export default loyalty
