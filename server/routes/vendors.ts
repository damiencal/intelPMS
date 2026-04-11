import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { type AppVariables, requireRole } from '../middleware/auth'

const vendors = new Hono<{ Variables: AppVariables }>()

// GET /api/vendors
vendors.get('/', async (c) => {
  const user = c.get('user')
  const page = Number(c.req.query('page') ?? '1')
  const perPage = Number(c.req.query('per_page') ?? '20')
  const specialty = c.req.query('specialty')
  const active = c.req.query('active')
  const search = c.req.query('search')

  const where: any = { organizationId: user.organizationId }
  if (specialty) where.specialty = specialty
  if (active === 'true') where.isActive = true
  if (active === 'false') where.isActive = false
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { company: { contains: search } },
      { email: { contains: search } },
    ]
  }

  const [data, total] = await Promise.all([
    prisma.vendor.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.vendor.count({ where }),
  ])

  return c.json({
    data,
    meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
  })
})

// GET /api/vendors/stats
vendors.get('/stats', async (c) => {
  const user = c.get('user')
  const orgWhere = { organizationId: user.organizationId }

  const [total, active, bySpecialty] = await Promise.all([
    prisma.vendor.count({ where: orgWhere }),
    prisma.vendor.count({ where: { ...orgWhere, isActive: true } }),
    prisma.vendor.groupBy({
      by: ['specialty'],
      where: orgWhere,
      _count: true,
    }),
  ])

  return c.json({
    data: {
      total,
      active,
      inactive: total - active,
      bySpecialty: bySpecialty.map((g) => ({ specialty: g.specialty, count: g._count })),
    },
  })
})

// POST /api/vendors
vendors.post('/', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const body = await c.req.json<{
    name: string
    company?: string
    email?: string
    phone?: string
    specialty: string
    rating?: number
    hourlyRate?: number
    currency?: string
    address?: string
    notes?: string
  }>()

  const vendor = await prisma.vendor.create({
    data: {
      organizationId: user.organizationId,
      name: body.name,
      company: body.company,
      email: body.email,
      phone: body.phone,
      specialty: body.specialty,
      rating: body.rating,
      hourlyRate: body.hourlyRate,
      currency: body.currency ?? 'USD',
      address: body.address,
      notes: body.notes,
    },
  })

  await prisma.activityLog.create({
    data: {
      organizationId: user.organizationId,
      userId: user.id,
      type: 'vendor_added',
      description: `Added vendor ${body.name}`,
      metadata: { vendorId: vendor.id },
    },
  })

  return c.json({ data: vendor }, 201)
})

// PUT /api/vendors/:id
vendors.put('/:id', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const body = await c.req.json()

  const existing = await prisma.vendor.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!existing) return c.json({ error: 'Vendor not found' }, 404)

  const vendor = await prisma.vendor.update({
    where: { id },
    data: body,
  })

  return c.json({ data: vendor })
})

// DELETE /api/vendors/:id
vendors.delete('/:id', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  const existing = await prisma.vendor.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!existing) return c.json({ error: 'Vendor not found' }, 404)

  await prisma.vendor.delete({ where: { id } })
  return c.json({ success: true })
})

export default vendors
