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

// POST /api/webhooks/channex — Channex webhook receiver
// This endpoint is PUBLIC — Channex sends POST with JSON payload.
// We identify the connection by looking up which ChannexConnection has APP_URL matching
// the registered webhook callback (all Channex connections share one endpoint).
webhooks.post('/channex', async (c) => {
  let payload: {
    event: string
    property_id: string
    user_id: string | null
    timestamp: string
    payload?: unknown
  }

  try {
    payload = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  if (!payload.property_id) {
    // Global system events without a property — acknowledge and skip
    return c.json({ received: true })
  }

  // Find the ChannexProperty to determine which connection this belongs to
  const channexProperty = await prisma.channexProperty.findFirst({
    where: { channexId: payload.property_id },
    select: { id: true, connectionId: true, organizationId: true },
  })

  if (!channexProperty) {
    // Unknown property — may arrive before initial sync completes; acknowledge anyway
    console.warn(`[ChannexWebhook] Unknown property ${payload.property_id}, event ${payload.event}`)
    return c.json({ received: true })
  }

  // Enqueue async job — respond within 5s as required
  await enqueueJob('channex_webhook', {
    event: payload.event,
    data: payload.payload,
    channexPropertyId: payload.property_id,
    connectionId: channexProperty.connectionId,
    organizationId: channexProperty.organizationId,
    timestamp: payload.timestamp,
  })

  return c.json({ received: true })
})

export default webhooks

