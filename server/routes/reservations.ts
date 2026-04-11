import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import type { AppVariables } from '../middleware/auth'

const reservations = new Hono<{ Variables: AppVariables }>()

// GET /api/reservations — all reservations across all properties
reservations.get('/', async (c) => {
  const user = c.get('user')
  const { page = '1', per_page = '20', status, property_id, search } = c.req.query()

  const skip = (parseInt(page) - 1) * parseInt(per_page)
  const take = parseInt(per_page)

  const where = {
    property: { organizationId: user.organizationId },
    ...(status ? { status } : {}),
    ...(property_id ? { propertyId: property_id } : {}),
    ...(search
      ? {
          OR: [
            { guestName: { contains: search } },
            { guestEmail: { contains: search } },
            { confirmationCode: { contains: search } },
          ],
        }
      : {}),
  }

  const [data, total] = await Promise.all([
    prisma.reservation.findMany({
      where,
      include: {
        property: { select: { id: true, name: true, imageUrl: true } },
      },
      orderBy: { checkIn: 'desc' },
      skip,
      take,
    }),
    prisma.reservation.count({ where }),
  ])

  return c.json({
    data,
    meta: {
      total,
      page: parseInt(page),
      perPage: parseInt(per_page),
      totalPages: Math.ceil(total / take),
    },
  })
})

// GET /api/reservations/upcoming — today's check-ins and check-outs + upcoming
reservations.get('/upcoming', async (c) => {
  const user = c.get('user')
  const days = Number(c.req.query('days') ?? '7')

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const endDate = new Date(today)
  endDate.setDate(endDate.getDate() + days)

  // Check-ins in range
  const checkIns = await prisma.reservation.findMany({
    where: {
      property: { organizationId: user.organizationId },
      checkIn: { gte: today, lt: endDate },
      status: { not: 'cancelled' },
    },
    include: {
      property: { select: { id: true, name: true } },
    },
    orderBy: { checkIn: 'asc' },
  })

  // Check-outs in range
  const checkOuts = await prisma.reservation.findMany({
    where: {
      property: { organizationId: user.organizationId },
      checkOut: { gte: today, lt: endDate },
      status: { not: 'cancelled' },
    },
    include: {
      property: { select: { id: true, name: true } },
    },
    orderBy: { checkOut: 'asc' },
  })

  // Current guests (checked in, haven't checked out yet)
  const currentGuests = await prisma.reservation.findMany({
    where: {
      property: { organizationId: user.organizationId },
      checkIn: { lte: today },
      checkOut: { gt: today },
      status: { not: 'cancelled' },
    },
    include: {
      property: { select: { id: true, name: true } },
    },
    orderBy: { checkOut: 'asc' },
  })

  return c.json({
    data: {
      checkIns,
      checkOuts,
      currentGuests,
      summary: {
        todayCheckIns: checkIns.filter(
          (r) => new Date(r.checkIn).toDateString() === today.toDateString()
        ).length,
        todayCheckOuts: checkOuts.filter(
          (r) => new Date(r.checkOut).toDateString() === today.toDateString()
        ).length,
        currentGuestsCount: currentGuests.length,
        upcomingCheckIns: checkIns.length,
      },
    },
  })
})

export default reservations
