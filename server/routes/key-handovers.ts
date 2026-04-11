import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { type AppVariables, requireRole } from '../middleware/auth'

const keyHandovers = new Hono<{ Variables: AppVariables }>()

// GET /api/key-handovers
keyHandovers.get('/', async (c) => {
  const user = c.get('user')
  const page = Number(c.req.query('page') ?? '1')
  const perPage = Number(c.req.query('per_page') ?? '20')
  const propertyId = c.req.query('property_id')
  const status = c.req.query('status')
  const keyType = c.req.query('key_type')
  const search = c.req.query('search')

  const where: any = { organizationId: user.organizationId }
  if (propertyId) where.propertyId = propertyId
  if (status) where.status = status
  if (keyType) where.keyType = keyType
  if (search) {
    where.OR = [
      { keyIdentifier: { contains: search } },
      { assignedTo: { contains: search } },
      { notes: { contains: search } },
    ]
  }

  const [data, total] = await Promise.all([
    prisma.keyHandover.findMany({
      where,
      include: { property: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.keyHandover.count({ where }),
  ])

  return c.json({
    data,
    meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
  })
})

// GET /api/key-handovers/stats
keyHandovers.get('/stats', async (c) => {
  const user = c.get('user')
  const orgFilter = { organizationId: user.organizationId }

  const [total, available, assigned, lost] = await Promise.all([
    prisma.keyHandover.count({ where: orgFilter }),
    prisma.keyHandover.count({ where: { ...orgFilter, status: 'available' } }),
    prisma.keyHandover.count({ where: { ...orgFilter, status: 'assigned' } }),
    prisma.keyHandover.count({ where: { ...orgFilter, status: 'lost' } }),
  ])

  return c.json({
    data: { total, available, assigned, lost },
  })
})

// POST /api/key-handovers
keyHandovers.post('/', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const body = await c.req.json()

  // Verify property belongs to org
  const property = await prisma.property.findFirst({
    where: { id: body.propertyId, organizationId: user.organizationId },
  })
  if (!property) {
    return c.json({ error: 'Property not found' }, 404)
  }

  const record = await prisma.keyHandover.create({
    data: {
      organizationId: user.organizationId,
      propertyId: body.propertyId,
      keyType: body.keyType,
      keyIdentifier: body.keyIdentifier,
      assignedTo: body.assignedTo || null,
      assignedDate: body.assignedTo ? new Date() : null,
      status: body.assignedTo ? 'assigned' : 'available',
      notes: body.notes || null,
      createdBy: user.name || user.email,
    },
    include: { property: { select: { id: true, name: true } } },
  })

  return c.json({ data: record }, 201)
})

// PUT /api/key-handovers/:id
keyHandovers.put('/:id', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const body = await c.req.json()

  const existing = await prisma.keyHandover.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!existing) return c.json({ error: 'Key handover not found' }, 404)

  // Auto-set dates based on status changes
  const updateData: any = {
    keyType: body.keyType ?? existing.keyType,
    keyIdentifier: body.keyIdentifier ?? existing.keyIdentifier,
    assignedTo: body.assignedTo ?? existing.assignedTo,
    status: body.status ?? existing.status,
    notes: body.notes !== undefined ? body.notes : existing.notes,
  }

  // If assigning
  if (body.status === 'assigned' && existing.status !== 'assigned') {
    updateData.assignedDate = new Date()
    updateData.returnedDate = null
  }
  // If returning
  if (body.status === 'returned' || body.status === 'available') {
    if (existing.status === 'assigned') {
      updateData.returnedDate = new Date()
    }
  }

  if (body.assignedDate) updateData.assignedDate = new Date(body.assignedDate)
  if (body.returnedDate) updateData.returnedDate = new Date(body.returnedDate)

  const record = await prisma.keyHandover.update({
    where: { id },
    data: updateData,
    include: { property: { select: { id: true, name: true } } },
  })

  return c.json({ data: record })
})

// DELETE /api/key-handovers/:id
keyHandovers.delete('/:id', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  const existing = await prisma.keyHandover.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!existing) return c.json({ error: 'Key handover not found' }, 404)

  await prisma.keyHandover.delete({ where: { id } })
  return c.json({ data: { success: true } })
})

export default keyHandovers
