import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { db } from '@/lib/db'
import { hashPassword, setSession, setSessionCookie } from '@/lib/session'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

// Rate limiting: max 5 login attempts per IP per 5 minutes
type RateBucket = { count: number; firstAt: number }
const loginRateMap = new Map<string, RateBucket>()
const LOGIN_WINDOW_MS = 5 * 60 * 1000
const LOGIN_MAX_ATTEMPTS = 5

function checkLoginRateLimit(ip: string): boolean {
  const now = Date.now()
  const bucket = loginRateMap.get(ip)
  if (!bucket || now - bucket.firstAt > LOGIN_WINDOW_MS) {
    loginRateMap.set(ip, { count: 1, firstAt: now })
    return true
  }
  if (bucket.count >= LOGIN_MAX_ATTEMPTS) return false
  bucket.count += 1
  return true
}

export async function POST(req: NextRequest) {
  // Rate limit by IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (!checkLoginRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Terlalu banyak percobaan login. Coba lagi dalam 5 menit.' },
      { status: 429, headers: { 'Cache-Control': 'no-store', 'Retry-After': '300' } }
    )
  }
  try {
    const body = await req.json()
    const username = String(body?.username ?? '').trim().toLowerCase()
    const email = String(body?.email ?? '').trim().toLowerCase()
    const password = String(body?.password ?? '')

    // === Path 1: Email + password login (via Supabase Auth) ===
    if (email && password) {
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return NextResponse.json(
          { error: 'Supabase belum dikonfigurasi. Hubungi admin.' },
          { status: 500, headers: { 'Cache-Control': 'no-store' } }
        )
      }

      const res = NextResponse.json({ ok: true })
      const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        cookies: {
          getAll() {
            return req.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              res.cookies.set(name, value, options)
            })
          },
        },
      })

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError || !data?.user) {
        return NextResponse.json(
          { error: 'Email atau password salah.' },
          { status: 401, headers: { 'Cache-Control': 'no-store' } }
        )
      }

      // Check profiles table for admin role
      let role: 'admin' | 'user' = 'user'
      try {
        const profile = await db.$queryRaw<{ role: string | null }[]>`
          SELECT role FROM profiles WHERE id = ${data.user.id}::uuid
        `.catch(() => [])
        if (profile && profile.length > 0 && profile[0].role === 'admin') {
          role = 'admin'
        }
      } catch {
        // profiles table might not exist — default to 'user'
      }

      const usernameFromEmail = email.split('@')[0]
      const displayName = (data.user.user_metadata?.full_name as string) ||
                          (data.user.user_metadata?.name as string) ||
                          usernameFromEmail

      setSessionCookie(res, {
        userId: data.user.id,
        username: usernameFromEmail,
        role,
        displayName,
      })

      // Look up linked student
      let studentId: string | null = null
      try {
        const linked = await db.student.findUnique({
          where: { ownerId: data.user.id },
          select: { id: true },
        })
        if (linked) studentId = linked.id
      } catch {
        // students table may not exist yet
      }

      return NextResponse.json({
        ok: true,
        user: {
          id: data.user.id,
          username: usernameFromEmail,
          role,
          displayName,
          theme: 'light' as const,
          studentId,
        },
      }, { headers: { 'Cache-Control': 'no-store' } })
    }

    // === Path 2: Username + password login (custom session — test accounts) ===
    if (!username || !password) {
      return NextResponse.json({ error: 'Username/email dan password wajib diisi.' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { username } })
    if (!user) {
      return NextResponse.json({ error: 'Username atau password salah.' }, { status: 401 })
    }

    if (user.passwordHash !== hashPassword(password)) {
      return NextResponse.json({ error: 'Username atau password salah.' }, { status: 401 })
    }

    await setSession({
      userId: user.id,
      username: user.username,
      role: user.role as 'admin' | 'user',
      displayName: user.displayName,
    })

    // Look up linked student
    let studentId: string | null = null
    try {
      const linked = await db.student.findUnique({
        where: { ownerId: user.id },
        select: { id: true },
      })
      if (linked) studentId = linked.id
    } catch {
      // students table may not exist yet
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        displayName: user.displayName,
        theme: user.theme,
        studentId,
      },
    })
  } catch (e) {
    console.error('[auth/login] error', e)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}
