import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import type { AppVariables } from '../middleware/auth'

const activity = new Hono<{ Variables: AppVariables }>()

// GET /api/activity — paginated activity log
activity.get('/', async (c) => {
  const user = c.get('user')
  const { page = '1', per_page = '30', type } = c.req.query()

  const pageNum = Math.max(1, parseInt(page))
  const perPage = Math.min(100, Math.max(1, parseInt(per_page)))

  const where: Record<string, unknown> = {
    organizationId: user.organizationId,
  }
  if (type) where.type = type

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * perPage,
      take: perPage,
    }),
    prisma.activityLog.count({ where }),
  ])

  return c.json({
    data: logs,
    meta: {
      total,
      page: pageNum,
      perPage,
      totalPages: Math.ceil(total / perPage),
    },
  })
})

// GET /api/activity/types — distinct activity types
activity.get('/types', async (c) => {
  const user = c.get('user')

  const types = await prisma.activityLog.findMany({
    where: { organizationId: user.organizationId },
    select: { type: true },
    distinct: ['type'],
    orderBy: { type: 'asc' },
  })

  return c.json({ data: types.map((t) => t.type) })
})

export default activity
