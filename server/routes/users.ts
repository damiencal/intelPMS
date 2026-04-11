import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import type { AppVariables } from '../middleware/auth'
import { requireRole } from '../middleware/auth'
import crypto from 'node:crypto'

const users = new Hono<{ Variables: AppVariables }>()

// GET /api/users/me — current user profile
users.get('/me', async (c) => {
  const user = c.get('user')

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      organization: {
        select: { id: true, name: true, plan: true, timezone: true },
      },
    },
  })

  if (!profile) return c.json({ error: 'User not found' }, 404)

  return c.json({ data: profile })
})

// PATCH /api/users/me — update own profile
users.patch('/me', async (c) => {
  const user = c.get('user')
  const body = await c.req.json<{ name?: string; email?: string }>()

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.email !== undefined && { email: body.email }),
    },
    select: { id: true, email: true, name: true, role: true },
  })

  await prisma.activityLog.create({
    data: {
      organizationId: user.organizationId,
      userId: user.id,
      type: 'profile_updated',
      description: `Updated own profile`,
    },
  })

  return c.json({ data: updated })
})

// GET /api/users
users.get('/', async (c) => {
  const user = c.get('user')

  const members = await prisma.user.findMany({
    where: { organizationId: user.organizationId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  return c.json({ data: members })
})

// POST /api/users — invite a team member
users.post('/', requireRole('owner', 'manager'), async (c) => {
  const currentUser = c.get('user')
  const body = await c.req.json<{
    email: string
    name: string
    role: string
    password: string
  }>()

  if (!body.email || !body.name || !body.role || !body.password) {
    return c.json({ error: 'Missing required fields' }, 400)
  }

  if (!['owner', 'manager', 'viewer'].includes(body.role)) {
    return c.json({ error: 'Invalid role' }, 400)
  }

  // Only owners can create other owners
  if (body.role === 'owner' && currentUser.role !== 'owner') {
    return c.json({ error: 'Only owners can assign owner role' }, 403)
  }

  const existing = await prisma.user.findUnique({ where: { email: body.email } })
  if (existing) {
    return c.json({ error: 'Email already in use' }, 409)
  }

  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(body.password, salt, 64).toString('hex')

  const newUser = await prisma.user.create({
    data: {
      email: body.email,
      name: body.name,
      role: body.role,
      passwordHash: `${salt}:${hash}`,
      organizationId: currentUser.organizationId,
    },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  })

  await prisma.activityLog.create({
    data: {
      organizationId: currentUser.organizationId,
      userId: currentUser.id,
      type: 'user_invited',
      description: `${currentUser.name} invited ${body.name} (${body.email}) as ${body.role}`,
    },
  })

  return c.json({ data: newUser }, 201)
})

// PATCH /api/users/:id
users.patch('/:id', requireRole('owner'), async (c) => {
  const currentUser = c.get('user')
  const userId = c.req.param('id')
  const body = await c.req.json<{ name?: string; role?: string }>()

  const target = await prisma.user.findFirst({
    where: { id: userId, organizationId: currentUser.organizationId },
  })

  if (!target) {
    return c.json({ error: 'User not found' }, 404)
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(body.name && { name: body.name }),
      ...(body.role && { role: body.role }),
    },
    select: { id: true, email: true, name: true, role: true },
  })

  return c.json({ data: updated })
})

// DELETE /api/users/:id
users.delete('/:id', requireRole('owner'), async (c) => {
  const currentUser = c.get('user')
  const userId = c.req.param('id')

  if (userId === currentUser.id) {
    return c.json({ error: 'Cannot delete yourself' }, 400)
  }

  const target = await prisma.user.findFirst({
    where: { id: userId, organizationId: currentUser.organizationId },
  })

  if (!target) {
    return c.json({ error: 'User not found' }, 404)
  }

  await prisma.user.delete({ where: { id: userId } })

  return c.json({ success: true })
})

export default users
