import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { enqueueJob } from '../lib/job-queue'

const webhooks = new Hono()

// POST /api/webhooks/hostex — Hostex webhook receiver
// This endpoint is PUBLIC (no auth middleware) — verified by webhook secret
webhooks.post('/hostex', async (c) => {
  const secretHeader = c.req.header('Hostex-Webhook-Secret-Token')

  if (!secretHeader) {
    return c.json({ error: 'Missing webhook secret' }, 401)
  }

  // Find the connection matching this webhook secret
  const connection = await prisma.hostexConnection.findFirst({
    where: { webhookSecret: secretHeader },
    select: { id: true, organizationId: true },
  })

  if (!connection) {
    return c.json({ error: 'Invalid webhook secret' }, 401)
  }

  // Read the event payload
  const payload = await c.req.json<{
    event: string
    data: Record<string, unknown>
  }>()

  // Respond 200 immediately (Hostex requires response within 3 seconds, no retries)
  // Enqueue job for async processing
  await enqueueJob('webhook', {
    event: payload.event,
    data: payload.data,
    connectionId: connection.id,
    organizationId: connection.organizationId,
  })

  return c.json({ received: true })
})

export default webhooks
