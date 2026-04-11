import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import type { AppVariables } from '../middleware/auth'
import { requireRole } from '../middleware/auth'

const pricing = new Hono<{ Variables: AppVariables }>()

// ==========================================
// Pricing Rules
// ==========================================

// GET /api/pricing/rules
pricing.get('/rules', async (c) => {
  const user = c.get('user')

  const rules = await prisma.pricingRule.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { priority: 'asc' },
  })

  return c.json({ data: rules })
})

// POST /api/pricing/rules
pricing.post('/rules', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const body = await c.req.json<{
    name: string
    type: string
    priority?: number
    conditions: unknown
    action: unknown
    enabled?: boolean
    appliesTo: unknown
  }>()

  if (!body.name || !body.type) {
    return c.json({ error: 'Name and type are required' }, 400)
  }

  const rule = await prisma.pricingRule.create({
    data: {
      organizationId: user.organizationId,
      name: body.name,
      type: body.type,
      priority: body.priority ?? 0,
      conditions: body.conditions as object,
      action: body.action as object,
      enabled: body.enabled ?? true,
      appliesTo: body.appliesTo as object,
    },
  })

  return c.json({ data: rule }, 201)
})

// PUT /api/pricing/rules/:id
pricing.put('/rules/:id', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const ruleId = c.req.param('id')
  const body = await c.req.json()

  const existing = await prisma.pricingRule.findFirst({
    where: { id: ruleId, organizationId: user.organizationId },
  })

  if (!existing) {
    return c.json({ error: 'Rule not found' }, 404)
  }

  const rule = await prisma.pricingRule.update({
    where: { id: ruleId },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.type !== undefined && { type: body.type }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.conditions !== undefined && { conditions: body.conditions }),
      ...(body.action !== undefined && { action: body.action }),
      ...(body.enabled !== undefined && { enabled: body.enabled }),
      ...(body.appliesTo !== undefined && { appliesTo: body.appliesTo }),
    },
  })

  return c.json({ data: rule })
})

// DELETE /api/pricing/rules/:id
pricing.delete('/rules/:id', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const ruleId = c.req.param('id')

  const existing = await prisma.pricingRule.findFirst({
    where: { id: ruleId, organizationId: user.organizationId },
  })

  if (!existing) {
    return c.json({ error: 'Rule not found' }, 404)
  }

  await prisma.pricingRule.delete({ where: { id: ruleId } })

  return c.json({ success: true })
})

// ==========================================
// Seasonal Strategies
// ==========================================

// GET /api/pricing/seasonal-strategies
pricing.get('/seasonal-strategies', async (c) => {
  const user = c.get('user')

  const strategies = await prisma.seasonalStrategy.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { createdAt: 'desc' },
  })

  return c.json({ data: strategies })
})

// POST /api/pricing/seasonal-strategies
pricing.post('/seasonal-strategies', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const body = await c.req.json<{
    name: string
    propertyIds: string[]
    seasons: unknown
    notes?: string
  }>()

  if (!body.name) {
    return c.json({ error: 'Name is required' }, 400)
  }

  const strategy = await prisma.seasonalStrategy.create({
    data: {
      organizationId: user.organizationId,
      name: body.name,
      propertyIds: body.propertyIds as unknown as object,
      seasons: body.seasons as object,
      notes: body.notes,
      createdBy: user.id,
    },
  })

  return c.json({ data: strategy }, 201)
})

// PUT /api/pricing/seasonal-strategies/:id
pricing.put('/seasonal-strategies/:id', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const body = await c.req.json()

  const existing = await prisma.seasonalStrategy.findFirst({
    where: { id, organizationId: user.organizationId },
  })

  if (!existing) {
    return c.json({ error: 'Strategy not found' }, 404)
  }

  const strategy = await prisma.seasonalStrategy.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.propertyIds !== undefined && { propertyIds: body.propertyIds }),
      ...(body.seasons !== undefined && { seasons: body.seasons }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
  })

  return c.json({ data: strategy })
})

// ==========================================
// Proposals
// ==========================================

// GET /api/pricing/proposals
pricing.get('/proposals', async (c) => {
  const user = c.get('user')
  const { status, page = '1', per_page = '20' } = c.req.query()

  const where = {
    organizationId: user.organizationId,
    ...(status ? { status } : {}),
  }

  const [data, total] = await Promise.all([
    prisma.pricingProposal.findMany({
      where,
      include: { _count: { select: { changes: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(per_page),
      take: parseInt(per_page),
    }),
    prisma.pricingProposal.count({ where }),
  ])

  return c.json({
    data,
    meta: {
      total,
      page: parseInt(page),
      perPage: parseInt(per_page),
      totalPages: Math.ceil(total / parseInt(per_page)),
    },
  })
})

// GET /api/pricing/proposals/:id
pricing.get('/proposals/:id', async (c) => {
  const user = c.get('user')
  const proposal = await prisma.pricingProposal.findFirst({
    where: { id: c.req.param('id'), organizationId: user.organizationId },
    include: {
      changes: {
        include: {
          listing: {
            select: {
              id: true,
              channel: true,
              channelName: true,
              property: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { date: 'asc' },
      },
    },
  })

  if (!proposal) {
    return c.json({ error: 'Proposal not found' }, 404)
  }

  return c.json({ data: proposal })
})

// POST /api/pricing/proposals/:id/approve
pricing.post('/proposals/:id/approve', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const body = await c.req.json<{ reviewNotes?: string }>().catch(() => ({}))

  const proposal = await prisma.pricingProposal.findFirst({
    where: { id, organizationId: user.organizationId },
  })

  if (!proposal) return c.json({ error: 'Proposal not found' }, 404)
  if (proposal.status !== 'draft' && proposal.status !== 'pending_review') {
    return c.json({ error: `Cannot approve proposal with status: ${proposal.status}` }, 400)
  }

  await prisma.pricingProposal.update({
    where: { id },
    data: {
      status: 'approved',
      reviewedBy: user.id,
      reviewedAt: new Date(),
      reviewNotes: (body as { reviewNotes?: string })?.reviewNotes,
    },
  })

  await prisma.activityLog.create({
    data: {
      organizationId: user.organizationId,
      userId: user.id,
      type: 'proposal_approved',
      description: `Pricing proposal approved`,
      metadata: { proposalId: id },
    },
  })

  return c.json({ success: true })
})

// POST /api/pricing/proposals/:id/reject
pricing.post('/proposals/:id/reject', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const body = await c.req.json<{ reviewNotes?: string }>().catch(() => ({}))

  const proposal = await prisma.pricingProposal.findFirst({
    where: { id, organizationId: user.organizationId },
  })

  if (!proposal) return c.json({ error: 'Proposal not found' }, 404)

  await prisma.pricingProposal.update({
    where: { id },
    data: {
      status: 'rejected',
      reviewedBy: user.id,
      reviewedAt: new Date(),
      reviewNotes: (body as { reviewNotes?: string })?.reviewNotes,
    },
  })

  return c.json({ success: true })
})

// POST /api/pricing/proposals/:id/apply
pricing.post('/proposals/:id/apply', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  const proposal = await prisma.pricingProposal.findFirst({
    where: { id, organizationId: user.organizationId },
    include: {
      changes: {
        where: { included: true },
        include: {
          listing: {
            select: {
              hostexId: true,
              property: { select: { connectionId: true } },
            },
          },
        },
      },
    },
  })

  if (!proposal) return c.json({ error: 'Proposal not found' }, 404)
  if (proposal.status !== 'approved') {
    return c.json({ error: `Can only apply approved proposals (current: ${proposal.status})` }, 400)
  }

  // Mark as applying
  await prisma.pricingProposal.update({
    where: { id },
    data: { appliedBy: user.id },
  })

  // Group changes by listing's Hostex ID
  const changesByListing = new Map<string, { connectionId: string; prices: { date: string; price: number }[]; changeIds: string[] }>()

  for (const change of proposal.changes) {
    const hostexListingId = change.listing.hostexId
    const connectionId = change.listing.property.connectionId

    if (!changesByListing.has(hostexListingId)) {
      changesByListing.set(hostexListingId, { connectionId, prices: [], changeIds: [] })
    }

    const group = changesByListing.get(hostexListingId)!
    group.prices.push({
      date: change.date.toISOString().split('T')[0],
      price: change.recommendedPrice,
    })
    group.changeIds.push(change.id)
  }

  // Apply changes via Hostex API
  const { HostexClient } = await import('../lib/hostex/client')
  let allSuccess = true

  for (const [hostexListingId, group] of changesByListing) {
    try {
      const client = new HostexClient(group.connectionId)
      await client.updateListingPrices({
        listing_id: hostexListingId,
        prices: group.prices,
      })

      // Mark changes as success
      await prisma.proposalChange.updateMany({
        where: { id: { in: group.changeIds } },
        data: { applyStatus: 'success' },
      })
    } catch (error) {
      allSuccess = false
      const errorMsg = error instanceof Error ? error.message : String(error)

      await prisma.proposalChange.updateMany({
        where: { id: { in: group.changeIds } },
        data: { applyStatus: 'failed', applyError: errorMsg },
      })
    }
  }

  // Update proposal status
  await prisma.pricingProposal.update({
    where: { id },
    data: {
      status: allSuccess ? 'applied' : 'partially_applied',
      appliedAt: new Date(),
    },
  })

  await prisma.activityLog.create({
    data: {
      organizationId: user.organizationId,
      userId: user.id,
      type: 'proposal_applied',
      description: `Pricing proposal ${allSuccess ? 'applied successfully' : 'partially applied'}`,
      metadata: { proposalId: id },
    },
  })

  return c.json({
    success: allSuccess,
    status: allSuccess ? 'applied' : 'partially_applied',
  })
})

export default pricing
