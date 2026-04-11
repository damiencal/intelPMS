import { Context, Next } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import crypto from 'node:crypto'
import { prisma } from '../lib/prisma'

export interface SessionUser {
  id: string
  email: string
  name: string
  role: string
  organizationId: string
  organizationName: string
  organizationSlug: string
}

/** Hono Variables set by the auth middleware */
export type AppVariables = {
  user: SessionUser
  organizationId: string
}

// Simple signed-cookie session store
// In production, consider using a proper session store backed by MySQL

const SESSION_COOKIE = 'hg_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

function getSessionSecret(): string {
  return process.env.SESSION_SECRET || 'dev-session-secret-change-in-production-32chars'
}

function signData(data: string): string {
  const hmac = crypto.createHmac('sha256', getSessionSecret())
  hmac.update(data)
  return `${data}.${hmac.digest('base64url')}`
}

function verifySignedData(signed: string): string | null {
  const lastDotIdx = signed.lastIndexOf('.')
  if (lastDotIdx === -1) return null

  const data = signed.substring(0, lastDotIdx)
  const expected = signData(data)

  if (signed !== expected) return null
  return data
}

export function createSession(userId: string): string {
  const payload = JSON.stringify({ userId, createdAt: Date.now() })
  const encoded = Buffer.from(payload).toString('base64url')
  return signData(encoded)
}

export function parseSession(sessionValue: string): { userId: string } | null {
  const data = verifySignedData(sessionValue)
  if (!data) return null

  try {
    const decoded = Buffer.from(data, 'base64url').toString('utf-8')
    const payload = JSON.parse(decoded)

    // Check if session is expired
    const age = Date.now() - payload.createdAt
    if (age > SESSION_MAX_AGE * 1000) return null

    return { userId: payload.userId }
  } catch {
    return null
  }
}

/**
 * Auth middleware — requires a valid session cookie.
 * Sets c.set('user', SessionUser) and c.set('organizationId', string) on the context.
 */
export async function authMiddleware(c: Context, next: Next): Promise<Response | void> {
  const sessionCookie = getCookie(c, SESSION_COOKIE)

  if (!sessionCookie) {
    return c.json({ error: 'Unauthorized', message: 'No session found' }, 401)
  }

  const session = parseSession(sessionCookie)
  if (!session) {
    deleteCookie(c, SESSION_COOKIE)
    return c.json({ error: 'Unauthorized', message: 'Invalid or expired session' }, 401)
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { organization: true },
  })

  if (!user) {
    deleteCookie(c, SESSION_COOKIE)
    return c.json({ error: 'Unauthorized', message: 'User not found' }, 401)
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

  c.set('user', sessionUser)
  c.set('organizationId', user.organizationId)

  await next()
}

/**
 * Set session cookie after login
 */
export function setSessionCookie(c: Context, userId: string): void {
  const session = createSession(userId)
  setCookie(c, SESSION_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
}

/**
 * Clear session cookie on logout
 */
export function clearSessionCookie(c: Context): void {
  deleteCookie(c, SESSION_COOKIE, { path: '/' })
}

/**
 * RBAC middleware factory — checks if user has one of the allowed roles
 */
export function requireRole(...roles: string[]) {
  return async (c: Context, next: Next): Promise<Response | void> => {
    const user = c.get('user') as SessionUser | undefined
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    if (!roles.includes(user.role)) {
      return c.json({ error: 'Forbidden', message: `Requires role: ${roles.join(' or ')}` }, 403)
    }
    await next()
  }
}
