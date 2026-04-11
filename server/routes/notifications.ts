import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { type AppVariables } from '../middleware/auth'

const notifications = new Hono<{ Variables: AppVariables }>()

// GET /api/notifications
notifications.get('/', async (c) => {
  const user = c.get('user')
  const page = Number(c.req.query('page') ?? '1')
  const perPage = Number(c.req.query('per_page') ?? '30')
  const unreadOnly = c.req.query('unread') === 'true'

  const where: any = {
    organizationId: user.organizationId,
    OR: [{ userId: user.id }, { userId: null }], // user-specific or broadcast
  }
  if (unreadOnly) where.isRead = false

  const [data, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: {
        organizationId: user.organizationId,
        OR: [{ userId: user.id }, { userId: null }],
        isRead: false,
      },
    }),
  ])

  return c.json({
    data,
    meta: { total, page, perPage, totalPages: Math.ceil(total / perPage), unreadCount },
  })
})

// GET /api/notifications/unread-count
notifications.get('/unread-count', async (c) => {
  const user = c.get('user')

  const count = await prisma.notification.count({
    where: {
      organizationId: user.organizationId,
      OR: [{ userId: user.id }, { userId: null }],
      isRead: false,
    },
  })

  return c.json({ data: { count } })
})

// PUT /api/notifications/:id/read
notifications.put('/:id/read', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  const existing = await prisma.notification.findFirst({
    where: {
      id,
      organizationId: user.organizationId,
      OR: [{ userId: user.id }, { userId: null }],
    },
  })
  if (!existing) return c.json({ error: 'Not found' }, 404)

  const notification = await prisma.notification.update({
    where: { id },
    data: { isRead: true, readAt: new Date() },
  })

  return c.json({ data: notification })
})

// PUT /api/notifications/mark-all-read
notifications.put('/mark-all-read', async (c) => {
  const user = c.get('user')

  await prisma.notification.updateMany({
    where: {
      organizationId: user.organizationId,
      OR: [{ userId: user.id }, { userId: null }],
      isRead: false,
    },
    data: { isRead: true, readAt: new Date() },
  })

  return c.json({ success: true })
})

// POST /api/notifications — create notification (system use / admin)
notifications.post('/', async (c) => {
  const user = c.get('user')
  const body = await c.req.json<{
    userId?: string
    type: string
    title: string
    message: string
    link?: string
    metadata?: Record<string, unknown>
  }>()

  const notification = await prisma.notification.create({
    data: {
      organizationId: user.organizationId,
      userId: body.userId,
      type: body.type,
      title: body.title,
      message: body.message,
      link: body.link,
      metadata: body.metadata ? (body.metadata as any) : undefined,
    },
  })

  return c.json({ data: notification }, 201)
})

// DELETE /api/notifications/:id
notifications.delete('/:id', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  const existing = await prisma.notification.findFirst({
    where: {
      id,
      organizationId: user.organizationId,
      OR: [{ userId: user.id }, { userId: null }],
    },
  })
  if (!existing) return c.json({ error: 'Not found' }, 404)

  await prisma.notification.delete({ where: { id } })
  return c.json({ success: true })
})

export default notifications
