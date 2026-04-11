import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { type AppVariables, requireRole } from '../middleware/auth'

const taxReports = new Hono<{ Variables: AppVariables }>()

// GET /api/tax-reports
taxReports.get('/', async (c) => {
  const user = c.get('user')
  const page = Number(c.req.query('page') ?? '1')
  const perPage = Number(c.req.query('per_page') ?? '20')
  const year = c.req.query('year')
  const period = c.req.query('period')
  const status = c.req.query('status')

  const where: any = { organizationId: user.organizationId }
  if (year) where.year = Number(year)
  if (period) where.period = period
  if (status) where.status = status

  const [data, total] = await Promise.all([
    prisma.taxReport.findMany({
      where,
      orderBy: [{ year: 'desc' }, { quarter: 'desc' }, { month: 'desc' }],
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.taxReport.count({ where }),
  ])

  return c.json({
    data,
    meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
  })
})

// GET /api/tax-reports/stats
taxReports.get('/stats', async (c) => {
  const user = c.get('user')
  const year = Number(c.req.query('year') ?? new Date().getFullYear())

  const reports = await prisma.taxReport.findMany({
    where: { organizationId: user.organizationId, year },
  })

  const totalIncome = reports.reduce((s, r) => s + r.totalIncome, 0)
  const totalExpenses = reports.reduce((s, r) => s + r.totalExpenses, 0)
  const totalEstimatedTax = reports.reduce((s, r) => s + r.estimatedTax, 0)
  const drafted = reports.filter((r) => r.status === 'draft').length
  const finalized = reports.filter((r) => r.status === 'finalized').length
  const filed = reports.filter((r) => r.status === 'filed').length

  return c.json({
    data: {
      year,
      totalReports: reports.length,
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      netIncome: Math.round((totalIncome - totalExpenses) * 100) / 100,
      totalEstimatedTax: Math.round(totalEstimatedTax * 100) / 100,
      drafted,
      finalized,
      filed,
    },
  })
})

// GET /api/tax-reports/:id
taxReports.get('/:id', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  const report = await prisma.taxReport.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!report) return c.json({ error: 'Tax report not found' }, 404)

  return c.json({ data: report })
})

// POST /api/tax-reports — create or auto-generate
taxReports.post('/', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const body = await c.req.json()

  // If auto-generate is requested, compute from actual data
  let totalIncome = body.totalIncome ?? 0
  let totalExpenses = body.totalExpenses ?? 0
  let propertyBreakdown = body.propertyBreakdown || null

  if (body.autoGenerate) {
    const { year, period, quarter, month } = body
    let dateFrom: Date
    let dateTo: Date

    if (period === 'monthly' && month) {
      dateFrom = new Date(year, month - 1, 1)
      dateTo = new Date(year, month, 0)
    } else if (period === 'quarterly' && quarter) {
      dateFrom = new Date(year, (quarter - 1) * 3, 1)
      dateTo = new Date(year, quarter * 3, 0)
    } else {
      dateFrom = new Date(year, 0, 1)
      dateTo = new Date(year, 11, 31)
    }

    // Fetch reservations for income
    const reservations = await prisma.reservation.findMany({
      where: {
        property: { organizationId: user.organizationId },
        checkIn: { lte: dateTo },
        checkOut: { gte: dateFrom },
        status: { not: 'cancelled' },
      },
      select: { propertyId: true, totalPrice: true, property: { select: { name: true } } },
    })

    // Fetch expenses
    const expenses = await prisma.expense.findMany({
      where: {
        organizationId: user.organizationId,
        date: { gte: dateFrom, lte: dateTo },
      },
      select: { propertyId: true, amount: true },
    })

    totalIncome = reservations.reduce((s, r) => s + (r.totalPrice || 0), 0)
    totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)

    // Property breakdown
    const properties = await prisma.property.findMany({
      where: { organizationId: user.organizationId },
      select: { id: true, name: true },
    })

    propertyBreakdown = properties.map((p) => ({
      propertyId: p.id,
      propertyName: p.name,
      income: reservations
        .filter((r) => r.propertyId === p.id)
        .reduce((s, r) => s + (r.totalPrice || 0), 0),
      expenses: expenses
        .filter((e) => e.propertyId === p.id)
        .reduce((s, e) => s + e.amount, 0),
    })).filter((p) => p.income > 0 || p.expenses > 0)
  }

  const netIncome = totalIncome - totalExpenses
  const taxRate = body.taxRate || 0
  const taxableAmount = body.taxableAmount ?? netIncome
  const estimatedTax = taxRate > 0 ? taxableAmount * (taxRate / 100) : 0

  const record = await prisma.taxReport.create({
    data: {
      organizationId: user.organizationId,
      name: body.name,
      period: body.period,
      year: body.year,
      quarter: body.quarter || null,
      month: body.month || null,
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      netIncome: Math.round(netIncome * 100) / 100,
      taxableAmount: Math.round(taxableAmount * 100) / 100,
      taxRate: taxRate || null,
      estimatedTax: Math.round(estimatedTax * 100) / 100,
      deductions: body.deductions ? (body.deductions as any) : undefined,
      propertyBreakdown: propertyBreakdown ? (propertyBreakdown as any) : undefined,
      status: body.status || 'draft',
      notes: body.notes || null,
      createdBy: user.name || user.email,
    },
  })

  return c.json({ data: record }, 201)
})

// PUT /api/tax-reports/:id
taxReports.put('/:id', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const body = await c.req.json()

  const existing = await prisma.taxReport.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!existing) return c.json({ error: 'Tax report not found' }, 404)

  const totalIncome = body.totalIncome ?? existing.totalIncome
  const totalExpenses = body.totalExpenses ?? existing.totalExpenses
  const netIncome = totalIncome - totalExpenses
  const taxRate = body.taxRate !== undefined ? body.taxRate : existing.taxRate
  const taxableAmount = body.taxableAmount ?? netIncome
  const estimatedTax = taxRate && taxRate > 0 ? taxableAmount * (taxRate / 100) : existing.estimatedTax

  const record = await prisma.taxReport.update({
    where: { id },
    data: {
      name: body.name ?? existing.name,
      period: body.period ?? existing.period,
      year: body.year ?? existing.year,
      quarter: body.quarter !== undefined ? body.quarter : existing.quarter,
      month: body.month !== undefined ? body.month : existing.month,
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      netIncome: Math.round(netIncome * 100) / 100,
      taxableAmount: Math.round(taxableAmount * 100) / 100,
      taxRate: taxRate || null,
      estimatedTax: Math.round(estimatedTax * 100) / 100,
      deductions: body.deductions !== undefined ? (body.deductions as any) : undefined,
      propertyBreakdown: body.propertyBreakdown !== undefined ? (body.propertyBreakdown as any) : undefined,
      status: body.status ?? existing.status,
      notes: body.notes !== undefined ? body.notes : existing.notes,
      filedAt: body.status === 'filed' && existing.status !== 'filed' ? new Date() : existing.filedAt,
    },
  })

  return c.json({ data: record })
})

// DELETE /api/tax-reports/:id
taxReports.delete('/:id', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  const existing = await prisma.taxReport.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!existing) return c.json({ error: 'Tax report not found' }, 404)

  await prisma.taxReport.delete({ where: { id } })
  return c.json({ data: { success: true } })
})

export default taxReports
