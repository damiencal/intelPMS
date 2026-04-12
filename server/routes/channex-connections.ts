import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { encrypt } from '../lib/encryption'
import { ChannexClient } from '../lib/channex/client'
import { enqueueJob } from '../lib/job-queue'
import type { AppVariables } from '../middleware/auth'
import { requireRole } from '../middleware/auth'

const channexConnections = new Hono<{ Variables: AppVariables }>()

channexConnections.use('/*', requireRole('owner', 'manager'))

// GET /api/channex-connections
channexConnections.get('/', async (c) => {
  const user = c.get('user')

  const connections = await prisma.channexConnection.findMany({
    where: { organizationId: user.organizationId },
    select: {
      id: true,
      label: true,
      isActive: true,
      lastSyncAt: true,
      syncStatus: true,
      syncError: true,
      webhookId: true,
      createdAt: true,
      _count: { select: { channexProperties: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return c.json({ data: connections })
})

// POST /api/channex-connections
channexConnections.post('/', async (c) => {
  const user = c.get('user')
  const body = await c.req.json<{ label: string; apiKey: string }>()

  if (!body.label?.trim() || !body.apiKey?.trim()) {
    return c.json({ error: 'Label and API key are required' }, 400)
  }

  const encryptedKey = encrypt(body.apiKey)

  const connection = await prisma.channexConnection.create({
    data: {
      organizationId: user.organizationId,
      label: body.label.trim(),
      apiKey: encryptedKey,
    },
  })

  // Queue initial sync
  await enqueueJob('channex_sync', {
    type: 'initial_sync',
    connectionId: connection.id,
    organizationId: user.organizationId,
  })

  await prisma.activityLog.create({
    data: {
      organizationId: user.organizationId,
      userId: user.id,
      type: 'channex_connection_created',
      description: `Channex connection "${body.label}" created`,
      metadata: { connectionId: connection.id },
    },
  })

  return c.json(
    {
      data: {
        id: connection.id,
        label: connection.label,
        isActive: connection.isActive,
        createdAt: connection.createdAt,
      },
    },
    201
  )
})

// GET /api/channex-connections/:id/test
channexConnections.get('/:id/test', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  const connection = await prisma.channexConnection.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!connection) return c.json({ error: 'Connection not found' }, 404)

  try {
    const client = new ChannexClient(id)
    const result = await client.getProperties({ 'pagination[limit]': 1 })
    const count = result.meta?.total ?? 0
    return c.json({ status: 'connected', properties: count })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ status: 'error', message })
  }
})

// POST /api/channex-connections/:id/sync
channexConnections.post('/:id/sync', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  const connection = await prisma.channexConnection.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!connection) return c.json({ error: 'Connection not found' }, 404)

  await enqueueJob('channex_sync', {
    type: 'full_sync',
    connectionId: connection.id,
    organizationId: user.organizationId,
  })

  await prisma.channexConnection.update({
    where: { id },
    data: { syncStatus: 'syncing' },
  })

  return c.json({ message: 'Sync queued' })
})

// GET /api/channex-connections/:id/properties
channexConnections.get('/:id/properties', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  const connection = await prisma.channexConnection.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!connection) return c.json({ error: 'Connection not found' }, 404)

  const properties = await prisma.channexProperty.findMany({
    where: { connectionId: id, organizationId: user.organizationId },
    include: {
      roomTypes: {
        include: { ratePlans: true },
      },
      _count: { select: { bookings: true } },
    },
    orderBy: { name: 'asc' },
  })

  return c.json({ data: properties })
})

// GET /api/channex-connections/:id/bookings
channexConnections.get('/:id/bookings', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const page = Number(c.req.query('page') ?? '1')
  const perPage = Number(c.req.query('per_page') ?? '20')
  const status = c.req.query('status')
  const propertyId = c.req.query('property_id') // channexProperty.id

  const connection = await prisma.channexConnection.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!connection) return c.json({ error: 'Connection not found' }, 404)

  // Resolve channex property IDs belonging to this connection
  const propertyFilter = propertyId
    ? { id: propertyId }
    : { connectionId: id }

  const properties = await prisma.channexProperty.findMany({
    where: { ...propertyFilter, organizationId: user.organizationId },
    select: { id: true },
  })
  const propertyIds = properties.map((p) => p.id)

  const where = {
    propertyId: { in: propertyIds },
    ...(status ? { status } : {}),
  }

  const [bookings, total] = await Promise.all([
    prisma.channexBooking.findMany({
      where,
      include: {
        property: { select: { id: true, name: true } },
        rooms: { include: { roomType: true, ratePlan: true } },
      },
      orderBy: { arrivalDate: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.channexBooking.count({ where }),
  ])

  return c.json({
    data: bookings,
    meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
  })
})

// POST /api/channex-connections/:id/ari — push ARI update for a property
channexConnections.post('/:id/ari', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  const connection = await prisma.channexConnection.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!connection) return c.json({ error: 'Connection not found' }, 404)

  const body = await c.req.json<{
    type: 'availability' | 'rates'
    values: Array<Record<string, unknown>>
  }>()

  if (!body.type || !body.values?.length) {
    return c.json({ error: 'type and values are required' }, 400)
  }

  try {
    const client = new ChannexClient(id)
    let result
    if (body.type === 'availability') {
      result = await client.updateAvailability({ values: body.values as any })
    } else {
      result = await client.updateRestrictions({ values: body.values as any })
    }
    return c.json({ data: result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: message }, 422)
  }
})

// DELETE /api/channex-connections/:id
channexConnections.delete('/:id', requireRole('owner'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  const connection = await prisma.channexConnection.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!connection) return c.json({ error: 'Connection not found' }, 404)

  // Remove global webhook from Channex if registered
  if (connection.webhookId) {
    try {
      const client = new ChannexClient(id)
      await client.deleteWebhook(connection.webhookId)
    } catch {
      // best-effort cleanup
    }
  }

  await prisma.channexConnection.delete({ where: { id } })

  await prisma.activityLog.create({
    data: {
      organizationId: user.organizationId,
      userId: user.id,
      type: 'channex_connection_deleted',
      description: `Channex connection "${connection.label}" deleted`,
    },
  })

  return c.json({ success: true })
})

export default channexConnections
