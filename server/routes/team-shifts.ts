import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { type AppVariables, requireRole } from '../middleware/auth'

const teamShifts = new Hono<{ Variables: AppVariables }>()

// GET /api/team-shifts
teamShifts.get('/', async (c) => {
  const user = c.get('user')
  const page = Number(c.req.query('page') ?? '1')
  const perPage = Number(c.req.query('per_page') ?? '20')
  const assignee = c.req.query('assignee')
  const type = c.req.query('type')
  const status = c.req.query('status')
  const propertyId = c.req.query('property_id')
  const dateFrom = c.req.query('date_from')
  const dateTo = c.req.query('date_to')

  const where: any = { organizationId: user.organizationId }
  if (assignee) where.assignee = assignee
  if (type) where.type = type
  if (status) where.status = status
  if (propertyId) where.propertyId = propertyId
  if (dateFrom || dateTo) {
    where.date = {}
    if (dateFrom) where.date.gte = new Date(dateFrom)
    if (dateTo) where.date.lte = new Date(dateTo)
  }

  const [data, total] = await Promise.all([
    prisma.teamShift.findMany({
      where,
      include: { property: { select: { id: true, name: true } } },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.teamShift.count({ where }),
  ])

  return c.json({
    data,
    meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
  })
})

// GET /api/team-shifts/stats
teamShifts.get('/stats', async (c) => {
  const user = c.get('user')
  const orgFilter = { organizationId: user.organizationId }

  // This week stats
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  const [total, thisWeek, completed, cancelled, assignees] = await Promise.all([
    prisma.teamShift.count({ where: orgFilter }),
    prisma.teamShift.count({
      where: { ...orgFilter, date: { gte: weekStart, lte: weekEnd } },
    }),
    prisma.teamShift.count({
      where: { ...orgFilter, status: 'completed' },
    }),
    prisma.teamShift.count({
      where: { ...orgFilter, status: 'cancelled' },
    }),
    prisma.teamShift.groupBy({
      by: ['assignee'],
      where: orgFilter,
      _count: { id: true },
    }),
  ])

  return c.json({
    data: {
      total,
      thisWeek,
      completed,
      cancelled,
      uniqueAssignees: assignees.length,
      byAssignee: assignees.map((a) => ({
        assignee: a.assignee,
        count: a._count.id,
      })),
    },
  })
})

// GET /api/team-shifts/assignees — unique list of assignees
teamShifts.get('/assignees', async (c) => {
  const user = c.get('user')

  const assignees = await prisma.teamShift.groupBy({
    by: ['assignee'],
    where: { organizationId: user.organizationId },
    _count: { id: true },
  })

  return c.json({
    data: assignees.map((a) => ({ name: a.assignee, shifts: a._count.id })),
  })
})

// POST /api/team-shifts
teamShifts.post('/', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const body = await c.req.json()

  if (body.propertyId) {
    const property = await prisma.property.findFirst({
      where: { id: body.propertyId, organizationId: user.organizationId },
    })
    if (!property) return c.json({ error: 'Property not found' }, 404)
  }

  const record = await prisma.teamShift.create({
    data: {
      organizationId: user.organizationId,
      propertyId: body.propertyId || null,
      assignee: body.assignee,
      date: new Date(body.date),
      startTime: body.startTime,
      endTime: body.endTime,
      type: body.type,
      status: body.status || 'scheduled',
      notes: body.notes || null,
      hoursWorked: body.hoursWorked || null,
      createdBy: user.name || user.email,
    },
    include: { property: { select: { id: true, name: true } } },
  })

  return c.json({ data: record }, 201)
})

// PUT /api/team-shifts/:id
teamShifts.put('/:id', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const body = await c.req.json()

  const existing = await prisma.teamShift.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!existing) return c.json({ error: 'Shift not found' }, 404)

  const record = await prisma.teamShift.update({
    where: { id },
    data: {
      assignee: body.assignee ?? existing.assignee,
      date: body.date ? new Date(body.date) : existing.date,
      startTime: body.startTime ?? existing.startTime,
      endTime: body.endTime ?? existing.endTime,
      type: body.type ?? existing.type,
      status: body.status ?? existing.status,
      propertyId: body.propertyId !== undefined ? body.propertyId || null : existing.propertyId,
      notes: body.notes !== undefined ? body.notes : existing.notes,
      hoursWorked: body.hoursWorked !== undefined ? body.hoursWorked : existing.hoursWorked,
    },
    include: { property: { select: { id: true, name: true } } },
  })

  return c.json({ data: record })
})

// DELETE /api/team-shifts/:id
teamShifts.delete('/:id', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  const existing = await prisma.teamShift.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!existing) return c.json({ error: 'Shift not found' }, 404)

  await prisma.teamShift.delete({ where: { id } })
  return c.json({ data: { success: true } })
})

export default teamShifts
