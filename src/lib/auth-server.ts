// ============================================================================
// Unified Auth Helper — works with BOTH custom session AND Supabase Auth
// ============================================================================
// This helper provides a single API for authentication checks across
// route handlers. It gracefully falls back between:
//   1. Supabase Auth (preferred — when NEXT_PUBLIC_SUPABASE_URL is set)
//   2. Custom cookie-based session (src/lib/session.ts — for local dev)
//
// Gradual migration path:
//   - Step 1: Use getCurrentUser() in route handlers (instead of getSession())
//   - Step 2: When Supabase is configured, automatically uses Supabase Auth
//   - Step 3: When Supabase is not configured, falls back to custom session
//   - Step 4: Eventually remove custom session.ts entirely
//
// Usage:
//   import { getCurrentUser, requireAuth, requireAdmin } from '@/lib/auth-server'
//
//   // Get user (returns null if not authenticated)
//   const user = await getCurrentUser()
//
//   // Require authentication (returns 401 if not)
//   const auth = await requireAuth()
//   if (auth.error) return auth.error
//   const user = auth.user!
//
//   // Require admin role (returns 403 if not admin)
//   const admin = await requireAdmin()
//   if (admin.error) return admin.error
//   const user = admin.user!
// ============================================================================

import { NextResponse } from 'next/server'
import { getSession, type SessionPayload } from '@/lib/session'
import { supabaseServer } from '@/lib/supabase-server'
import { db } from '@/lib/db'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

function isSupabaseConfigured(): boolean {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY)
}

export interface UnifiedUser {
  id: string
  username: string
  role: 'admin' | 'user'
  displayName: string | null
  email?: string | null
  source: 'supabase' | 'custom-session'
}

interface AuthResult {
  user: UnifiedUser | null
  error: NextResponse | null
}

/**
 * Get the currently authenticated user (from Supabase Auth OR custom session).
 * Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<UnifiedUser | null> {
  // === TRY SUPABASE AUTH FIRST (if configured) ===
  if (isSupabaseConfigured()) {
    try {
      const supabase = await supabaseServer()
      const { data, error } = await supabase.auth.getUser()

      if (!error && data?.user) {
        // Look up the user's role from the profiles table
        const profile = await db.$queryRaw<{ role: string | null; username: string | null; display_name: string | null }[]>`
          SELECT role, username, display_name FROM profiles WHERE id = ${data.user.id}::text
        `.catch(() => [])

        const role = (profile?.[0]?.role as 'admin' | 'user') || 'user'
        const username = profile?.[0]?.username || data.user.email?.split('@')[0] || 'user'
        const displayName = profile?.[0]?.display_name || username

        return {
          id: data.user.id,
          username,
          role,
          displayName,
          email: data.user.email,
          source: 'supabase',
        }
      }
    } catch (e) {
      console.error('[auth-server] Supabase getUser error:', e)
      // Fall through to custom session
    }
  }

  // === FALLBACK TO CUSTOM SESSION (src/lib/session.ts) ===
  const session: SessionPayload | null = await getSession()
  if (session) {
    return {
      id: session.userId,
      username: session.username,
      role: session.role,
      displayName: session.displayName,
      source: 'custom-session',
    }
  }

  return null
}

/**
 * Require authentication — returns user or 401 error response.
 *
 * @example
 *   const auth = await requireAuth()
 *   if (auth.error) return auth.error
 *   const user = auth.user!
 */
export async function requireAuth(): Promise<AuthResult> {
  const user = await getCurrentUser()
  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Anda harus login untuk mengakses resource ini.' },
        { status: 401 }
      ),
    }
  }
  return { user, error: null }
}

/**
 * Require admin role — returns user or 403 error response.
 *
 * @example
 *   const admin = await requireAdmin()
 *   if (admin.error) return admin.error
 *   const user = admin.user!
 */
export async function requireAdmin(): Promise<AuthResult> {
  const auth = await requireAuth()
  if (auth.error) return auth

  if (auth.user!.role !== 'admin') {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Hanya admin yang dapat mengakses resource ini.' },
        { status: 403 }
      ),
    }
  }

  return auth
}

/**
 * Check if the current user is the owner of a resource (by user_id field).
 * Returns true if user is admin OR is the owner.
 */
export async function canAccessResource(resourceOwnerId: string): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false
  if (user.role === 'admin') return true
  return user.id === resourceOwnerId
}

/**
 * Log admin actions to audit_log table (for security tracking).
 * Safe to call even if audit_log table doesn't exist (silent failure).
 */
export async function logAdminAction(
  action: string,
  targetId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const user = await getCurrentUser()
    if (!user) return

    await db.$executeRaw`
      INSERT INTO audit_log (actor_id, action, target_id, metadata)
      VALUES (${user.id}, ${action}, ${targetId || null}, ${metadata ? JSON.stringify(metadata) : null})
    `.catch(() => {
      // audit_log table may not exist in local SQLite — ignore
    })
  } catch (e) {
    // Silent failure — audit log is best-effort
    console.error('[auth-server] audit log error:', e)
  }
}
