import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { type AppVariables, requireRole } from '../middleware/auth'

const guestCheckins = new Hono<{ Variables: AppVariables }>()

// GET /api/guest-checkins
guestCheckins.get('/', async (c) => {
  const user = c.get('user')
  const page = Number(c.req.query('page') ?? '1')
  const perPage = Number(c.req.query('per_page') ?? '20')
  const propertyId = c.req.query('property_id')
  const active = c.req.query('active')

  const where: any = { organizationId: user.organizationId }
  if (propertyId) where.propertyId = propertyId
  if (active === 'true') where.isActive = true
  if (active === 'false') where.isActive = false

  const [data, total] = await Promise.all([
    prisma.guestCheckin.findMany({
      where,
      include: { property: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.guestCheckin.count({ where }),
  ])

  return c.json({
    data,
    meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
  })
})

// GET /api/guest-checkins/:id
guestCheckins.get('/:id', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  const checkin = await prisma.guestCheckin.findFirst({
    where: { id, organizationId: user.organizationId },
    include: { property: { select: { id: true, name: true, address: true } } },
  })
  if (!checkin) return c.json({ error: 'Not found' }, 404)

  return c.json({ data: checkin })
})

// GET /api/guest-checkins/by-reservation/:reservationId (public-friendly)
guestCheckins.get('/by-reservation/:reservationId', async (c) => {
  const user = c.get('user')
  const reservationId = c.req.param('reservationId')

  const checkin = await prisma.guestCheckin.findFirst({
    where: {
      reservationId,
      organizationId: user.organizationId,
      isActive: true,
    },
    include: { property: { select: { id: true, name: true, address: true } } },
  })
  if (!checkin) return c.json({ error: 'Not found' }, 404)

  // Track view
  if (!checkin.viewedAt) {
    await prisma.guestCheckin.update({
      where: { id: checkin.id },
      data: { viewedAt: new Date() },
    })
  }

  return c.json({ data: checkin })
})

// POST /api/guest-checkins
guestCheckins.post('/', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const body = await c.req.json<{
    propertyId: string
    reservationId?: string
    guestName?: string
    accessCode?: string
    wifiName?: string
    wifiPassword?: string
    checkInTime?: string
    checkOutTime?: string
    instructions?: string
    houseRules?: string
    parkingInfo?: string
    emergencyContact?: string
    guidebookUrl?: string
  }>()

  // Verify property belongs to org
  const property = await prisma.property.findFirst({
    where: { id: body.propertyId, organizationId: user.organizationId },
  })
  if (!property) return c.json({ error: 'Property not found' }, 404)

  const checkin = await prisma.guestCheckin.create({
    data: {
      organizationId: user.organizationId,
      propertyId: body.propertyId,
      reservationId: body.reservationId,
      guestName: body.guestName,
      accessCode: body.accessCode,
      wifiName: body.wifiName,
      wifiPassword: body.wifiPassword,
      checkInTime: body.checkInTime,
      checkOutTime: body.checkOutTime,
      instructions: body.instructions,
      houseRules: body.houseRules,
      parkingInfo: body.parkingInfo,
      emergencyContact: body.emergencyContact,
      guidebookUrl: body.guidebookUrl,
    },
    include: { property: { select: { id: true, name: true } } },
  })

  await prisma.activityLog.create({
    data: {
      organizationId: user.organizationId,
      userId: user.id,
      type: 'guest_checkin_created',
      description: `Created check-in info for ${body.guestName ?? property.name}`,
      metadata: { checkinId: checkin.id },
    },
  })

  return c.json({ data: checkin }, 201)
})

// PUT /api/guest-checkins/:id
guestCheckins.put('/:id', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const body = await c.req.json()

  const existing = await prisma.guestCheckin.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!existing) return c.json({ error: 'Not found' }, 404)

  const checkin = await prisma.guestCheckin.update({
    where: { id },
    data: body,
    include: { property: { select: { id: true, name: true } } },
  })

  return c.json({ data: checkin })
})

// DELETE /api/guest-checkins/:id
guestCheckins.delete('/:id', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  const existing = await prisma.guestCheckin.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!existing) return c.json({ error: 'Not found' }, 404)

  await prisma.guestCheckin.delete({ where: { id } })
  return c.json({ success: true })
})

export default guestCheckins
