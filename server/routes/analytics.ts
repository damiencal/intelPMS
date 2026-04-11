import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import type { AppVariables } from '../middleware/auth'

const analytics = new Hono<{ Variables: AppVariables }>()

// GET /api/analytics/dashboard
analytics.get('/dashboard', async (c) => {
  const user = c.get('user')
  const orgId = user.organizationId

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  // Run analytics queries in parallel
  const [
    propertyCount,
    listingCount,
    currentMonthRevenue,
    lastMonthRevenue,
    upcomingCheckIns,
    upcomingCheckOuts,
    pendingProposals,
    recentActivity,
    totalReservations,
  ] = await Promise.all([
    prisma.property.count({ where: { organizationId: orgId } }),
    prisma.listing.count({
      where: { property: { organizationId: orgId } },
    }),
    prisma.reservation.aggregate({
      where: {
        property: { organizationId: orgId },
        status: 'confirmed',
        checkIn: { gte: startOfMonth },
      },
      _sum: { totalPrice: true },
    }),
    prisma.reservation.aggregate({
      where: {
        property: { organizationId: orgId },
        status: 'confirmed',
        checkIn: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
      _sum: { totalPrice: true },
    }),
    prisma.reservation.count({
      where: {
        property: { organizationId: orgId },
        status: 'confirmed',
        checkIn: {
          gte: now,
          lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
    prisma.reservation.count({
      where: {
        property: { organizationId: orgId },
        status: 'confirmed',
        checkOut: {
          gte: now,
          lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
    prisma.pricingProposal.count({
      where: { organizationId: orgId, status: { in: ['draft', 'pending_review'] } },
    }),
    prisma.activityLog.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.reservation.count({
      where: { property: { organizationId: orgId } },
    }),
  ])

  return c.json({
    data: {
      properties: propertyCount,
      listings: listingCount,
      totalReservations,
      revenue: {
        currentMonth: currentMonthRevenue._sum.totalPrice || 0,
        lastMonth: lastMonthRevenue._sum.totalPrice || 0,
      },
      upcoming: {
        checkIns: upcomingCheckIns,
        checkOuts: upcomingCheckOuts,
      },
      pendingProposals,
      recentActivity,
    },
  })
})

// GET /api/analytics/revenue
analytics.get('/revenue', async (c) => {
  const user = c.get('user')
  const { months = '12' } = c.req.query()

  const monthsBack = parseInt(months)
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - monthsBack)

  const reservations = await prisma.reservation.findMany({
    where: {
      property: { organizationId: user.organizationId },
      status: 'confirmed',
      checkIn: { gte: startDate },
    },
    select: {
      checkIn: true,
      totalPrice: true,
      currency: true,
      channel: true,
      property: { select: { id: true, name: true } },
    },
    orderBy: { checkIn: 'asc' },
  })

  return c.json({ data: reservations })
})

// GET /api/analytics/occupancy
analytics.get('/occupancy', async (c) => {
  const user = c.get('user')

  const properties = await prisma.property.findMany({
    where: { organizationId: user.organizationId },
    select: {
      id: true,
      name: true,
      listings: {
        select: {
          id: true,
          channel: true,
          calendarEntries: {
            where: {
              date: {
                gte: new Date(),
                lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
              },
            },
            select: { date: true, available: true, price: true },
          },
        },
      },
    },
  })

  const occupancyData = properties.map((prop) => {
    const allEntries = prop.listings.flatMap((l) => l.calendarEntries)
    const total = allEntries.length
    const booked = allEntries.filter((e) => !e.available).length
    const avgPrice = allEntries.reduce((sum, e) => sum + (e.price || 0), 0) / (total || 1)

    return {
      propertyId: prop.id,
      propertyName: prop.name,
      totalDays: total,
      bookedDays: booked,
      occupancyRate: total > 0 ? (booked / total) * 100 : 0,
      averageDailyRate: avgPrice,
    }
  })

  return c.json({ data: occupancyData })
})

export default analytics
