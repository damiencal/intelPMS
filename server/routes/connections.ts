import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { encrypt } from '../lib/encryption'
import { HostexClient } from '../lib/hostex/client'
import { enqueueJob } from '../lib/job-queue'
import type { AppVariables } from '../middleware/auth'
import { requireRole } from '../middleware/auth'

const connections = new Hono<{ Variables: AppVariables }>()

// All routes require at least manager role
connections.use('/*', requireRole('owner', 'manager'))

// GET /api/connections
connections.get('/', async (c) => {
  const user = c.get('user')
  const orgConnections = await prisma.hostexConnection.findMany({
    where: { organizationId: user.organizationId },
    select: {
      id: true,
      label: true,
      authMethod: true,
      isActive: true,
      lastSyncAt: true,
      syncStatus: true,
      syncError: true,
      createdAt: true,
      _count: { select: { properties: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return c.json({ data: orgConnections })
})

// POST /api/connections — create new connection (simple token for now)
connections.post('/', async (c) => {
  const user = c.get('user')
  const body = await c.req.json<{
    label: string
    accessToken: string
    authMethod?: string
  }>()

  if (!body.label || !body.accessToken) {
    return c.json({ error: 'Label and access token are required' }, 400)
  }

  // Encrypt the token before storage
  const encryptedToken = encrypt(body.accessToken)

  const connection = await prisma.hostexConnection.create({
    data: {
      organizationId: user.organizationId,
      label: body.label,
      authMethod: body.authMethod || 'token',
      accessToken: encryptedToken,
    },
  })

  // Enqueue initial sync job
  await enqueueJob('sync', {
    type: 'initial_sync',
    connectionId: connection.id,
    organizationId: user.organizationId,
  })

  // Log activity
  await prisma.activityLog.create({
    data: {
      organizationId: user.organizationId,
      userId: user.id,
      type: 'connection_created',
      description: `Connection "${body.label}" created`,
      metadata: { connectionId: connection.id },
    },
  })

  return c.json({
    data: {
      id: connection.id,
      label: connection.label,
      authMethod: connection.authMethod,
      isActive: connection.isActive,
      createdAt: connection.createdAt,
    },
  }, 201)
})

// GET /api/connections/:id/test — test connection health
connections.get('/:id/test', async (c) => {
  const user = c.get('user')
  const connectionId = c.req.param('id')

  const connection = await prisma.hostexConnection.findFirst({
    where: { id: connectionId, organizationId: user.organizationId },
  })

  if (!connection) {
    return c.json({ error: 'Connection not found' }, 404)
  }

  try {
    const client = new HostexClient(connectionId)
    const result = await client.getProperties({ per_page: 1 })
    return c.json({ status: 'connected', properties: result.data?.properties?.length ?? 0 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ status: 'error', message }, 200)
  }
})

// POST /api/connections/:id/sync — trigger full sync
connections.post('/:id/sync', async (c) => {
  const user = c.get('user')
  const connectionId = c.req.param('id')

  const connection = await prisma.hostexConnection.findFirst({
    where: { id: connectionId, organizationId: user.organizationId },
  })

  if (!connection) {
    return c.json({ error: 'Connection not found' }, 404)
  }

  await enqueueJob('sync', {
    type: 'full_sync',
    connectionId: connection.id,
    organizationId: user.organizationId,
  })

  await prisma.hostexConnection.update({
    where: { id: connectionId },
    data: { syncStatus: 'syncing' },
  })

  return c.json({ message: 'Sync queued' })
})

// DELETE /api/connections/:id
connections.delete('/:id', requireRole('owner'), async (c) => {
  const user = c.get('user')
  const connectionId = c.req.param('id')

  const connection = await prisma.hostexConnection.findFirst({
    where: { id: connectionId, organizationId: user.organizationId },
  })

  if (!connection) {
    return c.json({ error: 'Connection not found' }, 404)
  }

  // Delete connection and all related data (cascade)
  await prisma.hostexConnection.delete({ where: { id: connectionId } })

  await prisma.activityLog.create({
    data: {
      organizationId: user.organizationId,
      userId: user.id,
      type: 'connection_deleted',
      description: `Connection "${connection.label}" deleted`,
    },
  })

  return c.json({ success: true })
})

export default connections
