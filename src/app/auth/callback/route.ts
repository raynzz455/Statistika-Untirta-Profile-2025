// ============================================================================
// OAuth Callback Route Handler
// ============================================================================
// After Supabase OAuth completes (Google/GitHub/etc.), the user is redirected
// here with a `code` query param. This handler exchanges the code for a
// session, then redirects to the original page (or home).
//
// Flow:
//   1. User clicks "Sign in with Google"
//   2. supabase.auth.signInWithOAuth redirects to Google
//   3. Google redirects to https://[PROJECT_REF].supabase.co/auth/v1/callback
//   4. Supabase processes and redirects to our /auth/callback?code=...
//   5. This handler exchanges the code for a session (sets cookies)
//   6. Redirect to next URL (or `/`)
// ============================================================================

import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  // Optional: redirect target after auth (defaults to home)
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const res = NextResponse.redirect(`${origin}${next}`)
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
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      // Auth failed — redirect to login page with error
      return NextResponse.redirect(`${origin}/#/login?error=${encodeURIComponent(error.message)}`)
    }
    return res
  }

  // No code present — redirect to home
  return NextResponse.redirect(`${origin}/`)
}
