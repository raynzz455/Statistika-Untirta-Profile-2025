// ============================================================================
// OAuth Callback Route Handler — BRIDGES Supabase Auth → Custom Session
// ============================================================================
// After Supabase OAuth completes (Google/GitHub/etc.), the user is redirected
// here with a `code` query param. This handler:
//
// 1. Exchanges the code for a Supabase session (sets Supabase cookies)
// 2. Gets user info from Supabase (email, name, ID)
// 3. Sets the CUSTOM 'stat_session' cookie (so all 47 route handlers
//    that use getSession() recognize the user as logged in)
// 4. Redirects to the next URL (or home)
//
// This is the BRIDGE between Supabase Auth and the custom session system.
// Without this bridge, Google OAuth users would have Supabase cookies
// but NOT the custom 'stat_session' cookie → app shows "not logged in".
// ============================================================================

import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { setSessionCookie } from '@/lib/session'
import { db } from '@/lib/db'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  // No code present — redirect to home
  if (!code) {
    return NextResponse.redirect(`${origin}/`)
  }

  // Create redirect response (will carry all cookies)
  const res = NextResponse.redirect(`${origin}${next}`)

  // === Check if Supabase is configured ===
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.redirect(`${origin}/#/login/oauth-error`)
  }

  // === Create server-side Supabase client ===
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

  // === Step 1: Exchange code for Supabase session ===
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    console.error('[auth/callback] exchangeCodeForSession error:', error.message)
    return NextResponse.redirect(`${origin}/#/login/oauth-error`)
  }

  // === Step 2: Get user info from Supabase ===
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    console.error('[auth/callback] getUser error:', userError?.message)
    return NextResponse.redirect(`${origin}/#/login/oauth-error`)
  }

  // === Step 3: Check profiles table for admin role ===
  // If this user was previously set as admin via SQL:
  //   UPDATE profiles SET role = 'admin' WHERE id = 'USER_UUID';
  // Then on next login, the callback reads role='admin' from profiles
  // and sets it in the custom session cookie. No logout/login needed
  // for the role to take effect.
  let role: 'admin' | 'user' = 'user'
  try {
    const profile = await db.$queryRaw<{ role: string | null }[]>`
      SELECT role FROM profiles WHERE id = ${user.id}::uuid
    `.catch(() => [])
    if (profile && profile.length > 0 && profile[0].role === 'admin') {
      role = 'admin'
    }
  } catch {
    // profiles table might not exist yet (before running rls-policies.sql)
    // Default to 'user' role — safe fallback
  }

  // === Step 4: Bridge — set custom 'stat_session' cookie ===
  const username = user.email?.split('@')[0] || 'google_user'
  const displayName = (user.user_metadata?.full_name as string) ||
                      (user.user_metadata?.name as string) ||
                      username

  setSessionCookie(res, {
    userId: user.id,
    username,
    role,
    displayName,
  })

  // === Step 5: Redirect to home (cookies are set on res) ===
  return res
}
