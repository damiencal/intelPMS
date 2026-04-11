import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { requireRole, type AppVariables } from '../middleware/auth'

const maintenance = new Hono<{ Variables: AppVariables }>()

// GET /api/maintenance
maintenance.get('/', async (c) => {
  const user = c.get('user')
  const {
    page = '1',
    per_page = '20',
    status,
    priority,
    property_id,
  } = c.req.query()

  const skip = (parseInt(page) - 1) * parseInt(per_page)
  const take = parseInt(per_page)

  const where = {
    organizationId: user.organizationId,
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
    ...(property_id ? { propertyId: property_id } : {}),
  }

  const [data, total] = await Promise.all([
    prisma.maintenanceRequest.findMany({
      where,
      include: {
        property: { select: { id: true, name: true } },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      skip,
      take,
    }),
    prisma.maintenanceRequest.count({ where }),
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

// GET /api/maintenance/stats
maintenance.get('/stats', async (c) => {
  const user = c.get('user')

  const [open, inProgress, completed, urgent] = await Promise.all([
    prisma.maintenanceRequest.count({
      where: { organizationId: user.organizationId, status: 'open' },
    }),
    prisma.maintenanceRequest.count({
      where: { organizationId: user.organizationId, status: 'in_progress' },
    }),
    prisma.maintenanceRequest.count({
      where: { organizationId: user.organizationId, status: 'completed' },
    }),
    prisma.maintenanceRequest.count({
      where: { organizationId: user.organizationId, priority: 'urgent' },
    }),
  ])

  return c.json({
    data: { open, inProgress, completed, urgent },
  })
})

// POST /api/maintenance
maintenance.post('/', async (c) => {
  const user = c.get('user')
  const body = await c.req.json<{
    propertyId: string
    title: string
    description?: string
    priority?: string
    category?: string
    assignee?: string
    estimatedCost?: number
    scheduledDate?: string
  }>()

  const request = await prisma.maintenanceRequest.create({
    data: {
      organizationId: user.organizationId,
      propertyId: body.propertyId,
      title: body.title,
      description: body.description,
      priority: body.priority ?? 'medium',
      status: 'open',
      category: body.category,
      assignee: body.assignee,
      estimatedCost: body.estimatedCost,
      scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : null,
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
      type: 'maintenance_created',
      description: `Created maintenance request: ${body.title}`,
      metadata: { requestId: request.id, priority: body.priority ?? 'medium' },
    },
  })

  return c.json({ data: request }, 201)
})

// PUT /api/maintenance/:id
maintenance.put('/:id', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const body = await c.req.json<{
    title?: string
    description?: string | null
    priority?: string
    status?: string
    category?: string | null
    assignee?: string | null
    estimatedCost?: number | null
    actualCost?: number | null
    scheduledDate?: string | null
    completedDate?: string | null
    photos?: string[]
  }>()

  const existing = await prisma.maintenanceRequest.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!existing) return c.json({ error: 'Request not found' }, 404)

  const wasCompleted = existing.status === 'completed'
  const isNowCompleted = body.status === 'completed'

  const request = await prisma.maintenanceRequest.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.assignee !== undefined && { assignee: body.assignee }),
      ...(body.estimatedCost !== undefined && { estimatedCost: body.estimatedCost }),
      ...(body.actualCost !== undefined && { actualCost: body.actualCost }),
      ...(body.scheduledDate !== undefined && {
        scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : null,
      }),
      ...(body.photos !== undefined && { photos: JSON.stringify(body.photos) }),
      ...(isNowCompleted && !wasCompleted && {
        completedDate: body.completedDate ? new Date(body.completedDate) : new Date(),
      }),
    },
    include: {
      property: { select: { id: true, name: true } },
    },
  })

  if (body.status && body.status !== existing.status) {
    await prisma.activityLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        type: 'maintenance_status_changed',
        description: `Updated maintenance "${existing.title}" status: ${existing.status} → ${body.status}`,
        metadata: { requestId: id, oldStatus: existing.status, newStatus: body.status },
      },
    })
  }

  return c.json({ data: request })
})

// DELETE /api/maintenance/:id
maintenance.delete('/:id', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  const existing = await prisma.maintenanceRequest.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!existing) return c.json({ error: 'Request not found' }, 404)

  await prisma.maintenanceRequest.delete({ where: { id } })

  return c.json({ message: 'Deleted' })
})

export default maintenance
