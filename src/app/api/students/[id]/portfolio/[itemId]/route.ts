// ============================================================================
// Portfolio Item CRUD — /api/students/[id]/portfolio/[itemId]
// ============================================================================
// PUT    — update portfolio item (owner/admin only)
// DELETE — delete portfolio item (owner/admin only)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

const ALLOWED_TYPES = ['website', 'project', 'certificate']

/** PUT /api/students/[id]/portfolio/[itemId] — update item (owner/admin) */
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string; itemId: string }> }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Anda harus login.' }, { status: 401 })
  }
  const { id, itemId } = await ctx.params

  try {
    const student = await db.student.findUnique({ where: { id } })
    if (!student) {
      return NextResponse.json({ error: 'Mahasiswa tidak ditemukan.' }, { status: 404 })
    }

    const isOwner = student.ownerId === session.userId
    const isAdmin = session.role === 'admin'
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Tidak punya akses.' }, { status: 403 })
    }

    // Verify portfolio item exists and belongs to this student
    const existing = await db.studentPortfolio.findFirst({
      where: { id: itemId, studentId: id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Item portofolio tidak ditemukan.' }, { status: 404 })
    }

    const body = await req.json()
    const data: Record<string, unknown> = {}

    if (body.type !== undefined) {
      const type = String(body.type).trim()
      if (!ALLOWED_TYPES.includes(type)) {
        return NextResponse.json(
          { error: `Tipe harus salah satu: ${ALLOWED_TYPES.join(', ')}` },
          { status: 400 }
        )
      }
      data.type = type
    }
    if (body.title !== undefined) {
      const title = String(body.title).trim()
      if (title.length < 3) {
        return NextResponse.json({ error: 'Judul min 3 karakter.' }, { status: 400 })
      }
      data.title = title
    }
    if (body.description !== undefined) {
      data.description = body.description ? String(body.description).trim().slice(0, 500) : null
    }
    if (body.url !== undefined) {
      const url = body.url ? String(body.url).trim().slice(0, 500) : null
      if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
        return NextResponse.json({ error: 'URL harus diawali http:// atau https://' }, { status: 400 })
      }
      data.url = url
    }
    if (body.imageUrl !== undefined) {
      data.imageUrl = body.imageUrl ? String(body.imageUrl).trim().slice(0, 500) : null
    }
    if (body.issuer !== undefined) {
      data.issuer = body.issuer ? String(body.issuer).trim().slice(0, 200) : null
    }
    if (body.date !== undefined) {
      data.date = body.date ? String(body.date).trim().slice(0, 20) : null
    }
    if (body.order !== undefined) {
      const order = Number(body.order)
      data.order = isNaN(order) ? 0 : order
    }

    const updated = await db.studentPortfolio.update({
      where: { id: itemId },
      data,
    })

    return NextResponse.json({ item: updated })
  } catch (e: any) {
    console.error('[api/students/id/portfolio/itemId PUT] error:', e?.message?.slice(0, 200))
    return NextResponse.json(
      { error: 'Gagal memperbarui item portofolio. Coba lagi atau hubungi admin.' },
      { status: 500 }
    )
  }
}

/** DELETE /api/students/[id]/portfolio/[itemId] — delete item (owner/admin) */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string; itemId: string }> }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Anda harus login.' }, { status: 401 })
  }
  const { id, itemId } = await ctx.params

  try {
    const student = await db.student.findUnique({ where: { id } })
    if (!student) {
      return NextResponse.json({ error: 'Mahasiswa tidak ditemukan.' }, { status: 404 })
    }

    const isOwner = student.ownerId === session.userId
    const isAdmin = session.role === 'admin'
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Tidak punya akses.' }, { status: 403 })
    }

    // Verify ownership
    const existing = await db.studentPortfolio.findFirst({
      where: { id: itemId, studentId: id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Item portofolio tidak ditemukan.' }, { status: 404 })
    }

    await db.studentPortfolio.delete({ where: { id: itemId } })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[api/students/id/portfolio/itemId DELETE] error:', e?.message?.slice(0, 200))
    return NextResponse.json(
      { error: 'Gagal menghapus item portofolio. Coba lagi atau hubungi admin.' },
      { status: 500 }
    )
  }
}
