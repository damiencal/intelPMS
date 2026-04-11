import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { type AppVariables } from '../middleware/auth'

const portfolio = new Hono<{ Variables: AppVariables }>()

// GET /api/portfolio — Aggregated multi-property dashboard
portfolio.get('/', async (c) => {
  const user = c.get('user')
  const orgFilter = { organizationId: user.organizationId }

  // Get all properties
  const properties = await prisma.property.findMany({
    where: orgFilter,
    select: {
      id: true,
      name: true,
      address: true,
      currency: true,
      imageUrl: true,
    },
  })

  const propertyIds = properties.map((p) => p.id)

  // Parallel aggregations
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

  const [
    reservations,
    recentReservations,
    expenses,
    recentExpenses,
    reviews,
    maintenanceRequests,
    listings,
  ] = await Promise.all([
    // All reservations (filter via property)
    prisma.reservation.findMany({
      where: { property: { organizationId: user.organizationId } },
      select: {
        propertyId: true,
        totalPrice: true,
        status: true,
        checkIn: true,
        checkOut: true,
      },
    }),
    // Recent reservations (30 days)
    prisma.reservation.findMany({
      where: {
        property: { organizationId: user.organizationId },
        checkIn: { gte: thirtyDaysAgo },
      },
      select: {
        propertyId: true,
        totalPrice: true,
        status: true,
        checkIn: true,
        checkOut: true,
      },
    }),
    // All expenses
    prisma.expense.findMany({
      where: { organizationId: user.organizationId },
      select: {
        propertyId: true,
        amount: true,
        date: true,
        category: true,
      },
    }),
    // Recent expenses (30 days)
    prisma.expense.findMany({
      where: {
        organizationId: user.organizationId,
        date: { gte: thirtyDaysAgo },
      },
      select: { propertyId: true, amount: true },
    }),
    // Reviews (filter via property)
    prisma.review.findMany({
      where: { property: { organizationId: user.organizationId } },
      select: {
        propertyId: true,
        rating: true,
        createdAt: true,
      },
    }),
    // Maintenance requests
    prisma.maintenanceRequest.findMany({
      where: { organizationId: user.organizationId },
      select: {
        propertyId: true,
        status: true,
        priority: true,
      },
    }),
    // Listings for base price
    prisma.listing.findMany({
      where: {
        property: { organizationId: user.organizationId },
      },
      select: {
        propertyId: true,
        basePrice: true,
        channel: true,
      },
    }),
  ])

  // Per-property aggregation
  const propertyMetrics = properties.map((prop) => {
    const propReservations = reservations.filter((r) => r.propertyId === prop.id)
    const propRecentRes = recentReservations.filter((r) => r.propertyId === prop.id)
    const propExpenses = expenses.filter((e) => e.propertyId === prop.id)
    const propRecentExp = recentExpenses.filter((e) => e.propertyId === prop.id)
    const propReviews = reviews.filter((r) => r.propertyId === prop.id)
    const propMaintenance = maintenanceRequests.filter((m) => m.propertyId === prop.id)
    const propListings = listings.filter((l) => l.propertyId === prop.id)

    const totalRevenue = propReservations.reduce((s, r) => s + (r.totalPrice || 0), 0)
    const recentRevenue = propRecentRes.reduce((s, r) => s + (r.totalPrice || 0), 0)
    const totalExpenses = propExpenses.reduce((s, e) => s + (e.amount || 0), 0)
    const recentExpenseTotal = propRecentExp.reduce((s, e) => s + (e.amount || 0), 0)

    const ratedReviews = propReviews.filter((r) => r.rating != null)
    const avgRating =
      ratedReviews.length > 0
        ? Math.round((ratedReviews.reduce((s, r) => s + (r.rating ?? 0), 0) / ratedReviews.length) * 100) /
          100
        : null

    // Occupancy estimation (last 90 days)
    const ninetyDayRes = propReservations.filter(
      (r) => new Date(r.checkIn) >= ninetyDaysAgo && r.status !== 'cancelled'
    )
    let bookedNights = 0
    ninetyDayRes.forEach((r) => {
      const ci = new Date(r.checkIn)
      const co = new Date(r.checkOut)
      bookedNights += Math.max(0, (co.getTime() - ci.getTime()) / (24 * 60 * 60 * 1000))
    })
    const occupancyRate = Math.min(100, Math.round((bookedNights / 90) * 100 * 100) / 100)

    const openMaintenance = propMaintenance.filter(
      (m) => m.status === 'open' || m.status === 'in_progress'
    ).length

    return {
      ...prop,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      recentRevenue: Math.round(recentRevenue * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      recentExpenses: Math.round(recentExpenseTotal * 100) / 100,
      netIncome: Math.round((totalRevenue - totalExpenses) * 100) / 100,
      totalReservations: propReservations.length,
      recentReservations: propRecentRes.length,
      avgRating,
      reviewCount: propReviews.length,
      occupancyRate,
      openMaintenance,
      channelCount: propListings.length,
      avgNightlyRate:
        propListings.length > 0
          ? Math.round(
              (propListings.reduce((s, l) => s + (l.basePrice || 0), 0) / propListings.length) *
                100
            ) / 100
          : 0,
    }
  })

  // Portfolio-level summary
  const summary = {
    totalProperties: properties.length,
    totalRevenue: Math.round(propertyMetrics.reduce((s, p) => s + p.totalRevenue, 0) * 100) / 100,
    recentRevenue:
      Math.round(propertyMetrics.reduce((s, p) => s + p.recentRevenue, 0) * 100) / 100,
    totalExpenses:
      Math.round(propertyMetrics.reduce((s, p) => s + p.totalExpenses, 0) * 100) / 100,
    totalNetIncome:
      Math.round(propertyMetrics.reduce((s, p) => s + p.netIncome, 0) * 100) / 100,
    avgOccupancy:
      propertyMetrics.length > 0
        ? Math.round(
            (propertyMetrics.reduce((s, p) => s + p.occupancyRate, 0) / propertyMetrics.length) *
              100
          ) / 100
        : 0,
    avgRating:
      propertyMetrics.filter((p) => p.avgRating).length > 0
        ? Math.round(
            (propertyMetrics.filter((p) => p.avgRating).reduce((s, p) => s + p.avgRating!, 0) /
              propertyMetrics.filter((p) => p.avgRating).length) *
              100
          ) / 100
        : null,
    totalReservations: propertyMetrics.reduce((s, p) => s + p.totalReservations, 0),
    totalOpenMaintenance: propertyMetrics.reduce((s, p) => s + p.openMaintenance, 0),
  }

  // Top performers
  const topByRevenue = [...propertyMetrics].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5)
  const topByOccupancy = [...propertyMetrics].sort((a, b) => b.occupancyRate - a.occupancyRate).slice(0, 5)
  const topByRating = [...propertyMetrics]
    .filter((p) => p.avgRating != null)
    .sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0))
    .slice(0, 5)

  return c.json({
    data: {
      summary,
      properties: propertyMetrics,
      rankings: {
        topByRevenue: topByRevenue.map((p) => ({ id: p.id, name: p.name, value: p.totalRevenue })),
        topByOccupancy: topByOccupancy.map((p) => ({
          id: p.id,
          name: p.name,
          value: p.occupancyRate,
        })),
        topByRating: topByRating.map((p) => ({ id: p.id, name: p.name, value: p.avgRating })),
      },
    },
  })
})

export default portfolio
