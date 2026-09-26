import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Anda harus login.' }, { status: 401 })
  const { id } = await ctx.params

  const item = await db.gallery.findUnique({ where: { id } })
  if (!item) return NextResponse.json({ error: 'Item tidak ditemukan.' }, { status: 404 })

  if (item.uploaderId !== session.userId && session.role !== 'admin') {
    return NextResponse.json({ error: 'Tidak punya akses.' }, { status: 403 })
  }

  await db.gallery.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
