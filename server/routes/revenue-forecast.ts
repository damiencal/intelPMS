import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { type AppVariables } from '../middleware/auth'

const revenueForecast = new Hono<{ Variables: AppVariables }>()

// GET /api/revenue-forecast — monthly revenue forecast based on reservations & expenses
revenueForecast.get('/', async (c) => {
  const user = c.get('user')
  const months = Number(c.req.query('months') ?? '12')
  const propertyId = c.req.query('property_id')

  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1) // 6 months historical
  const endDate = new Date(now.getFullYear(), now.getMonth() + months, 0) // forecast ahead

  // Get all reservations in the range
  const reservationWhere: any = {
    property: { organizationId: user.organizationId },
    checkIn: { lte: endDate },
    checkOut: { gte: startDate },
    status: { not: 'cancelled' },
  }
  if (propertyId) reservationWhere.propertyId = propertyId

  const reservations = await prisma.reservation.findMany({
    where: reservationWhere,
    select: {
      checkIn: true,
      checkOut: true,
      totalPrice: true,
      status: true,
    },
  })

  // Get expenses in the range
  const expenseWhere: any = {
    organizationId: user.organizationId,
    date: { gte: startDate, lte: endDate },
  }
  if (propertyId) expenseWhere.propertyId = propertyId

  const expenses = await prisma.expense.findMany({
    where: expenseWhere,
    select: { date: true, amount: true },
  })

  // Build monthly buckets
  const monthlyData: Record<string, { revenue: number; expenses: number; bookings: number }> = {}

  // Initialize months
  for (let d = new Date(startDate); d <= endDate; d.setMonth(d.getMonth() + 1)) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthlyData[key] = { revenue: 0, expenses: 0, bookings: 0 }
  }

  // Distribute reservation revenue across months
  for (const r of reservations) {
    if (!r.totalPrice) continue
    const ci = new Date(r.checkIn)
    const co = new Date(r.checkOut)
    const totalNights = Math.max(1, Math.round((co.getTime() - ci.getTime()) / 86400000))
    const pricePerNight = r.totalPrice / totalNights

    for (let d = new Date(ci); d < co; d.setDate(d.getDate() + 1)) {
      if (d < startDate || d > endDate) continue
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (monthlyData[key]) {
        monthlyData[key].revenue += pricePerNight
      }
    }

    // Count booking in check-in month
    const ciKey = `${ci.getFullYear()}-${String(ci.getMonth() + 1).padStart(2, '0')}`
    if (monthlyData[ciKey]) monthlyData[ciKey].bookings++
  }

  // Add expenses
  for (const e of expenses) {
    const d = new Date(e.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (monthlyData[key]) monthlyData[key].expenses += e.amount
  }

  // Convert to sorted array
  const forecast = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      revenue: Math.round(data.revenue * 100) / 100,
      expenses: Math.round(data.expenses * 100) / 100,
      netIncome: Math.round((data.revenue - data.expenses) * 100) / 100,
      bookings: data.bookings,
      isForecast: month > `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    }))

  // Summary stats
  const historical = forecast.filter((m) => !m.isForecast)
  const projected = forecast.filter((m) => m.isForecast)
  const avgMonthlyRevenue = historical.length
    ? historical.reduce((s, m) => s + m.revenue, 0) / historical.length
    : 0
  const avgMonthlyExpenses = historical.length
    ? historical.reduce((s, m) => s + m.expenses, 0) / historical.length
    : 0
  const projectedAnnualRevenue = avgMonthlyRevenue * 12
  const projectedAnnualExpenses = avgMonthlyExpenses * 12

  return c.json({
    data: {
      months: forecast,
      summary: {
        avgMonthlyRevenue: Math.round(avgMonthlyRevenue * 100) / 100,
        avgMonthlyExpenses: Math.round(avgMonthlyExpenses * 100) / 100,
        avgMonthlyNet: Math.round((avgMonthlyRevenue - avgMonthlyExpenses) * 100) / 100,
        projectedAnnualRevenue: Math.round(projectedAnnualRevenue * 100) / 100,
        projectedAnnualExpenses: Math.round(projectedAnnualExpenses * 100) / 100,
        projectedAnnualNet: Math.round((projectedAnnualRevenue - projectedAnnualExpenses) * 100) / 100,
        totalBookings: forecast.reduce((s, m) => s + m.bookings, 0),
        historicalMonths: historical.length,
        forecastMonths: projected.length,
      },
    },
  })
})

// GET /api/revenue-forecast/by-property — revenue breakdown per property
revenueForecast.get('/by-property', async (c) => {
  const user = c.get('user')
  const year = Number(c.req.query('year') ?? new Date().getFullYear())

  const startDate = new Date(year, 0, 1)
  const endDate = new Date(year, 11, 31)

  const properties = await prisma.property.findMany({
    where: { organizationId: user.organizationId },
    select: { id: true, name: true },
  })

  const reservations = await prisma.reservation.findMany({
    where: {
      property: { organizationId: user.organizationId },
      checkIn: { lte: endDate },
      checkOut: { gte: startDate },
      status: { not: 'cancelled' },
    },
    select: { propertyId: true, totalPrice: true },
  })

  const expenses = await prisma.expense.findMany({
    where: {
      organizationId: user.organizationId,
      date: { gte: startDate, lte: endDate },
    },
    select: { propertyId: true, amount: true },
  })

  const breakdown = properties.map((p) => {
    const propRevenue = reservations
      .filter((r) => r.propertyId === p.id)
      .reduce((s, r) => s + (r.totalPrice || 0), 0)
    const propExpenses = expenses
      .filter((e) => e.propertyId === p.id)
      .reduce((s, e) => s + e.amount, 0)

    return {
      propertyId: p.id,
      propertyName: p.name,
      revenue: Math.round(propRevenue * 100) / 100,
      expenses: Math.round(propExpenses * 100) / 100,
      netIncome: Math.round((propRevenue - propExpenses) * 100) / 100,
      margin: propRevenue > 0 ? Math.round(((propRevenue - propExpenses) / propRevenue) * 10000) / 100 : 0,
    }
  })

  return c.json({
    data: breakdown.sort((a, b) => b.revenue - a.revenue),
  })
})

// GET /api/revenue-forecast/occupancy — occupancy rate trends
revenueForecast.get('/occupancy', async (c) => {
  const user = c.get('user')
  const months = Number(c.req.query('months') ?? '12')

  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1)

  const propertyCount = await prisma.property.count({
    where: { organizationId: user.organizationId },
  })

  const reservations = await prisma.reservation.findMany({
    where: {
      property: { organizationId: user.organizationId },
      checkIn: { lte: now },
      checkOut: { gte: startDate },
      status: { not: 'cancelled' },
    },
    select: { checkIn: true, checkOut: true },
  })

  // Build monthly occupancy
  const occupancy: { month: string; occupancyRate: number; bookedNights: number; totalNights: number }[] = []

  for (let m = 0; m < months; m++) {
    const monthStart = new Date(startDate.getFullYear(), startDate.getMonth() + m, 1)
    const monthEnd = new Date(startDate.getFullYear(), startDate.getMonth() + m + 1, 0)
    const daysInMonth = monthEnd.getDate()
    const totalNights = daysInMonth * Math.max(1, propertyCount)

    let bookedNights = 0
    for (const r of reservations) {
      const ci = new Date(Math.max(new Date(r.checkIn).getTime(), monthStart.getTime()))
      const co = new Date(Math.min(new Date(r.checkOut).getTime(), monthEnd.getTime()))
      if (ci < co) {
        bookedNights += Math.round((co.getTime() - ci.getTime()) / 86400000)
      }
    }

    occupancy.push({
      month: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`,
      occupancyRate: totalNights > 0 ? Math.round((bookedNights / totalNights) * 10000) / 100 : 0,
      bookedNights,
      totalNights,
    })
  }

  return c.json({ data: occupancy })
})

export default revenueForecast
