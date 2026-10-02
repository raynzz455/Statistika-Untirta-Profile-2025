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
// 4. Smart post-login routing:
//      - admin role      → home (admin panel)
//      - has linked student → profile page
//      - no student linked → claim-profile page
//
// CRITICAL FIX (cookie loss bug):
//   Previously this handler created `res = NextResponse.redirect(<next>)`,
//   let Supabase set cookies on it via setAll(), then created a NEW
//   `NextResponse.redirect(claim-profile, { headers: res.headers })`.
//   Cookies set via `res.cookies.set()` are stored in a separate cookie
//   store — they are NOT auto-merged into the plain `headers` map. As a
//   result, the second redirect silently dropped the Supabase cookies +
//   `stat_session` cookie, and the user was redirected to claim-profile
//   but appeared "logged out" on arrival → bounced to home.
//
//   New approach: build ONE final redirect response, set cookies on it,
//   and return it directly. No second redirect.
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
  const nextParam = searchParams.get('next') ?? ''

  // No code present — redirect to home
  if (!code) {
    return NextResponse.redirect(`${origin}/`)
  }

  // === Check if Supabase is configured ===
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.redirect(`${origin}/#/login/oauth-error`)
  }

  // === Create the FINAL redirect target upfront ===
  // We'll set all cookies (Supabase + stat_session) on this single response,
  // avoiding the previous "two redirects" cookie-loss bug.
  // We default the target to /#/claim-profile — admins and already-linked
  // users get redirected below (still using the SAME response object).
  const fallbackTarget = nextParam.startsWith('/') && !nextParam.startsWith('//')
    ? nextParam
    : '/#/claim-profile'
  const res = NextResponse.redirect(`${origin}${fallbackTarget}`)

  // === Create server-side Supabase client (cookies set on `res`) ===
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
  let hasLinkedStudent = false
  let linkedStudentId: string | null = null
  try {
    const profile = await db.$queryRaw<{ role: string | null }[]>`
      SELECT role FROM profiles WHERE id = ${user.id}::text
    `.catch(() => [])
    if (profile && profile.length > 0 && profile[0].role === 'admin') {
      role = 'admin'
    }
  } catch {
    // profiles table might not exist yet (before running rls-policies.sql)
    // Default to 'user' role — safe fallback
  }

  // === Step 3b: Check if user already has a linked student profile ===
  // This drives post-login routing. A returning user (who already claimed)
  // is sent straight to their profile page; a first-time user lands on
  // claim-profile so they can enter their NIM.
  try {
    const linked = await db.student.findUnique({
      where: { ownerId: user.id },
      select: { id: true },
    }).catch(() => null)
    if (linked) {
      hasLinkedStudent = true
      linkedStudentId = linked.id
    }
  } catch {
    // students table might not exist yet in a fresh Supabase project —
    // safe fallback to claim-profile
  }

  // === Step 4: Bridge — set custom 'stat_session' cookie on `res` ===
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

  // === Step 5: Smart post-login routing ===
  // We have already built `res` with a redirect URL. If we need a different
  // destination, we rebuild it — but we MUST re-apply ALL cookies set on
  // `res` so far (Supabase + stat_session), otherwise we hit the
  // original "cookie loss" bug.
  //
  // Routing rules:
  //   - admin (no explicit `next` param)  → home (admin panel visible)
  //   - already-linked student             → profile page (with studentId)
  //   - first-time user                    → claim-profile (default fallback)
  let finalTarget = fallbackTarget
  if (role === 'admin' && !nextParam) {
    finalTarget = '/' // admin lands on home (Header shows admin button)
  } else if (hasLinkedStudent && linkedStudentId) {
    finalTarget = `/#/profile/${linkedStudentId}`
  }
  // else: default fallback target (claim-profile)

  if (finalTarget !== fallbackTarget) {
    // Collect cookies currently set on `res` so we can re-apply them
    // on the new redirect response (cookies are NOT auto-merged via headers).
    const cookies = res.cookies.getAll()
    const finalRes = NextResponse.redirect(`${origin}${finalTarget}`, { status: 302 })
    cookies.forEach((c) => finalRes.cookies.set(c.name, c.value, c))
    return finalRes
  }

  return res
}
