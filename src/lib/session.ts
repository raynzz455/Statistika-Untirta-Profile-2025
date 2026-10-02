// Lightweight session utility using signed cookies.
// For demo purposes only - in production use NextAuth or jose/jwt libraries.
import { cookies } from 'next/headers'
import { createHash, randomBytes } from 'crypto'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const SESSION_SECRET = process.env.SESSION_SECRET || 'statistika25-dev-secret-key-change-me'
const SESSION_COOKIE = 'stat_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

function sign(payload: string): string {
  const sig = createHash('sha256').update(`${payload}.${SESSION_SECRET}`).digest('hex')
  return `${payload}.${sig}`
}

function verify(signed: string): string | null {
  const idx = signed.lastIndexOf('.')
  if (idx === -1) return null
  const payload = signed.slice(0, idx)
  const sig = signed.slice(idx + 1)
  const expectedSig = createHash('sha256').update(`${payload}.${SESSION_SECRET}`).digest('hex')
  // Timing-safe compare
  if (sig.length !== expectedSig.length) return null
  let diff = 0
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expectedSig.charCodeAt(i)
  if (diff !== 0) return null
  return payload
}

export interface SessionPayload {
  userId: string
  username: string
  role: 'admin' | 'user'
  displayName: string | null
  issuedAt: number
}

export function hashPassword(pw: string): string {
  return createHash('sha256').update(pw).digest('hex')
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(SESSION_COOKIE)?.value
  if (!raw) return null
  try {
    const payload = verify(raw)
    if (!payload) return null
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8')) as SessionPayload
    // Check expiry
    if (Date.now() - decoded.issuedAt > SESSION_MAX_AGE * 1000) return null
    // Return session payload directly — cookie is already signed + verified.
    // NO DB LOOKUP: Google OAuth users have userId = Supabase UUID,
    // which is NOT in the Prisma users table. Doing db.user.findUnique
    // would return null and reject Google OAuth users as "not logged in".
    // The role in the cookie is set at login time (from profiles table
    // via the callback handler). To refresh role after SQL UPDATE,
    // user logs out + logs in again (standard behavior).
    return decoded
  } catch {
    return null
  }
}

export async function setSession(payload: Omit<SessionPayload, 'issuedAt'>): Promise<void> {
  const cookieStore = await cookies()
  const full: SessionPayload = { ...payload, issuedAt: Date.now() }
  const payloadStr = Buffer.from(JSON.stringify(full), 'utf-8').toString('base64')
  const signed = sign(payloadStr)
  cookieStore.set(SESSION_COOKIE, signed, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
    secure: process.env.NODE_ENV === 'production',
  })
}

/**
 * Set session cookie directly on a NextResponse object.
 * Used in Route Handlers (e.g. /auth/callback) where cookies() from
 * next/headers can't be used because we're returning a redirect.
 *
 * This is the BRIDGE between Supabase Auth and the custom session:
 * After Google OAuth sets Supabase cookies, this function also sets
 * the custom 'stat_session' cookie so all 47 route handlers (which
 * use getSession()) recognize the user as logged in.
 */
export function setSessionCookie(
  res: NextResponse,
  payload: Omit<SessionPayload, 'issuedAt'>
): void {
  const full: SessionPayload = { ...payload, issuedAt: Date.now() }
  const payloadStr = Buffer.from(JSON.stringify(full), 'utf-8').toString('base64')
  const signed = sign(payloadStr)
  res.cookies.set(SESSION_COOKIE, signed, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
    secure: process.env.NODE_ENV === 'production',
  })
}

/**
 * Clear session cookie on a NextResponse object (for logout in route handlers).
 */
export function clearSessionCookie(res: NextResponse): void {
  res.cookies.delete(SESSION_COOKIE)
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export function generateToken(): string {
  return randomBytes(32).toString('hex')
}

// Export constants for use in other modules
export { SESSION_COOKIE, SESSION_MAX_AGE }
