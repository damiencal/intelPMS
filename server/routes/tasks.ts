import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import type { AppVariables } from '../middleware/auth'
import { requireRole } from '../middleware/auth'

const tasks = new Hono<{ Variables: AppVariables }>()

// GET /api/tasks — list tasks for org
tasks.get('/', async (c) => {
  const user = c.get('user')
  const page = Number(c.req.query('page') ?? '1')
  const perPage = Number(c.req.query('per_page') ?? '50')
  const status = c.req.query('status')
  const priority = c.req.query('priority')
  const label = c.req.query('label')
  const search = c.req.query('search')

  const where: Record<string, unknown> = {
    organizationId: user.organizationId,
  }
  if (status) where.status = status
  if (priority) where.priority = priority
  if (label) where.label = label
  if (search) where.title = { contains: search }

  const [data, total] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.task.count({ where }),
  ])

  return c.json({
    data,
    meta: {
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    },
  })
})

// POST /api/tasks — create task
tasks.post('/', async (c) => {
  const user = c.get('user')
  const body = await c.req.json<{
    title: string
    description?: string
    status?: string
    priority?: string
    label?: string
    propertyId?: string
    assigneeId?: string
    dueDate?: string
  }>()

  if (!body.title?.trim()) {
    return c.json({ error: 'Title is required' }, 400)
  }

  const task = await prisma.task.create({
    data: {
      organizationId: user.organizationId,
      title: body.title.trim(),
      description: body.description?.trim() ?? null,
      status: body.status ?? 'todo',
      priority: body.priority ?? 'medium',
      label: body.label ?? null,
      propertyId: body.propertyId ?? null,
      assigneeId: body.assigneeId ?? null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
    },
  })

  return c.json({ data: task }, 201)
})

// PATCH /api/tasks/:id — update task
tasks.patch('/:id', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  const existing = await prisma.task.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!existing) return c.json({ error: 'Task not found' }, 404)

  const body = await c.req.json<{
    title?: string
    description?: string
    status?: string
    priority?: string
    label?: string
    propertyId?: string
    assigneeId?: string
    dueDate?: string | null
  }>()

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title.trim() }),
      ...(body.description !== undefined && { description: body.description?.trim() ?? null }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.label !== undefined && { label: body.label }),
      ...(body.propertyId !== undefined && { propertyId: body.propertyId }),
      ...(body.assigneeId !== undefined && { assigneeId: body.assigneeId }),
      ...(body.dueDate !== undefined && { dueDate: body.dueDate ? new Date(body.dueDate) : null }),
    },
  })

  return c.json({ data: task })
})

// DELETE /api/tasks/:id — delete single task
tasks.delete('/:id', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  const existing = await prisma.task.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!existing) return c.json({ error: 'Task not found' }, 404)

  await prisma.task.delete({ where: { id } })
  return c.json({ success: true })
})

// POST /api/tasks/bulk-delete — delete multiple tasks
tasks.post('/bulk-delete', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const { ids } = await c.req.json<{ ids: string[] }>()

  if (!Array.isArray(ids) || ids.length === 0) {
    return c.json({ error: 'No task IDs provided' }, 400)
  }

  const result = await prisma.task.deleteMany({
    where: {
      id: { in: ids },
      organizationId: user.organizationId,
    },
  })

  return c.json({ deleted: result.count })
})

export default tasks
