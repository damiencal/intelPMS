import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import type { AppVariables } from '../middleware/auth'

const reports = new Hono<{ Variables: AppVariables }>()

// GET /api/reports/revenue — revenue breakdown by property and month
reports.get('/revenue', async (c) => {
  const user = c.get('user')
  const months = Number(c.req.query('months') ?? '12')
  const propertyId = c.req.query('property_id')

  // Get properties for org
  const properties = await prisma.property.findMany({
    where: {
      organizationId: user.organizationId,
      ...(propertyId ? { id: propertyId } : {}),
    },
    select: { id: true, name: true, currency: true },
  })

  const propertyIds = properties.map((p) => p.id)

  // Fetch all reservations in the time range
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months)

  const reservations = await prisma.reservation.findMany({
    where: {
      propertyId: { in: propertyIds },
      checkIn: { gte: startDate },
      status: { not: 'cancelled' },
    },
    select: {
      propertyId: true,
      totalPrice: true,
      currency: true,
      checkIn: true,
      checkOut: true,
      numGuests: true,
      channel: true,
      status: true,
    },
  })

  // Build monthly breakdown
  const monthlyMap = new Map<
    string,
    { month: string; revenue: number; bookings: number; nights: number }
  >()

  for (const r of reservations) {
    const monthKey = new Date(r.checkIn).toISOString().slice(0, 7) // YYYY-MM
    const existing = monthlyMap.get(monthKey) ?? {
      month: monthKey,
      revenue: 0,
      bookings: 0,
      nights: 0,
    }
    existing.revenue += r.totalPrice ?? 0
    existing.bookings += 1
    const nights = Math.max(
      1,
      Math.round(
        (new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    )
    existing.nights += nights
    monthlyMap.set(monthKey, existing)
  }

  const monthlyRevenue = Array.from(monthlyMap.values()).sort((a, b) =>
    a.month.localeCompare(b.month)
  )

  // Property breakdown
  const propertyBreakdown = properties.map((prop) => {
    const propReservations = reservations.filter((r) => r.propertyId === prop.id)
    const revenue = propReservations.reduce(
      (sum, r) => sum + (r.totalPrice ?? 0),
      0
    )
    const nights = propReservations.reduce((sum, r) => {
      return (
        sum +
        Math.max(
          1,
          Math.round(
            (new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        )
      )
    }, 0)
    return {
      id: prop.id,
      name: prop.name,
      currency: prop.currency,
      revenue,
      bookings: propReservations.length,
      nights,
      avgNightlyRate: nights > 0 ? revenue / nights : 0,
    }
  })

  // Channel breakdown
  const channelMap = new Map<
    string,
    { channel: string; revenue: number; bookings: number }
  >()
  for (const r of reservations) {
    const ch = r.channel ?? 'direct'
    const existing = channelMap.get(ch) ?? {
      channel: ch,
      revenue: 0,
      bookings: 0,
    }
    existing.revenue += r.totalPrice ?? 0
    existing.bookings += 1
    channelMap.set(ch, existing)
  }

  const channelBreakdown = Array.from(channelMap.values()).sort(
    (a, b) => b.revenue - a.revenue
  )

  // Totals
  const totalRevenue = reservations.reduce(
    (sum, r) => sum + (r.totalPrice ?? 0),
    0
  )
  const totalBookings = reservations.length
  const totalNights = reservations.reduce((sum, r) => {
    return (
      sum +
      Math.max(
        1,
        Math.round(
          (new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      )
    )
  }, 0)

  return c.json({
    data: {
      totals: {
        revenue: totalRevenue,
        bookings: totalBookings,
        nights: totalNights,
        avgNightlyRate: totalNights > 0 ? totalRevenue / totalNights : 0,
        properties: properties.length,
      },
      monthlyRevenue,
      propertyBreakdown,
      channelBreakdown,
    },
  })
})

// GET /api/reports/occupancy — occupancy rates per property
reports.get('/occupancy', async (c) => {
  const user = c.get('user')
  const months = Number(c.req.query('months') ?? '3')

  const properties = await prisma.property.findMany({
    where: { organizationId: user.organizationId },
    select: {
      id: true,
      name: true,
      listings: { select: { id: true } },
    },
  })

  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months)
  const endDate = new Date()

  const totalDays =
    Math.round(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1

  const results = await Promise.all(
    properties.map(async (prop) => {
      const listingIds = prop.listings.map((l) => l.id)
      if (listingIds.length === 0) {
        return {
          id: prop.id,
          name: prop.name,
          totalDays,
          bookedDays: 0,
          occupancyRate: 0,
        }
      }

      // Count distinct booked dates from calendar entries
      const bookedCount = await prisma.calendarEntry.count({
        where: {
          listingId: { in: listingIds },
          date: { gte: startDate, lte: endDate },
          available: false,
        },
      })

      // Normalize by number of listings
      const effectiveBookedDays = Math.round(bookedCount / listingIds.length)

      return {
        id: prop.id,
        name: prop.name,
        totalDays,
        bookedDays: effectiveBookedDays,
        occupancyRate:
          totalDays > 0
            ? Math.round((effectiveBookedDays / totalDays) * 100)
            : 0,
      }
    })
  )

  return c.json({ data: results })
})

export default reports
