// ============================================================================
// Supabase Browser Client (Client-side)
// ============================================================================
// Safe to import in 'use client' components.
// Uses @supabase/ssr for cookie-based session handling that works with
// Next.js App Router (Server Components + Client Components + Route Handlers).
//
// Usage:
//   'use client'
//   import { supabaseBrowser } from '@/lib/supabase-browser'
//   const { data, error } = await supabaseBrowser
//     .from('students')
//     .select('*')
//
// For auth (sign in with OAuth):
//   await supabaseBrowser.auth.signInWithOAuth({
//     provider: 'google',
//     options: { redirectTo: window.location.origin + '/auth/callback' }
//   })
// ============================================================================

import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Silent warning in dev — Supabase is optional for local SQLite development
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      '[supabase-browser] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. ' +
        'Supabase features will not work until you fill in .env. See .env.example for setup.'
    )
  }
}

export const supabaseBrowser = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Convenience type alias for the standard Supabase client
export type SupabaseBrowserClient = typeof supabaseBrowser
