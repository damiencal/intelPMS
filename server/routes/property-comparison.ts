import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { type AppVariables } from '../middleware/auth'

const propertyComparison = new Hono<{ Variables: AppVariables }>()

// GET /api/property-comparison — side-by-side property performance
propertyComparison.get('/', async (c) => {
  const user = c.get('user')
  const year = Number(c.req.query('year') ?? new Date().getFullYear())
  const dateFrom = new Date(year, 0, 1)
  const dateTo = new Date(year, 11, 31)

  const properties = await prisma.property.findMany({
    where: { organizationId: user.organizationId },
    select: { id: true, name: true, address: true, imageUrl: true, currency: true },
  })

  const [reservations, expenses, reviews, maintenanceReqs] = await Promise.all([
    prisma.reservation.findMany({
      where: {
        property: { organizationId: user.organizationId },
        checkIn: { lte: dateTo },
        checkOut: { gte: dateFrom },
        status: { not: 'cancelled' },
      },
      select: { propertyId: true, totalPrice: true, checkIn: true, checkOut: true, numGuests: true },
    }),
    prisma.expense.findMany({
      where: {
        organizationId: user.organizationId,
        date: { gte: dateFrom, lte: dateTo },
      },
      select: { propertyId: true, amount: true },
    }),
    prisma.review.findMany({
      where: { property: { organizationId: user.organizationId } },
      select: { propertyId: true, rating: true },
    }),
    prisma.maintenanceRequest.findMany({
      where: {
        organizationId: user.organizationId,
        createdAt: { gte: dateFrom, lte: dateTo },
      },
      select: { propertyId: true, status: true, actualCost: true },
    }),
  ])

  const comparison = properties.map((p) => {
    const propRes = reservations.filter((r) => r.propertyId === p.id)
    const propExp = expenses.filter((e) => e.propertyId === p.id)
    const propRev = reviews.filter((r) => r.propertyId === p.id)
    const propMaint = maintenanceReqs.filter((m) => m.propertyId === p.id)

    const totalRevenue = propRes.reduce((s, r) => s + (r.totalPrice || 0), 0)
    const totalExpenses = propExp.reduce((s, e) => s + e.amount, 0)
    const totalBookings = propRes.length
    const avgRating = propRev.length
      ? propRev.reduce((s, r) => s + (r.rating || 0), 0) / propRev.length
      : null
    const maintenanceCost = propMaint.reduce((s, m) => s + (m.actualCost || 0), 0)

    // Calculate occupancy (rough: total booked nights / days in year)
    let bookedNights = 0
    for (const r of propRes) {
      const ci = new Date(Math.max(new Date(r.checkIn).getTime(), dateFrom.getTime()))
      const co = new Date(Math.min(new Date(r.checkOut).getTime(), dateTo.getTime()))
      if (ci < co) bookedNights += Math.round((co.getTime() - ci.getTime()) / 86400000)
    }
    const daysInYear = 365
    const occupancyRate = Math.round((bookedNights / daysInYear) * 10000) / 100

    const avgNightlyRate = bookedNights > 0 ? totalRevenue / bookedNights : 0
    const revPAR = totalRevenue / daysInYear // Revenue per available room-night

    return {
      propertyId: p.id,
      propertyName: p.name,
      address: p.address,
      imageUrl: p.imageUrl,
      currency: p.currency,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      netIncome: Math.round((totalRevenue - totalExpenses) * 100) / 100,
      margin: totalRevenue > 0
        ? Math.round(((totalRevenue - totalExpenses) / totalRevenue) * 10000) / 100
        : 0,
      totalBookings,
      occupancyRate,
      bookedNights,
      avgNightlyRate: Math.round(avgNightlyRate * 100) / 100,
      revPAR: Math.round(revPAR * 100) / 100,
      avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
      totalReviews: propRev.length,
      maintenanceRequests: propMaint.length,
      maintenanceCost: Math.round(maintenanceCost * 100) / 100,
    }
  })

  // Sort by revenue descending
  comparison.sort((a, b) => b.totalRevenue - a.totalRevenue)

  // Compute averages across portfolio
  const avgRevenue = comparison.length ? comparison.reduce((s, p) => s + p.totalRevenue, 0) / comparison.length : 0
  const avgOccupancy = comparison.length ? comparison.reduce((s, p) => s + p.occupancyRate, 0) / comparison.length : 0
  const avgNightly = comparison.length ? comparison.reduce((s, p) => s + p.avgNightlyRate, 0) / comparison.length : 0

  return c.json({
    data: {
      properties: comparison,
      portfolio: {
        totalProperties: comparison.length,
        avgRevenue: Math.round(avgRevenue * 100) / 100,
        avgOccupancy: Math.round(avgOccupancy * 100) / 100,
        avgNightlyRate: Math.round(avgNightly * 100) / 100,
        totalRevenue: Math.round(comparison.reduce((s, p) => s + p.totalRevenue, 0) * 100) / 100,
        totalExpenses: Math.round(comparison.reduce((s, p) => s + p.totalExpenses, 0) * 100) / 100,
        totalNet: Math.round(comparison.reduce((s, p) => s + p.netIncome, 0) * 100) / 100,
      },
    },
  })
})

export default propertyComparison
