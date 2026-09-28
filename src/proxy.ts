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
  // Skip proxy entirely if Supabase not configured (local dev mode)
  if (!isSupabaseConfigured()) {
    return NextResponse.next()
  }

  // Skip public paths
  const pathname = req.nextUrl.pathname
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next()
  }

  // Skip static assets, _next, and other internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/_next/') ||
    pathname.includes('.') || // files with extensions
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

  // Refresh session if expired — required for Server Components
  // to render user-specific content correctly.
  // NOTE: This call must be awaited, otherwise sessions won't refresh.
  await supabase.auth.getUser()

  return res
}

export const config = {
  // Matcher: run middleware on all routes EXCEPT static assets and _next internals
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)',
  ],
}
