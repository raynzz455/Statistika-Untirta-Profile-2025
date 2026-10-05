import { NextResponse } from 'next/server'
import { clearSession } from '@/lib/session'

export async function POST() {
  try {
    await clearSession()
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[api/auth/logout POST] error:', e?.message?.slice(0, 200))
    return NextResponse.json(
      { error: 'Gagal logout. Coba lagi atau hubungi admin.' },
      { status: 500 }
    )
  }
}
