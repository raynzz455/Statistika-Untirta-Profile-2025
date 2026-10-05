import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// GET /api/dosen/[id] — get single dosen
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  try {
    const dosen = await db.dosen.findUnique({ where: { id } })
    if (!dosen) return NextResponse.json({ error: 'Dosen tidak ditemukan.' }, { status: 404 })
    return NextResponse.json({ dosen })
  } catch (e: any) {
    console.error('[api/dosen/id GET] query error:', e?.message?.slice(0, 100))
    return NextResponse.json({ dosen: null, dbError: true })
  }
}

// PUT /api/dosen/[id] — update (admin only)
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Hanya admin.' }, { status: 403 })
  }
  const { id } = await ctx.params

  try {
    const body = await req.json()
    const updated = await db.dosen.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: String(body.name) } : {}),
        ...(body.title !== undefined ? { title: body.title ? String(body.title) : null } : {}),
        ...(body.role !== undefined ? { role: String(body.role) } : {}),
        ...(body.expertise !== undefined ? { expertise: body.expertise ? String(body.expertise) : null } : {}),
        ...(body.bio !== undefined ? { bio: body.bio ? String(body.bio) : null } : {}),
        ...(body.email !== undefined ? { email: body.email ? String(body.email) : null } : {}),
        ...(body.imageUrl !== undefined ? { imageUrl: body.imageUrl ? String(body.imageUrl) : null } : {}),
        ...(body.courses !== undefined ? { courses: body.courses ? String(body.courses) : null } : {}),
        ...(body.order !== undefined ? { order: Number(body.order) } : {}),
      },
    })
    return NextResponse.json({ dosen: updated })
  } catch (e: any) {
    console.error('[api/dosen/id PUT] error:', e?.message?.slice(0, 200))
    return NextResponse.json(
      { error: 'Gagal memperbarui dosen. Coba lagi atau hubungi admin.' },
      { status: 500 }
    )
  }
}

// DELETE /api/dosen/[id] — delete (admin only)
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Hanya admin.' }, { status: 403 })
  }
  const { id } = await ctx.params

  try {
    await db.dosen.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[api/dosen/id DELETE] error:', e?.message?.slice(0, 200))
    return NextResponse.json(
      { error: 'Gagal menghapus dosen. Coba lagi atau hubungi admin.' },
      { status: 500 }
    )
  }
}
