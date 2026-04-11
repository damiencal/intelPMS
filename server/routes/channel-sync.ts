import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { type AppVariables, requireRole } from '../middleware/auth'

const channelSync = new Hono<{ Variables: AppVariables }>()

// GET /api/channel-sync
channelSync.get('/', async (c) => {
  const user = c.get('user')
  const page = Number(c.req.query('page') ?? '1')
  const perPage = Number(c.req.query('per_page') ?? '20')
  const propertyId = c.req.query('property_id')
  const channel = c.req.query('channel')
  const status = c.req.query('status')
  const syncType = c.req.query('sync_type')

  const where: any = { organizationId: user.organizationId }
  if (propertyId) where.propertyId = propertyId
  if (channel) where.channel = channel
  if (status) where.status = status
  if (syncType) where.syncType = syncType

  const [data, total] = await Promise.all([
    prisma.channelSyncLog.findMany({
      where,
      include: { property: { select: { id: true, name: true } } },
      orderBy: { startedAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.channelSyncLog.count({ where }),
  ])

  return c.json({
    data,
    meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
  })
})

// GET /api/channel-sync/status — Latest sync per property/channel
channelSync.get('/status', async (c) => {
  const user = c.get('user')

  // Get all properties
  const properties = await prisma.property.findMany({
    where: { organizationId: user.organizationId },
    select: { id: true, name: true },
  })

  // Get latest sync for each property and channel
  const channels = ['airbnb', 'booking', 'vrbo', 'expedia']
  const syncTypes = ['availability', 'pricing', 'reservations', 'content']

  const latestSyncs = await prisma.channelSyncLog.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { startedAt: 'desc' },
    include: { property: { select: { id: true, name: true } } },
  })

  // Build status matrix (property × channel)
  const statusMatrix = properties.map((prop) => {
    const propSyncs = latestSyncs.filter((s) => s.propertyId === prop.id)
    const channelStatus: Record<
      string,
      {
        lastSync: Date | null
        status: string
        syncTypes: Record<string, { status: string; lastSync: Date | null }>
      }
    > = {}

    channels.forEach((ch) => {
      const chSyncs = propSyncs.filter((s) => s.channel === ch)
      const latest = chSyncs[0] || null

      const typeStatus: Record<string, { status: string; lastSync: Date | null }> = {}
      syncTypes.forEach((st) => {
        const typeSyncs = chSyncs.filter((s) => s.syncType === st)
        const latestType = typeSyncs[0] || null
        typeStatus[st] = {
          status: latestType?.status ?? 'unknown',
          lastSync: latestType?.startedAt ?? null,
        }
      })

      channelStatus[ch] = {
        lastSync: latest?.startedAt ?? null,
        status: latest?.status ?? 'unknown',
        syncTypes: typeStatus,
      }
    })

    return {
      propertyId: prop.id,
      propertyName: prop.name,
      channels: channelStatus,
    }
  })

  // Summary stats
  const totalSyncs = latestSyncs.length
  const recentSyncs = latestSyncs.filter(
    (s) => s.startedAt && s.startedAt >= new Date(Date.now() - 24 * 60 * 60 * 1000)
  ).length
  const failedRecent = latestSyncs.filter(
    (s) =>
      s.status === 'failed' &&
      s.startedAt &&
      s.startedAt >= new Date(Date.now() - 24 * 60 * 60 * 1000)
  ).length
  const avgDuration =
    latestSyncs.filter((s) => s.duration != null).length > 0
      ? Math.round(
          latestSyncs.filter((s) => s.duration != null).reduce((s, l) => s + (l.duration ?? 0), 0) /
            latestSyncs.filter((s) => s.duration != null).length
        )
      : 0

  return c.json({
    data: {
      summary: {
        totalSyncs,
        recentSyncs24h: recentSyncs,
        failedRecent24h: failedRecent,
        avgDurationMs: avgDuration,
      },
      statusMatrix,
    },
  })
})

// POST /api/channel-sync
channelSync.post('/', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const body = await c.req.json()

  const property = await prisma.property.findFirst({
    where: { id: body.propertyId, organizationId: user.organizationId },
  })
  if (!property) return c.json({ error: 'Property not found' }, 404)

  const record = await prisma.channelSyncLog.create({
    data: {
      organizationId: user.organizationId,
      propertyId: body.propertyId,
      channel: body.channel,
      syncType: body.syncType,
      status: body.status || 'in_progress',
      recordsSynced: body.recordsSynced || 0,
      errors: body.errors || [],
      startedAt: body.startedAt ? new Date(body.startedAt) : new Date(),
      completedAt: body.completedAt ? new Date(body.completedAt) : null,
      duration: body.duration || null,
      details: body.details || null,
    },
    include: { property: { select: { id: true, name: true } } },
  })

  return c.json({ data: record }, 201)
})

// PUT /api/channel-sync/:id — Update sync log (e.g., mark complete)
channelSync.put('/:id', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const body = await c.req.json()

  const existing = await prisma.channelSyncLog.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!existing) return c.json({ error: 'Sync log not found' }, 404)

  const record = await prisma.channelSyncLog.update({
    where: { id },
    data: {
      status: body.status ?? existing.status,
      recordsSynced: body.recordsSynced ?? existing.recordsSynced,
      errors: body.errors ?? existing.errors,
      completedAt: body.completedAt ? new Date(body.completedAt) : existing.completedAt,
      duration: body.duration ?? existing.duration,
      details: body.details ?? existing.details,
    },
    include: { property: { select: { id: true, name: true } } },
  })

  return c.json({ data: record })
})

// DELETE /api/channel-sync/:id
channelSync.delete('/:id', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  const existing = await prisma.channelSyncLog.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!existing) return c.json({ error: 'Sync log not found' }, 404)

  await prisma.channelSyncLog.delete({ where: { id } })
  return c.json({ message: 'Deleted' })
})

export default channelSync
