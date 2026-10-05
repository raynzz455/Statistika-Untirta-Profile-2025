// ============================================================================
// Next.js Proxy — Supabase Auth Session Refresh
// ============================================================================
// This proxy (formerly called "middleware" in Next.js 15 and earlier) runs
// on every request and refreshes the Supabase Auth session token if it's
// expired. Required for proper Supabase Auth integration with Next.js
// App Router.
//
// In Next.js 16+:
//   - File: src/proxy.ts (was: src/middleware.ts)
//   - Exported function: `proxy` (was: `middleware`)
//
// Reference: https://supabase.com/docs/guides/auth/server-side/nextjs
//            https://next.js.org/docs/messages/middleware-to-proxy
//
// IMPORTANT: This proxy is OPT-IN. It only activates when
// NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.
// Otherwise, it passes through to the next handler (allowing the custom
// cookie-based session in src/lib/session.ts to work for local dev).
// ============================================================================

import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

// Routes that don't require proxy processing
const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/aspirasi', // public aspirasi endpoint (no auth required)
  '/auth/callback',
]

function isSupabaseConfigured(): boolean {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY)
}

// ⚠️ Function name MUST be `proxy` (not `middleware`) in Next.js 16+.
// See: https://next.js.org/docs/messages/middleware-to-proxy
export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // === OAuth callback fallback ===
  const code = req.nextUrl.searchParams.get('code')
  if (code && pathname === '/' && !pathname.startsWith('/auth/callback')) {
    const callbackUrl = new URL('/auth/callback', req.url)
    callbackUrl.searchParams.set('code', code)
    const next = req.nextUrl.searchParams.get('next')
    if (next) callbackUrl.searchParams.set('next', next)
    return NextResponse.redirect(callbackUrl)
  }

  // === CSRF Protection ===
  // For mutation requests (POST, PUT, DELETE, PATCH) to /api/* routes,
  // check that the Origin header matches our host.
  // This prevents cross-site request forgery — a malicious site can't
  // set the Origin header to our domain.
  // Auth endpoints (login, signup, oauth) are exempt because they
  // handle their own security. Public endpoints (aspirasi, subscribe)
  // are also exempt.
  const MUTATION_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH']
  const isApiMutation = MUTATION_METHODS.includes(req.method) && pathname.startsWith('/api/')
  const isAuthEndpoint = pathname.startsWith('/api/auth/')
  const isPublicEndpoint = pathname === '/api/aspirasi' || pathname === '/api/subscribe'

  if (isApiMutation && !isAuthEndpoint && !isPublicEndpoint) {
    const origin = req.headers.get('origin')
    const host = req.headers.get('host')

    // Browsers always send Origin header on cross-origin mutations.
    // If absent, it's likely a non-browser client — reject for security.
    if (!origin || !host) {
      return NextResponse.json(
        { error: 'Request ditolak: missing security headers.' },
        { status: 403 }
      )
    }

    // Check that origin matches our host
    try {
      const originUrl = new URL(origin)
      if (originUrl.host !== host) {
        return NextResponse.json(
          { error: 'Request ditolak: origin mismatch (CSRF protection).' },
          { status: 403 }
        )
      }
    } catch {
      return NextResponse.json(
        { error: 'Request ditolak: invalid origin header.' },
        { status: 403 }
      )
    }
  }

  // Skip proxy entirely if Supabase not configured (local dev mode)
  if (!isSupabaseConfigured()) {
    return NextResponse.next()
  }

  // Skip public paths
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next()
  }

  // Skip static assets, _next, and other internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/_next/') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/logo.svg'
  ) {
    return NextResponse.next()
  }

  // Create a Supabase client configured to use cookies
  const res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return req.cookies.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options)
          })
        } catch {
          // Called from a Server Component — safe to ignore since
          // middleware will refresh the session.
        }
      },
    },
  })

  await supabase.auth.getUser()

  return res
}

export const config = {
  // Matcher: run middleware on all routes EXCEPT static assets and _next internals
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)',
  ],
}
