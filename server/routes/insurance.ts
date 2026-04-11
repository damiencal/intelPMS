import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { type AppVariables, requireRole } from '../middleware/auth'

const insurance = new Hono<{ Variables: AppVariables }>()

// GET /api/insurance
insurance.get('/', async (c) => {
  const user = c.get('user')
  const page = Number(c.req.query('page') ?? '1')
  const perPage = Number(c.req.query('per_page') ?? '20')
  const propertyId = c.req.query('property_id')
  const status = c.req.query('status')
  const type = c.req.query('type')
  const search = c.req.query('search')

  const where: any = { organizationId: user.organizationId }
  if (propertyId) where.propertyId = propertyId
  if (status) where.status = status
  if (type) where.type = type
  if (search) {
    where.OR = [
      { policyNumber: { contains: search } },
      { provider: { contains: search } },
      { contactName: { contains: search } },
    ]
  }

  const [data, total] = await Promise.all([
    prisma.insurancePolicy.findMany({
      where,
      include: { property: { select: { id: true, name: true } } },
      orderBy: { endDate: 'asc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.insurancePolicy.count({ where }),
  ])

  return c.json({
    data,
    meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
  })
})

// GET /api/insurance/stats
insurance.get('/stats', async (c) => {
  const user = c.get('user')
  const orgFilter = { organizationId: user.organizationId }

  const policies = await prisma.insurancePolicy.findMany({
    where: orgFilter,
    select: {
      status: true,
      premiumAmount: true,
      premiumFrequency: true,
      coverageAmount: true,
      totalClaimed: true,
      endDate: true,
    },
  })

  const active = policies.filter((p) => p.status === 'active')
  const totalPolicies = policies.length
  const activePolicies = active.length

  // Calculate annual premium (normalize all frequencies)
  const totalAnnualPremium = active.reduce((sum, p) => {
    switch (p.premiumFrequency) {
      case 'monthly':
        return sum + p.premiumAmount * 12
      case 'quarterly':
        return sum + p.premiumAmount * 4
      case 'annually':
        return sum + p.premiumAmount
      default:
        return sum + p.premiumAmount
    }
  }, 0)

  const totalCoverage = active.reduce((s, p) => s + p.coverageAmount, 0)
  const totalClaimed = policies.reduce((s, p) => s + p.totalClaimed, 0)

  const now = new Date()
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const expiringSoon = active.filter(
    (p) => p.endDate <= thirtyDays && p.endDate >= now
  ).length

  return c.json({
    data: {
      totalPolicies,
      activePolicies,
      totalAnnualPremium: Math.round(totalAnnualPremium * 100) / 100,
      totalCoverage: Math.round(totalCoverage * 100) / 100,
      totalClaimed: Math.round(totalClaimed * 100) / 100,
      expiringSoon,
    },
  })
})

// POST /api/insurance
insurance.post('/', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const body = await c.req.json()

  const property = await prisma.property.findFirst({
    where: { id: body.propertyId, organizationId: user.organizationId },
  })
  if (!property) return c.json({ error: 'Property not found' }, 404)

  const record = await prisma.insurancePolicy.create({
    data: {
      organizationId: user.organizationId,
      propertyId: body.propertyId,
      policyNumber: body.policyNumber,
      provider: body.provider,
      type: body.type,
      coverageAmount: body.coverageAmount,
      premiumAmount: body.premiumAmount,
      premiumFrequency: body.premiumFrequency,
      deductible: body.deductible || null,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      status: body.status || 'active',
      contactName: body.contactName || null,
      contactPhone: body.contactPhone || null,
      contactEmail: body.contactEmail || null,
      notes: body.notes || null,
      documents: body.documents ? (body.documents as any) : null,
    },
    include: { property: { select: { id: true, name: true } } },
  })

  return c.json({ data: record }, 201)
})

// PUT /api/insurance/:id
insurance.put('/:id', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const body = await c.req.json()

  const existing = await prisma.insurancePolicy.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!existing) return c.json({ error: 'Policy not found' }, 404)

  const record = await prisma.insurancePolicy.update({
    where: { id },
    data: {
      policyNumber: body.policyNumber ?? existing.policyNumber,
      provider: body.provider ?? existing.provider,
      type: body.type ?? existing.type,
      coverageAmount: body.coverageAmount ?? existing.coverageAmount,
      premiumAmount: body.premiumAmount ?? existing.premiumAmount,
      premiumFrequency: body.premiumFrequency ?? existing.premiumFrequency,
      deductible: body.deductible !== undefined ? body.deductible : existing.deductible,
      startDate: body.startDate ? new Date(body.startDate) : existing.startDate,
      endDate: body.endDate ? new Date(body.endDate) : existing.endDate,
      status: body.status ?? existing.status,
      claimCount: body.claimCount ?? existing.claimCount,
      totalClaimed: body.totalClaimed ?? existing.totalClaimed,
      contactName: body.contactName !== undefined ? body.contactName : existing.contactName,
      contactPhone: body.contactPhone !== undefined ? body.contactPhone : existing.contactPhone,
      contactEmail: body.contactEmail !== undefined ? body.contactEmail : existing.contactEmail,
      notes: body.notes !== undefined ? body.notes : existing.notes,
      documents: body.documents ? (body.documents as any) : existing.documents,
    },
    include: { property: { select: { id: true, name: true } } },
  })

  return c.json({ data: record })
})

// DELETE /api/insurance/:id
insurance.delete('/:id', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  const existing = await prisma.insurancePolicy.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!existing) return c.json({ error: 'Policy not found' }, 404)

  await prisma.insurancePolicy.delete({ where: { id } })
  return c.json({ message: 'Deleted' })
})

export default insurance
