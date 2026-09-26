// Lightweight session utility using signed cookies.
// For demo purposes only - in production use NextAuth or jose/jwt libraries.
import { cookies } from 'next/headers'
import { createHash, randomBytes } from 'crypto'
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
    // Verify user still exists
    const user = await db.user.findUnique({ where: { id: decoded.userId } })
    if (!user) return null
    return { ...decoded, role: user.role as 'admin' | 'user', displayName: user.displayName }
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

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export function generateToken(): string {
  return randomBytes(32).toString('hex')
}
