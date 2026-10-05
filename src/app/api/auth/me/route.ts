import { NextResponse } from 'next/server'
import { getSession, setSession } from '@/lib/session'
import { db } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ user: null })
  }

  // === Try Prisma users table first (custom session users) ===
  const prismaUser = await db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, username: true, role: true, displayName: true, theme: true },
  }).catch(() => null)

  if (prismaUser) {
    return NextResponse.json({
      user: {
        id: prismaUser.id,
        username: prismaUser.username,
        role: prismaUser.role as 'admin' | 'user',
        displayName: prismaUser.displayName,
        theme: prismaUser.theme as 'light' | 'dark',
        studentId: null,
      },
    })
  }

  // === Google OAuth / email-password user ===
  // These users are NOT in the Prisma users table. They're in Supabase
  // auth.users + profiles. The session cookie was set at login time.
  //
  // CRITICAL: We re-read the role from the `profiles` table EVERY TIME
  // /api/auth/me is called (on every page load). This means:
  //   1. Admin runs: UPDATE profiles SET role = 'admin' WHERE id = 'UUID';
  //   2. User refreshes the page
  //   3. /api/auth/me reads the NEW role from profiles
  //   4. Session cookie is updated with the new role
  //   5. User sees admin panel immediately — NO logout/login needed!
  let role: 'admin' | 'user' = session.role // default to session's role
  try {
    const profile = await db.$queryRaw<{ role: string | null }[]>`
      SELECT role FROM profiles WHERE id = ${session.userId}::text
    `.catch(() => [])
    if (profile && profile.length > 0) {
      // Found the profile — use the role from the DB (might have been updated)
      role = (profile[0].role as 'admin' | 'user') || 'user'

      // If the role changed since login, update the session cookie
      // so subsequent requests use the new role without re-querying.
      if (role !== session.role) {
        console.log(`[auth/me] Role changed for user ${session.userId}: ${session.role} → ${role}. Updating session.`)
        await setSession({
          userId: session.userId,
          username: session.username,
          role,
          displayName: session.displayName,
        })
      }
    }
  } catch {
    // profiles table might not exist — use session role as fallback
  }

  // Look up linked student (for smart routing)
  let studentId: string | null = null
  try {
    const linked = await db.student.findUnique({
      where: { ownerId: session.userId },
      select: { id: true },
    })
    if (linked) studentId = linked.id
  } catch {
    // students table may not exist yet
  }

  return NextResponse.json({
    user: {
      id: session.userId,
      username: session.username,
      role, // ← fresh from DB, not stale from session cookie
      displayName: session.displayName,
      theme: 'light' as const,
      studentId,
    },
  })
}
