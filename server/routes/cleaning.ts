import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { type AppVariables } from '../middleware/auth'

const cleaning = new Hono<{ Variables: AppVariables }>()

// GET /api/cleaning
cleaning.get('/', async (c) => {
  const user = c.get('user')
  const {
    page = '1',
    per_page = '20',
    status,
    property_id,
    start_date,
    end_date,
    type,
  } = c.req.query()

  const skip = (parseInt(page) - 1) * parseInt(per_page)
  const take = parseInt(per_page)

  const where = {
    organizationId: user.organizationId,
    ...(status ? { status } : {}),
    ...(property_id ? { propertyId: property_id } : {}),
    ...(type ? { type } : {}),
    ...(start_date || end_date
      ? {
          scheduledDate: {
            ...(start_date ? { gte: new Date(start_date) } : {}),
            ...(end_date ? { lte: new Date(end_date) } : {}),
          },
        }
      : {}),
  }

  const [data, total] = await Promise.all([
    prisma.cleaningSchedule.findMany({
      where,
      include: {
        property: { select: { id: true, name: true } },
      },
      orderBy: { scheduledDate: 'asc' },
      skip,
      take,
    }),
    prisma.cleaningSchedule.count({ where }),
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

// GET /api/cleaning/upcoming — today and future
cleaning.get('/upcoming', async (c) => {
  const user = c.get('user')
  const days = Number(c.req.query('days') ?? '7')

  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + days)

  const data = await prisma.cleaningSchedule.findMany({
    where: {
      organizationId: user.organizationId,
      scheduledDate: { gte: start, lte: end },
      status: { in: ['pending', 'in_progress'] },
    },
    include: {
      property: { select: { id: true, name: true } },
    },
    orderBy: { scheduledDate: 'asc' },
  })

  return c.json({ data })
})

// GET /api/cleaning/stats
cleaning.get('/stats', async (c) => {
  const user = c.get('user')

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const weekEnd = new Date(today)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const [todayCount, weekCount, pending, completed] = await Promise.all([
    prisma.cleaningSchedule.count({
      where: {
        organizationId: user.organizationId,
        scheduledDate: { gte: today, lt: tomorrow },
        status: { in: ['pending', 'in_progress'] },
      },
    }),
    prisma.cleaningSchedule.count({
      where: {
        organizationId: user.organizationId,
        scheduledDate: { gte: today, lte: weekEnd },
        status: { in: ['pending', 'in_progress'] },
      },
    }),
    prisma.cleaningSchedule.count({
      where: { organizationId: user.organizationId, status: 'pending' },
    }),
    prisma.cleaningSchedule.count({
      where: { organizationId: user.organizationId, status: 'completed' },
    }),
  ])

  return c.json({ data: { today: todayCount, thisWeek: weekCount, pending, completed } })
})

// POST /api/cleaning
cleaning.post('/', async (c) => {
  const user = c.get('user')
  const body = await c.req.json<{
    propertyId: string
    reservationId?: string
    type: string
    scheduledDate: string
    scheduledTime?: string
    assignee?: string
    estimatedHours?: number
    cost?: number
    notes?: string
    checklist?: { item: string; done: boolean }[]
  }>()

  const schedule = await prisma.cleaningSchedule.create({
    data: {
      organizationId: user.organizationId,
      propertyId: body.propertyId,
      reservationId: body.reservationId,
      type: body.type,
      scheduledDate: new Date(body.scheduledDate),
      scheduledTime: body.scheduledTime,
      assignee: body.assignee,
      estimatedHours: body.estimatedHours ?? 2,
      cost: body.cost,
      notes: body.notes,
      checklist: body.checklist ? JSON.stringify(body.checklist) : undefined,
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
      type: 'cleaning_scheduled',
      description: `Scheduled ${body.type} cleaning for ${(schedule as any).property?.name ?? 'property'}`,
      metadata: { cleaningId: schedule.id },
    },
  })

  return c.json({ data: schedule }, 201)
})

// PUT /api/cleaning/:id
cleaning.put('/:id', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const body = await c.req.json<{
    type?: string
    status?: string
    scheduledDate?: string
    scheduledTime?: string | null
    assignee?: string | null
    estimatedHours?: number | null
    actualHours?: number | null
    cost?: number | null
    notes?: string | null
    checklist?: { item: string; done: boolean }[]
  }>()

  const existing = await prisma.cleaningSchedule.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!existing) return c.json({ error: 'Not found' }, 404)

  const isCompleting = body.status === 'completed' && existing.status !== 'completed'

  const schedule = await prisma.cleaningSchedule.update({
    where: { id },
    data: {
      ...(body.type !== undefined && { type: body.type }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.scheduledDate !== undefined && { scheduledDate: new Date(body.scheduledDate) }),
      ...(body.scheduledTime !== undefined && { scheduledTime: body.scheduledTime }),
      ...(body.assignee !== undefined && { assignee: body.assignee }),
      ...(body.estimatedHours !== undefined && { estimatedHours: body.estimatedHours }),
      ...(body.actualHours !== undefined && { actualHours: body.actualHours }),
      ...(body.cost !== undefined && { cost: body.cost }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.checklist !== undefined && { checklist: JSON.stringify(body.checklist) }),
      ...(isCompleting && { completedAt: new Date() }),
    },
    include: {
      property: { select: { id: true, name: true } },
    },
  })

  return c.json({ data: schedule })
})

// DELETE /api/cleaning/:id
cleaning.delete('/:id', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  const existing = await prisma.cleaningSchedule.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!existing) return c.json({ error: 'Not found' }, 404)

  await prisma.cleaningSchedule.delete({ where: { id } })
  return c.json({ message: 'Deleted' })
})

export default cleaning
