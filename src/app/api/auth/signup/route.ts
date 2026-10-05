import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { setSessionCookie } from '@/lib/session'
import { db } from '@/lib/db'

// ============================================================================
// POST /api/auth/signup — Email + Password signup via Supabase Auth
// ============================================================================
// Flow:
//   1. Validate email + password
//   2. Call supabase.auth.signUp() — creates a new auth.users record
//   3. Supabase sends a confirmation email (if email confirm is enabled)
//   4. If no email confirmation needed → immediately set session cookie
//   5. If email confirmation needed → tell user to check their email
//
// After signup, the user still needs to:
//   - Confirm email (if enabled in Supabase settings)
//   - Login (via /api/auth/login with email+password, or Google OAuth)
//   - Claim their NIM via /#/claim-profile
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json(
      { error: 'Body tidak valid.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  const email = String(body?.email ?? '').trim().toLowerCase()
  const password = String(body?.password ?? '')

  // Validate email
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: 'Email tidak valid.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  // Validate password (min 6 chars — Supabase default)
  if (!password || password.length < 6) {
    return NextResponse.json(
      { error: 'Password minimal 6 karakter.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  // Check if Supabase is configured
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.json(
      { error: 'Supabase belum dikonfigurasi. Hubungi admin.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  // Create a server-side Supabase client for signup
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

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      // Log full error for debugging
      console.error('[auth/signup] Supabase error:', {
        message: error.message,
        code: error.code,
        status: error.status,
      })

      // Provide user-friendly error messages for common errors
      let friendlyError = error.message
      if (error.message.includes('Database error')) {
        friendlyError = 'Database error saat signup. Pastikan supabase/rls-policies.sql sudah di-run di Supabase SQL Editor (buat table profiles + trigger). Atau coba lagi dalam beberapa detik.'
      } else if (error.message.includes('already') && error.message.includes('registered')) {
        friendlyError = 'Email sudah terdaftar. Silakan login langsung.'
      } else if (error.message.includes('rate limit')) {
        friendlyError = 'Terlalu banyak percobaan. Coba lagi nanti.'
      } else if (error.message.includes('Password')) {
        friendlyError = 'Password terlalu lemah. Minimal 6 karakter.'
      }

      return NextResponse.json(
        { error: friendlyError, _supabaseError: error.message },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      )
    }

    // Check if user needs email confirmation
    if (data?.user && !data?.session) {
      // Email confirmation required — user needs to click the link in their email
      return NextResponse.json({
        ok: true,
        needsEmailConfirmation: true,
        message: 'Konfirmasi email Anda! Cek inbox (atau spam) untuk link verifikasi dari Supabase.',
        email,
      }, { headers: { 'Cache-Control': 'no-store' } })
    }

    // If we got a session (email confirmation disabled in Supabase settings),
    // set the custom stat_session cookie for our route handlers
    if (data?.user && data?.session) {
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

      const username = email.split('@')[0]
      setSessionCookie(res, {
        userId: data.user.id,
        username,
        role,
        displayName: username,
      })

      return NextResponse.json({
        ok: true,
        user: {
          id: data.user.id,
          username,
          role,
          displayName: username,
          theme: 'light' as const,
          studentId: null,
        },
        redirect: '/#/claim-profile',
      }, { headers: { 'Cache-Control': 'no-store' } })
    }

    // Fallback — shouldn't reach here
    return NextResponse.json(
      { error: 'Signup gagal. Coba lagi.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (e: any) {
    console.error('[auth/signup] exception:', e?.message?.slice(0, 100))
    return NextResponse.json(
      { error: 'Terjadi kesalahan server. Coba lagi.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
