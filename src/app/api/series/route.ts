import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// ============================================================================
// /api/series — list + create series
// ============================================================================
// Same fixes as /api/gallery:
//   1. Wrapped GET + POST in try/catch — all errors return proper JSON body
//      (no more "Failed to execute 'json' on 'Response': Unexpected end of
//      JSON input" on the frontend).
//   2. Cache-Control: no-store on all responses (no withCache wrapper).
//   3. FK violation on creator_id fixed by running
//      scripts/drop-all-user-fk-constraints.sql in Supabase.
//
// NOTE: The `include: { creator: ... }` query STILL works after dropping the
// FK constraint — Prisma does a LEFT JOIN based on the column, the FK is just
// DB-level referential integrity enforcement. For Google OAuth users (not in
// `users` table), `creator` will be null in the response — frontend should
// handle that gracefully (display session.displayName or "Unknown creator").
// ============================================================================

const NO_STORE = { headers: { 'Cache-Control': 'no-store, max-age=0' } }

// GET /api/series — list all series with article counts
export async function GET() {
  try {
    const series = await db.series.findMany({
      include: {
        _count: { select: { items: true } },
        creator: {
          select: { id: true, username: true, displayName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({
      series: series.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        imageUrl: s.imageUrl,
        // creator may be null for Google OAuth users (not in users table)
        creator: s.creator,
        count: s._count.items,
        createdAt: s.createdAt,
      })),
    }, NO_STORE)
  } catch (e: any) {
    console.error('[api/series GET] query error:', e?.message?.slice(0, 100))
    return NextResponse.json({ series: [], dbError: true }, NO_STORE)
  }
}

// POST /api/series — create a new series (login required)
export async function POST(req: NextRequest) {
  // === 1. Auth check ===
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { error: 'Anda harus login untuk membuat series.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  // === 2. Parse request body ===
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Body request tidak valid (harus JSON).' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  // === 3. Validate input ===
  const title = String(body?.title ?? '').trim()
  const description = body?.description ? String(body.description).trim() : null
  const imageUrl = body?.imageUrl ? String(body.imageUrl).trim() : null

  if (!title) {
    return NextResponse.json(
      { error: 'Judul series wajib diisi.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  // === 4. Create series ===
  try {
    const series = await db.series.create({
      data: { title, description, imageUrl, creatorId: session.userId },
      include: {
        creator: { select: { id: true, username: true, displayName: true } },
      },
    })
    return NextResponse.json({ series, ok: true }, NO_STORE)
  } catch (e: any) {
    const errMsg = e?.message?.slice(0, 200) || 'unknown error'
    console.error('[api/series POST] create error:', errMsg)

    const isFkViolation = e?.code === 'P2003' || /foreign key/i.test(errMsg)
    return NextResponse.json(
      {
        error: isFkViolation
          ? 'Gagal membuat series: constraint FK masih ada. Jalankan scripts/drop-all-user-fk-constraints.sql di Supabase SQL Editor.'
          : 'Gagal menyimpan series. Coba lagi atau hubungi admin.',
        detail: process.env.NODE_ENV === 'development' ? errMsg : undefined,
      },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
