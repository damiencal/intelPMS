import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { type AppVariables, requireRole } from '../middleware/auth'

const inventory = new Hono<{ Variables: AppVariables }>()

// GET /api/inventory
inventory.get('/', async (c) => {
  const user = c.get('user')
  const page = Number(c.req.query('page') ?? '1')
  const perPage = Number(c.req.query('per_page') ?? '20')
  const category = c.req.query('category')
  const propertyId = c.req.query('property_id')
  const lowStock = c.req.query('low_stock') // "true" to filter items at/below minQuantity

  const where: any = { organizationId: user.organizationId }
  if (category) where.category = category
  if (propertyId) where.propertyId = propertyId

  const [data, total] = await Promise.all([
    prisma.inventoryItem.findMany({
      where,
      include: { property: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.inventoryItem.count({ where }),
  ])

  // Filter low stock in-memory (Prisma doesn't support comparing two columns)
  const filtered = lowStock === 'true'
    ? data.filter((item) => item.quantity <= item.minQuantity)
    : data

  return c.json({
    data: filtered,
    meta: { total: lowStock === 'true' ? filtered.length : total, page, perPage, totalPages: Math.ceil(total / perPage) },
  })
})

// GET /api/inventory/stats
inventory.get('/stats', async (c) => {
  const user = c.get('user')
  const orgWhere = { organizationId: user.organizationId }

  const items = await prisma.inventoryItem.findMany({
    where: orgWhere,
    select: { quantity: true, minQuantity: true, costPerUnit: true, category: true },
  })

  const totalItems = items.length
  const lowStockCount = items.filter((i) => i.quantity <= i.minQuantity).length
  const totalValue = items.reduce((s, i) => s + (i.costPerUnit ?? 0) * i.quantity, 0)

  const byCategory = new Map<string, number>()
  for (const item of items) {
    byCategory.set(item.category, (byCategory.get(item.category) ?? 0) + 1)
  }

  return c.json({
    data: {
      totalItems,
      lowStockCount,
      totalValue: Math.round(totalValue * 100) / 100,
      byCategory: Array.from(byCategory.entries()).map(([category, count]) => ({ category, count })),
    },
  })
})

// POST /api/inventory
inventory.post('/', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const body = await c.req.json<{
    propertyId?: string
    name: string
    category: string
    quantity?: number
    minQuantity?: number
    unit?: string
    costPerUnit?: number
    currency?: string
    supplier?: string
    location?: string
    notes?: string
  }>()

  const item = await prisma.inventoryItem.create({
    data: {
      organizationId: user.organizationId,
      propertyId: body.propertyId,
      name: body.name,
      category: body.category,
      quantity: body.quantity ?? 0,
      minQuantity: body.minQuantity ?? 0,
      unit: body.unit,
      costPerUnit: body.costPerUnit,
      currency: body.currency ?? 'USD',
      supplier: body.supplier,
      location: body.location,
      notes: body.notes,
    },
    include: { property: { select: { id: true, name: true } } },
  })

  return c.json({ data: item }, 201)
})

// PUT /api/inventory/:id
inventory.put('/:id', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const body = await c.req.json()

  const existing = await prisma.inventoryItem.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!existing) return c.json({ error: 'Item not found' }, 404)

  // Track restock
  const updates: any = { ...body }
  if (body.quantity && body.quantity > existing.quantity) {
    updates.lastRestocked = new Date()
  }

  const item = await prisma.inventoryItem.update({
    where: { id },
    data: updates,
    include: { property: { select: { id: true, name: true } } },
  })

  return c.json({ data: item })
})

// DELETE /api/inventory/:id
inventory.delete('/:id', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  const existing = await prisma.inventoryItem.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!existing) return c.json({ error: 'Item not found' }, 404)

  await prisma.inventoryItem.delete({ where: { id } })
  return c.json({ success: true })
})

export default inventory
