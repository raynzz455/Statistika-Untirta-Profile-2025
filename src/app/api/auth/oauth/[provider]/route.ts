// ============================================================================
// GET /api/auth/oauth/[provider] — Initiate OAuth sign-in (SERVER-SIDE)
// ============================================================================
// This route handler creates a server-side Supabase client and calls
// signInWithOAuth to get the Google/GitHub OAuth URL, then redirects
// the browser to that URL.
//
// Flow:
//   1. User clicks "Masuk dengan Google" (link to /api/auth/oauth/google)
//   2. This handler calls supabase.auth.signInWithOAuth({ provider: 'google' })
//   3. Supabase returns a Google OAuth URL
//   4. This handler redirects browser to that URL
//   5. User consents on Google
//   6. Google redirects to Supabase callback
//   7. Supabase redirects to /auth/callback?code=...
//   8. /auth/callback exchanges code for session → sets cookies → redirect home
//
// IMPORTANT: This uses createServerClient (NOT createBrowserClient) because
// route handlers run on the server, not in the browser.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

const SUPPORTED_PROVIDERS = ['google', 'github', 'apple', 'discord']

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params

  // === Validate provider ===
  if (!SUPPORTED_PROVIDERS.includes(provider)) {
    return NextResponse.json(
      { error: `Provider "${provider}" tidak didukung. Yang didukung: ${SUPPORTED_PROVIDERS.join(', ')}` },
      { status: 400 }
    )
  }

  // === Check if Supabase is configured ===
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    const origin = req.nextUrl.origin
    // Redirect to login page with error flag in hash (no query params — hash routing)
    return NextResponse.redirect(
      `${origin}/#/login/oauth-error`,
      { status: 302 }
    )
  }

  // === Get redirect target ===
  const { searchParams } = new URL(req.url)
  const next = searchParams.get('next') ?? '/'
  // Validate next URL (prevent open redirect)
  const allowedNext = next.startsWith('/') && !next.startsWith('//') ? next : '/'

  const origin = req.nextUrl.origin
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(allowedNext)}`

  try {
    // === Create server-side Supabase client ===
    // KEY FIX: Use createServerClient (NOT createBrowserClient from supabase-browser.ts)
    // because this route handler runs on the server, not in the browser.
    // createBrowserClient uses document.cookie which doesn't exist server-side.
    const res = NextResponse.redirect(`${origin}/#/login/oauth-error`)

    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              res.cookies.set(name, value, options)
            )
          } catch {
            // Called from a context where cookies can't be set — safe to ignore
            // (PKCE cookies will be handled in the callback route)
          }
        },
      },
    })

    // === Call signInWithOAuth ===
    // This returns a URL that the browser should redirect to (Google consent screen)
    // It may also set PKCE cookies (code_verifier) via setAll()
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as 'google' | 'github' | 'apple' | 'discord',
      options: {
        redirectTo,
      },
    })

    if (error) {
      console.error(`[oauth/${provider}] error:`, error.message)
      return NextResponse.redirect(`${origin}/#/login/oauth-error`)
    }

    // === Redirect to OAuth provider URL (Google/GitHub/etc) ===
    if (data?.url) {
      // Create final redirect response that includes any cookies set by signInWithOAuth
      const redirectRes = NextResponse.redirect(data.url, { status: 302 })
      // Copy any cookies that were set during signInWithOAuth (PKCE verifier etc)
      res.cookies.getAll().forEach(cookie => {
        redirectRes.cookies.set(cookie.name, cookie.value, cookie)
      })
      return redirectRes
    }

    // No URL returned — something went wrong
    return NextResponse.redirect(`${origin}/#/login/oauth-error`)
  } catch (e: any) {
    console.error(`[oauth/${provider}] exception:`, e?.message)
    return NextResponse.redirect(`${origin}/#/login/oauth-error`)
  }
}
