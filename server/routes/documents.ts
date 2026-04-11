import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { requireRole, type AppVariables } from '../middleware/auth'

const documents = new Hono<{ Variables: AppVariables }>()

// GET /api/documents
documents.get('/', async (c) => {
  const user = c.get('user')
  const {
    page = '1',
    per_page = '20',
    category,
    property_id,
  } = c.req.query()

  const skip = (parseInt(page) - 1) * parseInt(per_page)
  const take = parseInt(per_page)

  const where = {
    organizationId: user.organizationId,
    ...(category ? { category } : {}),
    ...(property_id ? { propertyId: property_id } : {}),
  }

  const [data, total] = await Promise.all([
    prisma.document.findMany({
      where,
      include: {
        property: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.document.count({ where }),
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

// POST /api/documents
documents.post('/', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const body = await c.req.json<{
    propertyId?: string
    name: string
    category: string
    fileUrl: string
    fileType?: string
    fileSize?: number
    expiresAt?: string
    notes?: string
  }>()

  const doc = await prisma.document.create({
    data: {
      organizationId: user.organizationId,
      propertyId: body.propertyId || null,
      name: body.name,
      category: body.category,
      fileUrl: body.fileUrl,
      fileType: body.fileType,
      fileSize: body.fileSize,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      notes: body.notes,
      uploadedBy: user.id,
    },
    include: {
      property: { select: { id: true, name: true } },
    },
  })

  return c.json({ data: doc }, 201)
})

// PUT /api/documents/:id
documents.put('/:id', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const body = await c.req.json<{
    propertyId?: string | null
    name?: string
    category?: string
    fileUrl?: string
    fileType?: string | null
    fileSize?: number | null
    expiresAt?: string | null
    notes?: string | null
  }>()

  const existing = await prisma.document.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!existing) return c.json({ error: 'Not found' }, 404)

  const doc = await prisma.document.update({
    where: { id },
    data: {
      ...(body.propertyId !== undefined && { propertyId: body.propertyId }),
      ...(body.name !== undefined && { name: body.name }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.fileUrl !== undefined && { fileUrl: body.fileUrl }),
      ...(body.fileType !== undefined && { fileType: body.fileType }),
      ...(body.fileSize !== undefined && { fileSize: body.fileSize }),
      ...(body.expiresAt !== undefined && { expiresAt: body.expiresAt ? new Date(body.expiresAt) : null }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
    include: {
      property: { select: { id: true, name: true } },
    },
  })

  return c.json({ data: doc })
})

// DELETE /api/documents/:id
documents.delete('/:id', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  const existing = await prisma.document.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!existing) return c.json({ error: 'Not found' }, 404)

  await prisma.document.delete({ where: { id } })
  return c.json({ message: 'Deleted' })
})

export default documents
