// ============================================================================
// Portfolio CRUD — /api/students/[id]/portfolio
// ============================================================================
// GET    — list all portfolio items for a student (public)
// POST   — add a new portfolio item (owner or admin only)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

const ALLOWED_TYPES = ['website', 'project', 'certificate']

/** GET /api/students/[id]/portfolio — list portfolio items (public) */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params

  try {
    // Verify student exists
    const student = await db.student.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!student) {
      return NextResponse.json({ error: 'Mahasiswa tidak ditemukan.' }, { status: 404 })
    }

    const portfolios = await db.studentPortfolio.findMany({
      where: { studentId: id },
      orderBy: [{ type: 'asc' }, { order: 'asc' }, { createdAt: 'desc' }],
    })

    // Group by type for easier frontend consumption
    const grouped = {
      website: portfolios.filter((p) => p.type === 'website'),
      project: portfolios.filter((p) => p.type === 'project'),
      certificate: portfolios.filter((p) => p.type === 'certificate'),
    }

    return NextResponse.json({
      portfolios,
      grouped,
      total: portfolios.length,
    })
  } catch (e: any) {
    console.error('[api/students/id/portfolio GET] query error:', e?.message?.slice(0, 100))
    return NextResponse.json({
      portfolios: [],
      grouped: { website: [], project: [], certificate: [] },
      total: 0,
      dbError: true,
    })
  }
}

/** POST /api/students/[id]/portfolio — add portfolio item (owner/admin only) */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Anda harus login.' }, { status: 401 })
  }
  const { id } = await ctx.params

  try {
    // Verify student exists
    const student = await db.student.findUnique({ where: { id } })
    if (!student) {
      return NextResponse.json({ error: 'Mahasiswa tidak ditemukan.' }, { status: 404 })
    }

    // Owner of profile OR admin can add portfolio
    const isOwner = student.ownerId === session.userId
    const isAdmin = session.role === 'admin'
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Tidak punya akses.' }, { status: 403 })
    }

    const body = await req.json()
    const type = String(body?.type ?? '').trim()
    const title = String(body?.title ?? '').trim()

    if (!ALLOWED_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Tipe harus salah satu: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      )
    }
    if (!title || title.length < 3) {
      return NextResponse.json({ error: 'Judul wajib diisi (min 3 karakter).' }, { status: 400 })
    }

    const description = body?.description ? String(body.description).trim().slice(0, 500) : null
    const url = body?.url ? String(body.url).trim().slice(0, 500) : null
    const imageUrl = body?.imageUrl ? String(body.imageUrl).trim().slice(0, 500) : null
    const issuer = body?.issuer ? String(body.issuer).trim().slice(0, 200) : null
    const date = body?.date ? String(body.date).trim().slice(0, 20) : null
    const order = body?.order !== undefined ? Number(body.order) : 0

    // Validate URL format if provided
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      return NextResponse.json(
        { error: 'URL harus diawali dengan http:// atau https://' },
        { status: 400 }
      )
    }

    const item = await db.studentPortfolio.create({
      data: {
        studentId: id,
        type,
        title,
        description,
        url,
        imageUrl,
        issuer,
        date,
        order: isNaN(order) ? 0 : order,
      },
    })

    return NextResponse.json({ item }, { status: 201 })
  } catch (e: any) {
    console.error('[api/students/id/portfolio POST] error:', e?.message?.slice(0, 200))
    return NextResponse.json(
      { error: 'Gagal menambah item portofolio. Coba lagi atau hubungi admin.' },
      { status: 500 }
    )
  }
}
