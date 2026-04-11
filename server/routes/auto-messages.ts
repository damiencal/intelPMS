import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { type AppVariables } from '../middleware/auth'

const autoMessages = new Hono<{ Variables: AppVariables }>()

// GET /api/auto-messages
autoMessages.get('/', async (c) => {
  const user = c.get('user')
  const {
    page = '1',
    per_page = '20',
    status,
    trigger_event,
  } = c.req.query()

  const skip = (parseInt(page) - 1) * parseInt(per_page)
  const take = parseInt(per_page)

  const where = {
    organizationId: user.organizationId,
    ...(status ? { status } : {}),
    ...(trigger_event ? { triggerEvent: trigger_event } : {}),
  }

  const [data, total] = await Promise.all([
    prisma.autoMessage.findMany({
      where,
      include: {
        template: { select: { id: true, name: true, trigger: true } },
      },
      orderBy: { scheduledAt: 'desc' },
      skip,
      take,
    }),
    prisma.autoMessage.count({ where }),
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

// GET /api/auto-messages/stats
autoMessages.get('/stats', async (c) => {
  const user = c.get('user')

  const [pending, sent, failed, cancelled] = await Promise.all([
    prisma.autoMessage.count({
      where: { organizationId: user.organizationId, status: 'pending' },
    }),
    prisma.autoMessage.count({
      where: { organizationId: user.organizationId, status: 'sent' },
    }),
    prisma.autoMessage.count({
      where: { organizationId: user.organizationId, status: 'failed' },
    }),
    prisma.autoMessage.count({
      where: { organizationId: user.organizationId, status: 'cancelled' },
    }),
  ])

  return c.json({ data: { pending, sent, failed, cancelled } })
})

// POST /api/auto-messages — manually schedule a message
autoMessages.post('/', async (c) => {
  const user = c.get('user')
  const body = await c.req.json<{
    templateId: string
    reservationId: string
    guestName?: string
    channel?: string
    triggerEvent: string
    scheduledAt: string
    renderedBody?: string
  }>()

  const msg = await prisma.autoMessage.create({
    data: {
      organizationId: user.organizationId,
      templateId: body.templateId,
      reservationId: body.reservationId,
      guestName: body.guestName,
      channel: body.channel,
      triggerEvent: body.triggerEvent,
      scheduledAt: new Date(body.scheduledAt),
      renderedBody: body.renderedBody,
    },
    include: {
      template: { select: { id: true, name: true, trigger: true } },
    },
  })

  return c.json({ data: msg }, 201)
})

// PUT /api/auto-messages/:id — update status (cancel, mark sent/failed)
autoMessages.put('/:id', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const body = await c.req.json<{
    status?: string
    sentAt?: string
    errorMessage?: string
  }>()

  const existing = await prisma.autoMessage.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!existing) return c.json({ error: 'Not found' }, 404)

  const msg = await prisma.autoMessage.update({
    where: { id },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.sentAt !== undefined && { sentAt: new Date(body.sentAt) }),
      ...(body.status === 'sent' && !body.sentAt && { sentAt: new Date() }),
      ...(body.errorMessage !== undefined && { errorMessage: body.errorMessage }),
    },
    include: {
      template: { select: { id: true, name: true, trigger: true } },
    },
  })

  return c.json({ data: msg })
})

// DELETE /api/auto-messages/:id
autoMessages.delete('/:id', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  const existing = await prisma.autoMessage.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!existing) return c.json({ error: 'Not found' }, 404)

  await prisma.autoMessage.delete({ where: { id } })
  return c.json({ message: 'Deleted' })
})

export default autoMessages
