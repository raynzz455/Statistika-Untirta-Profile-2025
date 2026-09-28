// ============================================================================
// Supabase Server Client (Server-side)
// ============================================================================
// For use in:
//   - Server Components (async functions)
//   - Route Handlers (src/app/api/**/route.ts)
//   - Server Actions
//
// This client uses the @supabase/ssr pattern for reading session cookies
// set by the browser client, so the same user session works on both sides.
//
// IMPORTANT: This client uses the anon key (not the service role key).
// For privileged operations that bypass Row-Level Security, use
// `createSupabaseAdminClient()` below — but ONLY in trusted server contexts.
// ============================================================================

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/lib/supabase-types'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

/**
 * Standard Supabase server client — honors RLS policies.
 * Use this for all user-facing server-side operations.
 *
 * @example
 *   import { supabaseServer } from '@/lib/supabase-server'
 *   const supabase = await supabaseServer()
 *   const { data, error } = await supabase.from('students').select('*')
 */
export async function supabaseServer() {
  const cookieStore = await cookies()
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Called from a Server Component — safe to ignore since
          // middleware will refresh the session.
        }
      },
    },
  })
}

/**
 * Admin Supabase client — bypasses RLS using the service role key.
 *
 * ⚠️  NEVER use this in client-side code or expose the service role key.
 * Use ONLY for trusted admin operations in route handlers / server actions.
 *
 * @example
 *   const admin = await createSupabaseAdminClient()
 *   await admin.from('users').delete().eq('id', userId)
 */
export async function createSupabaseAdminClient() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      '[supabase-server] SUPABASE_SERVICE_ROLE_KEY is required for admin operations.'
    )
  }
  return createServerClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    cookies: {
      getAll() {
        return []
      },
      setAll() {
        // No-op: admin client doesn't need cookie persistence
      },
    },
  })
}

// Convenience re-export
export type SupabaseServerClient = Awaited<ReturnType<typeof supabaseServer>>
