import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import type { AppVariables } from '../middleware/auth'
import { requireRole } from '../middleware/auth'

const concierge = new Hono<{ Variables: AppVariables }>()

// GET /api/concierge/:propertyId — get concierge knowledge for a property
concierge.get('/:propertyId', async (c) => {
  const user = c.get('user')
  const propertyId = c.req.param('propertyId')

  // Verify property belongs to org
  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      connection: { organizationId: user.organizationId },
    },
    select: { id: true, name: true },
  })

  if (!property) {
    return c.json({ error: 'Property not found' }, 404)
  }

  const knowledge = await prisma.conciergeKnowledge.findUnique({
    where: { propertyId },
  })

  return c.json({ data: knowledge, property })
})

// PUT /api/concierge/:propertyId — create or update concierge knowledge
concierge.put('/:propertyId', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const propertyId = c.req.param('propertyId')

  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      connection: { organizationId: user.organizationId },
    },
    select: { id: true, name: true },
  })

  if (!property) {
    return c.json({ error: 'Property not found' }, 404)
  }

  const body = await c.req.json<{
    checkInInstructions?: string
    houseRules?: string
    localRestaurants?: string
    localActivities?: string
    transportation?: string
    customNotes?: string
  }>()

  const knowledge = await prisma.conciergeKnowledge.upsert({
    where: { propertyId },
    create: {
      propertyId,
      checkInInstructions: body.checkInInstructions ?? null,
      houseRules: body.houseRules ?? null,
      localRestaurants: body.localRestaurants ?? null,
      localActivities: body.localActivities ?? null,
      transportation: body.transportation ?? null,
      customNotes: body.customNotes ?? null,
    },
    update: {
      checkInInstructions: body.checkInInstructions ?? null,
      houseRules: body.houseRules ?? null,
      localRestaurants: body.localRestaurants ?? null,
      localActivities: body.localActivities ?? null,
      transportation: body.transportation ?? null,
      customNotes: body.customNotes ?? null,
    },
  })

  await prisma.activityLog.create({
    data: {
      organizationId: user.organizationId,
      userId: user.id,
      type: 'concierge_updated',
      description: `Updated concierge knowledge for ${property.name}`,
      metadata: { propertyId },
    },
  })

  return c.json({ data: knowledge })
})

export default concierge
