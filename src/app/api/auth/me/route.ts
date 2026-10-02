import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ user: null })
  }

  // === Try Prisma users table first ===
  // This handles custom session users (admin/admin, user/user, fauzi/fauzi)
  // who have a record in the Prisma users table.
  const prismaUser = await db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, username: true, role: true, displayName: true, theme: true },
  }).catch(() => null)

  // === Look up linked student (works for both auth methods) ===
  // The frontend uses this `studentId` to do smart post-login routing:
  //   - present  → go straight to /#/profile/<studentId>
  //   - absent   → go to /#/claim-profile (NIM entry form)
  // Defensive: wrapped in try/catch because the `students` table or
  // `owner_id` column may not exist yet in a fresh Supabase project.
  let studentId: string | null = null
  try {
    const linked = await db.student.findUnique({
      where: { ownerId: session.userId },
      select: { id: true },
    })
    if (linked) studentId = linked.id
  } catch {
    // students table may not exist yet — leave studentId null
  }

  if (prismaUser) {
    // Custom session user — return fresh data from DB
    return NextResponse.json({
      user: {
        id: prismaUser.id,
        username: prismaUser.username,
        role: prismaUser.role as 'admin' | 'user',
        displayName: prismaUser.displayName,
        theme: prismaUser.theme as 'light' | 'dark',
        studentId,
      },
    })
  }

  // === Google OAuth user ===
  // Google OAuth users are NOT in the Prisma users table — they're in
  // Supabase auth.users + profiles. The custom session cookie was set
  // by /auth/callback with their Supabase user info.
  // Return session info directly (no DB lookup needed).
  //
  // The 'role' in the session is 'user' by default. To make a Google
  // OAuth user an admin, run SQL:
  //   UPDATE profiles SET role = 'admin' WHERE id = 'USER_UUID';
  // Then update the session (logout + login again, or add a refresh endpoint).
  return NextResponse.json({
    user: {
      id: session.userId,
      username: session.username,
      role: session.role,
      displayName: session.displayName,
      theme: 'light' as const,
      studentId,
    },
  })
}
