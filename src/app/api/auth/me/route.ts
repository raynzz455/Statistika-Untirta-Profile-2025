import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ user: null })
  }
  // Fetch fresh user data (including theme, which may have changed since session was set)
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, username: true, role: true, displayName: true, theme: true },
  })
  if (!user) {
    return NextResponse.json({ user: null })
  }
  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      role: user.role as 'admin' | 'user',
      displayName: user.displayName,
      theme: user.theme as 'light' | 'dark',
    },
  })
}
