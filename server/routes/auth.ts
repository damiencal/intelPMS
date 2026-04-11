import { Hono } from 'hono'
import crypto from 'node:crypto'
import { prisma } from '../lib/prisma'
import { setSessionCookie, clearSessionCookie, type SessionUser } from '../middleware/auth'

const auth = new Hono()

// POST /api/auth/register
auth.post('/register', async (c) => {
  const body = await c.req.json<{
    email: string
    password: string
    name: string
    organizationName: string
  }>()

  if (!body.email || !body.password || !body.name || !body.organizationName) {
    return c.json({ error: 'Missing required fields' }, 400)
  }

  // Check if email exists
  const existing = await prisma.user.findUnique({ where: { email: body.email } })
  if (existing) {
    return c.json({ error: 'Email already registered' }, 409)
  }

  // Hash password using Node.js crypto (no bcrypt dependency needed)
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(body.password, salt, 64).toString('hex')
  const passwordHash = `${salt}:${hash}`

  // Create org slug from name
  const slug = body.organizationName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    + '-' + crypto.randomBytes(3).toString('hex')

  // Create org + user in transaction
  const result = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: body.organizationName,
        slug,
      },
    })

    const user = await tx.user.create({
      data: {
        email: body.email,
        passwordHash,
        name: body.name,
        role: 'owner',
        organizationId: org.id,
      },
    })

    return { org, user }
  })

  setSessionCookie(c, result.user.id)

  return c.json({
    user: {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: result.user.role,
      organizationId: result.org.id,
      organizationName: result.org.name,
      organizationSlug: result.org.slug,
    },
  })
})

// POST /api/auth/login
auth.post('/login', async (c) => {
  const body = await c.req.json<{ email: string; password: string }>()

  if (!body.email || !body.password) {
    return c.json({ error: 'Email and password are required' }, 400)
  }

  const user = await prisma.user.findUnique({
    where: { email: body.email },
    include: { organization: true },
  })

  if (!user) {
    return c.json({ error: 'Invalid email or password' }, 401)
  }

  // Verify password
  const [salt, storedHash] = user.passwordHash.split(':')
  const hash = crypto.scryptSync(body.password, salt, 64).toString('hex')

  if (hash !== storedHash) {
    return c.json({ error: 'Invalid email or password' }, 401)
  }

  setSessionCookie(c, user.id)

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
      organizationName: user.organization.name,
      organizationSlug: user.organization.slug,
    },
  })
})

// POST /api/auth/logout
auth.post('/logout', async (c) => {
  clearSessionCookie(c)
  return c.json({ success: true })
})

// GET /api/auth/me — returns current user
auth.get('/me', async (c) => {
  // This route doesn't use the auth middleware — it checks the session manually
  // to return null instead of 401 (for the frontend auth check)
  const { getCookie } = await import('hono/cookie')
  const { parseSession } = await import('../middleware/auth')

  const sessionCookie = getCookie(c, 'hg_session')
  if (!sessionCookie) {
    return c.json({ user: null })
  }

  const session = parseSession(sessionCookie)
  if (!session) {
    return c.json({ user: null })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { organization: true },
  })

  if (!user) {
    return c.json({ user: null })
  }

  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    organizationId: user.organizationId,
    organizationName: user.organization.name,
    organizationSlug: user.organization.slug,
  }

  return c.json({ user: sessionUser })
})

export default auth
