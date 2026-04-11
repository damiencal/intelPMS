import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { type AppVariables, requireRole } from '../middleware/auth'

const utilities = new Hono<{ Variables: AppVariables }>()

// GET /api/utilities
utilities.get('/', async (c) => {
  const user = c.get('user')
  const page = Number(c.req.query('page') ?? '1')
  const perPage = Number(c.req.query('per_page') ?? '20')
  const propertyId = c.req.query('property_id')
  const utilityType = c.req.query('utility_type')
  const status = c.req.query('status')
  const search = c.req.query('search')

  const where: any = { organizationId: user.organizationId }
  if (propertyId) where.propertyId = propertyId
  if (utilityType) where.utilityType = utilityType
  if (status) where.status = status
  if (search) {
    where.OR = [
      { provider: { contains: search } },
      { accountNumber: { contains: search } },
    ]
  }

  const [data, total] = await Promise.all([
    prisma.utilityBill.findMany({
      where,
      include: { property: { select: { id: true, name: true } } },
      orderBy: { billingPeriodEnd: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.utilityBill.count({ where }),
  ])

  return c.json({
    data,
    meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
  })
})

// GET /api/utilities/stats
utilities.get('/stats', async (c) => {
  const user = c.get('user')
  const orgFilter = { organizationId: user.organizationId }

  const bills = await prisma.utilityBill.findMany({
    where: orgFilter,
    select: { utilityType: true, amount: true, status: true, billingPeriodEnd: true },
  })

  const totalBills = bills.length
  const totalAmount = Math.round(bills.reduce((s, b) => s + b.amount, 0) * 100) / 100
  const pending = bills.filter((b) => b.status === 'pending')
  const overdue = bills.filter((b) => b.status === 'overdue')
  const pendingAmount = Math.round(pending.reduce((s, b) => s + b.amount, 0) * 100) / 100
  const overdueAmount = Math.round(overdue.reduce((s, b) => s + b.amount, 0) * 100) / 100

  // Breakdown by type
  const byType: Record<string, { count: number; total: number }> = {}
  for (const bill of bills) {
    if (!byType[bill.utilityType]) {
      byType[bill.utilityType] = { count: 0, total: 0 }
    }
    byType[bill.utilityType].count++
    byType[bill.utilityType].total += bill.amount
  }

  // Round totals
  for (const key of Object.keys(byType)) {
    byType[key].total = Math.round(byType[key].total * 100) / 100
  }

  // Monthly trend (last 12 months)
  const now = new Date()
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)
  const recentBills = bills.filter((b) => b.billingPeriodEnd >= twelveMonthsAgo)
  const monthlyTrend: { month: string; amount: number }[] = []

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    const monthBills = recentBills.filter((b) => {
      const end = new Date(b.billingPeriodEnd)
      return end.getFullYear() === d.getFullYear() && end.getMonth() === d.getMonth()
    })
    monthlyTrend.push({
      month: monthKey,
      amount: Math.round(monthBills.reduce((s, b) => s + b.amount, 0) * 100) / 100,
    })
  }

  return c.json({
    data: {
      totalBills,
      totalAmount,
      pendingCount: pending.length,
      pendingAmount,
      overdueCount: overdue.length,
      overdueAmount,
      byType,
      monthlyTrend,
    },
  })
})

// POST /api/utilities
utilities.post('/', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const body = await c.req.json()

  const property = await prisma.property.findFirst({
    where: { id: body.propertyId, organizationId: user.organizationId },
  })
  if (!property) return c.json({ error: 'Property not found' }, 404)

  const record = await prisma.utilityBill.create({
    data: {
      organizationId: user.organizationId,
      propertyId: body.propertyId,
      utilityType: body.utilityType,
      provider: body.provider || null,
      accountNumber: body.accountNumber || null,
      billingPeriodStart: new Date(body.billingPeriodStart),
      billingPeriodEnd: new Date(body.billingPeriodEnd),
      amount: body.amount,
      currency: body.currency || 'USD',
      usage: body.usage || null,
      usageUnit: body.usageUnit || null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      paidDate: body.paidDate ? new Date(body.paidDate) : null,
      status: body.status || 'pending',
      notes: body.notes || null,
    },
    include: { property: { select: { id: true, name: true } } },
  })

  return c.json({ data: record }, 201)
})

// PUT /api/utilities/:id
utilities.put('/:id', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const body = await c.req.json()

  const existing = await prisma.utilityBill.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!existing) return c.json({ error: 'Bill not found' }, 404)

  const record = await prisma.utilityBill.update({
    where: { id },
    data: {
      utilityType: body.utilityType ?? existing.utilityType,
      provider: body.provider !== undefined ? body.provider : existing.provider,
      accountNumber: body.accountNumber !== undefined ? body.accountNumber : existing.accountNumber,
      billingPeriodStart: body.billingPeriodStart
        ? new Date(body.billingPeriodStart)
        : existing.billingPeriodStart,
      billingPeriodEnd: body.billingPeriodEnd
        ? new Date(body.billingPeriodEnd)
        : existing.billingPeriodEnd,
      amount: body.amount ?? existing.amount,
      currency: body.currency ?? existing.currency,
      usage: body.usage !== undefined ? body.usage : existing.usage,
      usageUnit: body.usageUnit !== undefined ? body.usageUnit : existing.usageUnit,
      dueDate: body.dueDate ? new Date(body.dueDate) : existing.dueDate,
      paidDate: body.paidDate ? new Date(body.paidDate) : existing.paidDate,
      status: body.status ?? existing.status,
      notes: body.notes !== undefined ? body.notes : existing.notes,
    },
    include: { property: { select: { id: true, name: true } } },
  })

  return c.json({ data: record })
})

// DELETE /api/utilities/:id
utilities.delete('/:id', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  const existing = await prisma.utilityBill.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!existing) return c.json({ error: 'Bill not found' }, 404)

  await prisma.utilityBill.delete({ where: { id } })
  return c.json({ message: 'Deleted' })
})

export default utilities
