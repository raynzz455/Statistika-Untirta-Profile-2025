import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// POST /api/auth/theme — persist current user's theme preference
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Anda harus login.' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const theme = body?.theme === 'dark' ? 'dark' : 'light'

  await db.user.update({
    where: { id: session.userId },
    data: { theme },
  })

  return NextResponse.json({ ok: true, theme })
}
