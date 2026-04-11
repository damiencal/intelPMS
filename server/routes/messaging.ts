import { Hono } from 'hono'
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { requireRole, type AppVariables } from '../middleware/auth'

const messaging = new Hono<{ Variables: AppVariables }>()

// GET /api/messaging/templates
messaging.get('/templates', async (c) => {
  const user = c.get('user')

  const templates = await prisma.messageTemplate.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { createdAt: 'desc' },
  })

  return c.json({ data: templates })
})

// GET /api/messaging/templates/:id
messaging.get('/templates/:id', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  const template = await prisma.messageTemplate.findFirst({
    where: { id, organizationId: user.organizationId },
  })

  if (!template) return c.json({ error: 'Template not found' }, 404)

  return c.json({ data: template })
})

// POST /api/messaging/templates
messaging.post(
  '/templates',
  requireRole('owner', 'manager'),
  async (c) => {
    const user = c.get('user')
    const body = await c.req.json<{
      name: string
      trigger: string
      subject?: string
      body: string
      channel?: string
      delayMinutes?: number
      enabled?: boolean
      propertyIds?: string[] | null
    }>()

    const template = await prisma.messageTemplate.create({
      data: {
        organizationId: user.organizationId,
        name: body.name,
        trigger: body.trigger,
        subject: body.subject,
        body: body.body,
        channel: body.channel ?? 'all',
        delayMinutes: body.delayMinutes ?? 0,
        enabled: body.enabled ?? true,
        propertyIds: body.propertyIds === null ? Prisma.JsonNull : body.propertyIds ?? undefined,
      },
    })

    await prisma.activityLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        type: 'template_created',
        description: `Created message template "${template.name}"`,
        metadata: { templateId: template.id, trigger: template.trigger },
      },
    })

    return c.json({ data: template }, 201)
  }
)

// PUT /api/messaging/templates/:id
messaging.put(
  '/templates/:id',
  requireRole('owner', 'manager'),
  async (c) => {
    const user = c.get('user')
    const id = c.req.param('id')
    const body = await c.req.json<{
      name?: string
      trigger?: string
      subject?: string
      body?: string
      channel?: string
      delayMinutes?: number
      enabled?: boolean
      propertyIds?: string[] | null
    }>()

    // Verify ownership
    const existing = await prisma.messageTemplate.findFirst({
      where: { id, organizationId: user.organizationId },
    })
    if (!existing) return c.json({ error: 'Template not found' }, 404)

    const template = await prisma.messageTemplate.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.trigger !== undefined && { trigger: body.trigger }),
        ...(body.subject !== undefined && { subject: body.subject }),
        ...(body.body !== undefined && { body: body.body }),
        ...(body.channel !== undefined && { channel: body.channel }),
        ...(body.delayMinutes !== undefined && {
          delayMinutes: body.delayMinutes,
        }),
        ...(body.enabled !== undefined && { enabled: body.enabled }),
        ...(body.propertyIds !== undefined && {
          propertyIds: body.propertyIds === null ? Prisma.JsonNull : body.propertyIds,
        }),
      },
    })

    await prisma.activityLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        type: 'template_updated',
        description: `Updated message template "${template.name}"`,
        metadata: { templateId: template.id },
      },
    })

    return c.json({ data: template })
  }
)

// DELETE /api/messaging/templates/:id
messaging.delete(
  '/templates/:id',
  requireRole('owner', 'manager'),
  async (c) => {
    const user = c.get('user')
    const id = c.req.param('id')

    const existing = await prisma.messageTemplate.findFirst({
      where: { id, organizationId: user.organizationId },
    })
    if (!existing) return c.json({ error: 'Template not found' }, 404)

    await prisma.messageTemplate.delete({ where: { id } })

    await prisma.activityLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        type: 'template_deleted',
        description: `Deleted message template "${existing.name}"`,
        metadata: { templateId: id },
      },
    })

    return c.json({ message: 'Deleted' })
  }
)

export default messaging
