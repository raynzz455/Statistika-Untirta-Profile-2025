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
    // Supabase not configured — can't do OAuth
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

  // === Step 3: Bridge — set custom 'stat_session' cookie ===
  // This is the KEY FIX: set the custom session cookie so all 47 route
  // handlers (which use getSession()) recognize this Google OAuth user
  // as logged in.
  //
  // The session payload contains:
  // - userId: Supabase auth.users.id (UUID)
  // - username: extracted from email (e.g. "john" from "john@gmail.com")
  // - role: 'user' (admin role is set separately via SQL UPDATE on profiles)
  // - displayName: full name from Google (or email username as fallback)
  const username = user.email?.split('@')[0] || 'google_user'
  const displayName = (user.user_metadata?.full_name as string) ||
                      (user.user_metadata?.name as string) ||
                      username

  setSessionCookie(res, {
    userId: user.id,
    username,
    role: 'user', // default role; admin is set via SQL: UPDATE profiles SET role='admin'
    displayName,
  })

  // === Step 4: Redirect to home (cookies are set on res) ===
  // Both Supabase cookies AND custom 'stat_session' cookie are now set.
  // The app will recognize the user as logged in via /api/auth/me.
  return res
}
