import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { requireRole, type AppVariables } from '../middleware/auth'

const expenses = new Hono<{ Variables: AppVariables }>()

// GET /api/expenses
expenses.get('/', async (c) => {
  const user = c.get('user')
  const {
    page = '1',
    per_page = '20',
    category,
    property_id,
    start_date,
    end_date,
  } = c.req.query()

  const skip = (parseInt(page) - 1) * parseInt(per_page)
  const take = parseInt(per_page)

  const where = {
    organizationId: user.organizationId,
    ...(category ? { category } : {}),
    ...(property_id ? { propertyId: property_id } : {}),
    ...(start_date || end_date
      ? {
          date: {
            ...(start_date ? { gte: new Date(start_date) } : {}),
            ...(end_date ? { lte: new Date(end_date) } : {}),
          },
        }
      : {}),
  }

  const [data, total, totalAmount] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: {
        property: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
      skip,
      take,
    }),
    prisma.expense.count({ where }),
    prisma.expense.aggregate({
      where,
      _sum: { amount: true },
    }),
  ])

  return c.json({
    data,
    meta: {
      total,
      page: parseInt(page),
      perPage: parseInt(per_page),
      totalPages: Math.ceil(total / take),
      totalAmount: totalAmount._sum.amount ?? 0,
    },
  })
})

// GET /api/expenses/summary — expense breakdown by category
expenses.get('/summary', async (c) => {
  const user = c.get('user')
  const months = Number(c.req.query('months') ?? '12')

  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months)

  const allExpenses = await prisma.expense.findMany({
    where: {
      organizationId: user.organizationId,
      date: { gte: startDate },
    },
    select: { category: true, amount: true, date: true },
  })

  // By category
  const categoryMap = new Map<string, number>()
  for (const e of allExpenses) {
    categoryMap.set(e.category, (categoryMap.get(e.category) ?? 0) + e.amount)
  }

  const byCategory = Array.from(categoryMap.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)

  // By month
  const monthlyMap = new Map<string, number>()
  for (const e of allExpenses) {
    const key = new Date(e.date).toISOString().slice(0, 7)
    monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + e.amount)
  }

  const monthly = Array.from(monthlyMap.entries())
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => a.month.localeCompare(b.month))

  const total = allExpenses.reduce((sum, e) => sum + e.amount, 0)

  return c.json({ data: { byCategory, monthly, total } })
})

// POST /api/expenses
expenses.post('/', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const body = await c.req.json<{
    propertyId?: string
    category: string
    description: string
    amount: number
    currency?: string
    date: string
    vendor?: string
    receiptUrl?: string
    recurring?: boolean
    notes?: string
  }>()

  const expense = await prisma.expense.create({
    data: {
      organizationId: user.organizationId,
      propertyId: body.propertyId || null,
      category: body.category,
      description: body.description,
      amount: body.amount,
      currency: body.currency ?? 'USD',
      date: new Date(body.date),
      vendor: body.vendor,
      receiptUrl: body.receiptUrl,
      recurring: body.recurring ?? false,
      notes: body.notes,
      createdBy: user.id,
    },
    include: {
      property: { select: { id: true, name: true } },
    },
  })

  await prisma.activityLog.create({
    data: {
      organizationId: user.organizationId,
      userId: user.id,
      type: 'expense_created',
      description: `Added expense: ${body.description} ($${body.amount})`,
      metadata: { expenseId: expense.id, category: body.category },
    },
  })

  return c.json({ data: expense }, 201)
})

// PUT /api/expenses/:id
expenses.put('/:id', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const body = await c.req.json<{
    propertyId?: string | null
    category?: string
    description?: string
    amount?: number
    currency?: string
    date?: string
    vendor?: string | null
    receiptUrl?: string | null
    recurring?: boolean
    notes?: string | null
  }>()

  const existing = await prisma.expense.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!existing) return c.json({ error: 'Expense not found' }, 404)

  const expense = await prisma.expense.update({
    where: { id },
    data: {
      ...(body.propertyId !== undefined && { propertyId: body.propertyId }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.amount !== undefined && { amount: body.amount }),
      ...(body.currency !== undefined && { currency: body.currency }),
      ...(body.date !== undefined && { date: new Date(body.date) }),
      ...(body.vendor !== undefined && { vendor: body.vendor }),
      ...(body.receiptUrl !== undefined && { receiptUrl: body.receiptUrl }),
      ...(body.recurring !== undefined && { recurring: body.recurring }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
    include: {
      property: { select: { id: true, name: true } },
    },
  })

  return c.json({ data: expense })
})

// DELETE /api/expenses/:id
expenses.delete('/:id', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  const existing = await prisma.expense.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!existing) return c.json({ error: 'Expense not found' }, 404)

  await prisma.expense.delete({ where: { id } })

  await prisma.activityLog.create({
    data: {
      organizationId: user.organizationId,
      userId: user.id,
      type: 'expense_deleted',
      description: `Deleted expense: ${existing.description}`,
      metadata: { expenseId: id },
    },
  })

  return c.json({ message: 'Deleted' })
})

export default expenses
