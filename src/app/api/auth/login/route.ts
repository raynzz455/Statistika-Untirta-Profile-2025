import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, setSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const username = String(body?.username ?? '').trim().toLowerCase()
    const password = String(body?.password ?? '')

    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan password wajib diisi.' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { username } })
    if (!user) {
      return NextResponse.json({ error: 'Username atau password salah.' }, { status: 401 })
    }

    if (user.passwordHash !== hashPassword(password)) {
      return NextResponse.json({ error: 'Username atau password salah.' }, { status: 401 })
    }

    await setSession({
      userId: user.id,
      username: user.username,
      role: user.role as 'admin' | 'user',
      displayName: user.displayName,
    })

    // Look up linked student (if any) so the frontend can apply
    // smart post-login routing (claimed → profile, unclaimed → claim-profile).
    let studentId: string | null = null
    try {
      const linked = await db.student.findUnique({
        where: { ownerId: user.id },
        select: { id: true },
      })
      if (linked) studentId = linked.id
    } catch {
      // students table may not exist yet — leave studentId null
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        displayName: user.displayName,
        theme: user.theme,
        studentId,
      },
    })
  } catch (e) {
    console.error('[auth/login] error', e)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}
