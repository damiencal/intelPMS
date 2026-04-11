import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { type AppVariables } from '../middleware/auth'

const ownerStatements = new Hono<{ Variables: AppVariables }>()

// GET /api/owner-statements/:propertyId
ownerStatements.get('/:propertyId', async (c) => {
  const user = c.get('user')
  const propertyId = c.req.param('propertyId')
  const months = Number(c.req.query('months') ?? '3')

  const property = await prisma.property.findFirst({
    where: { id: propertyId, organizationId: user.organizationId },
    select: { id: true, name: true, currency: true },
  })
  if (!property) return c.json({ error: 'Property not found' }, 404)

  // Get date ranges for each month
  const statements = []
  const now = new Date()

  for (let i = 0; i < months; i++) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
    const monthLabel = monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

    const [reservations, expenses, maintenance] = await Promise.all([
      prisma.reservation.findMany({
        where: {
          propertyId,
          checkIn: { lte: monthEnd },
          checkOut: { gte: monthStart },
          status: { not: 'cancelled' },
        },
        select: { totalPrice: true, currency: true, guestName: true, checkIn: true, checkOut: true, channel: true },
      }),
      prisma.expense.findMany({
        where: {
          propertyId,
          date: { gte: monthStart, lte: monthEnd },
        },
        select: { amount: true, category: true, description: true, date: true },
      }),
      prisma.maintenanceRequest.findMany({
        where: {
          propertyId,
          createdAt: { gte: monthStart, lte: monthEnd },
        },
        select: { actualCost: true, estimatedCost: true, title: true, status: true },
      }),
    ])

    const totalRevenue = reservations.reduce((sum, r) => sum + (r.totalPrice ?? 0), 0)
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
    const totalMaintenanceCost = maintenance.reduce(
      (sum, m) => sum + (m.actualCost ?? m.estimatedCost ?? 0),
      0
    )

    // Expense breakdown
    const expensesByCategory = new Map<string, number>()
    for (const e of expenses) {
      expensesByCategory.set(e.category, (expensesByCategory.get(e.category) ?? 0) + e.amount)
    }

    statements.push({
      month: monthLabel,
      monthStart: monthStart.toISOString(),
      revenue: {
        total: totalRevenue,
        reservations: reservations.map((r) => ({
          guestName: r.guestName,
          checkIn: r.checkIn,
          checkOut: r.checkOut,
          amount: r.totalPrice,
          channel: r.channel,
        })),
      },
      expenses: {
        total: totalExpenses,
        byCategory: Array.from(expensesByCategory.entries()).map(([category, amount]) => ({
          category,
          amount,
        })),
        items: expenses,
      },
      maintenance: {
        total: totalMaintenanceCost,
        items: maintenance,
      },
      netIncome: totalRevenue - totalExpenses - totalMaintenanceCost,
    })
  }

  return c.json({
    data: {
      property,
      statements,
      summary: {
        totalRevenue: statements.reduce((s, st) => s + st.revenue.total, 0),
        totalExpenses: statements.reduce((s, st) => s + st.expenses.total, 0),
        totalMaintenance: statements.reduce((s, st) => s + st.maintenance.total, 0),
        netIncome: statements.reduce((s, st) => s + st.netIncome, 0),
      },
    },
  })
})

// GET /api/owner-statements — summary across all properties
ownerStatements.get('/', async (c) => {
  const user = c.get('user')
  const months = Number(c.req.query('months') ?? '1')

  const monthStart = new Date()
  monthStart.setMonth(monthStart.getMonth() - months)
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const properties = await prisma.property.findMany({
    where: { organizationId: user.organizationId },
    select: { id: true, name: true, currency: true },
  })

  const summaries = await Promise.all(
    properties.map(async (property) => {
      const [revAgg, expAgg] = await Promise.all([
        prisma.reservation.aggregate({
          where: {
            propertyId: property.id,
            checkIn: { gte: monthStart },
            status: { not: 'cancelled' },
          },
          _sum: { totalPrice: true },
          _count: true,
        }),
        prisma.expense.aggregate({
          where: {
            propertyId: property.id,
            date: { gte: monthStart },
          },
          _sum: { amount: true },
        }),
      ])

      const revenue = revAgg._sum.totalPrice ?? 0
      const expenses = expAgg._sum.amount ?? 0

      return {
        propertyId: property.id,
        propertyName: property.name,
        currency: property.currency,
        revenue,
        expenses,
        reservationCount: revAgg._count,
        netIncome: revenue - expenses,
      }
    })
  )

  return c.json({ data: summaries })
})

export default ownerStatements
