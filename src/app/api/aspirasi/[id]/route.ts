import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// DELETE /api/aspirasi/[id] — admin only
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Hanya admin.' }, { status: 403 })
  }
  const { id } = await params
  if (!id) return NextResponse.json({ error: 'ID wajib diisi.' }, { status: 400 })

  try {
    await db.aspirasi.delete({ where: { id } })
  } catch {
    return NextResponse.json({ error: 'Aspirasi tidak ditemukan.' }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}
