import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// PATCH /api/notifications/[id] — mark single notification as read
export async function PATCH(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Anda harus login.' }, { status: 401 })
  const { id } = await ctx.params

  try {
    const notif = await db.notification.findUnique({ where: { id } })
    if (!notif) return NextResponse.json({ error: 'Notifikasi tidak ditemukan.' }, { status: 404 })
    if (notif.recipientId !== session.userId) {
      return NextResponse.json({ error: 'Tidak punya akses.' }, { status: 403 })
    }

    await db.notification.update({
      where: { id },
      data: { read: true },
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[api/notifications/id PATCH] error:', e?.message?.slice(0, 200))
    return NextResponse.json(
      { error: 'Gagal memperbarui notifikasi. Coba lagi atau hubungi admin.' },
      { status: 500 }
    )
  }
}

// DELETE /api/notifications/[id] — delete notification
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Anda harus login.' }, { status: 401 })
  const { id } = await ctx.params

  try {
    const notif = await db.notification.findUnique({ where: { id } })
    if (!notif) return NextResponse.json({ error: 'Notifikasi tidak ditemukan.' }, { status: 404 })
    if (notif.recipientId !== session.userId) {
      return NextResponse.json({ error: 'Tidak punya akses.' }, { status: 403 })
    }

    await db.notification.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[api/notifications/id DELETE] error:', e?.message?.slice(0, 200))
    return NextResponse.json(
      { error: 'Gagal menghapus notifikasi. Coba lagi atau hubungi admin.' },
      { status: 500 }
    )
  }
}
