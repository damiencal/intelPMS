import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import type { AppVariables } from '../middleware/auth'

const conversations = new Hono<{ Variables: AppVariables }>()

// GET /api/conversations — all conversations across all properties
conversations.get('/', async (c) => {
  const user = c.get('user')
  const { page = '1', per_page = '50', search } = c.req.query()

  const skip = (parseInt(page) - 1) * parseInt(per_page)
  const take = parseInt(per_page)

  const where = {
    property: { organizationId: user.organizationId },
    ...(search
      ? {
          OR: [
            { guestName: { contains: search } },
          ],
        }
      : {}),
  }

  const [data, total] = await Promise.all([
    prisma.conversation.findMany({
      where,
      include: {
        property: { select: { id: true, name: true } },
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1,
          select: { content: true, sender: true, sentAt: true },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
      skip,
      take,
    }),
    prisma.conversation.count({ where }),
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

// GET /api/conversations/:id/messages — messages in a conversation
conversations.get('/:id/messages', async (c) => {
  const user = c.get('user')
  const conversationId = c.req.param('id')
  const { page = '1', per_page = '50' } = c.req.query()

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      property: { organizationId: user.organizationId },
    },
    select: { id: true },
  })

  if (!conversation) {
    return c.json({ error: 'Conversation not found' }, 404)
  }

  const skip = (parseInt(page) - 1) * parseInt(per_page)
  const take = parseInt(per_page)

  const [data, total] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId },
      orderBy: { sentAt: 'asc' },
      skip,
      take,
    }),
    prisma.message.count({ where: { conversationId } }),
  ])

  return c.json({
    data,
    meta: { total, page: parseInt(page), perPage: parseInt(per_page), totalPages: Math.ceil(total / take) },
  })
})

// POST /api/conversations/:id/messages — send a message
conversations.post('/:id/messages', async (c) => {
  const user = c.get('user')
  const conversationId = c.req.param('id')
  const body = await c.req.json<{ content: string }>()

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      property: { organizationId: user.organizationId },
    },
    include: {
      property: { select: { connectionId: true } },
    },
  })

  if (!conversation) {
    return c.json({ error: 'Conversation not found' }, 404)
  }

  if (!body.content?.trim()) {
    return c.json({ error: 'Message content is required' }, 400)
  }

  // Save message locally
  const message = await prisma.message.create({
    data: {
      conversationId,
      sender: 'host',
      content: body.content.trim(),
      sentAt: new Date(),
    },
  })

  // Update conversation
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() },
  })

  // Try to send via Hostex API (non-blocking)
  try {
    const { HostexClient } = await import('../lib/hostex/client')
    const client = new HostexClient(conversation.property.connectionId)
    await client.sendMessage(conversation.hostexId, {
      content: body.content.trim(),
    })
  } catch (error) {
    console.error('Failed to send message via Hostex:', error)
    // Message is saved locally even if Hostex send fails
  }

  return c.json({ data: message }, 201)
})

export default conversations
