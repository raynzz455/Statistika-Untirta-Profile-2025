import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// ============================================================================
// /api/events — list + create events
// ============================================================================
// Same fixes as /api/gallery:
//   1. Removed withCache — uses Cache-Control: no-store so events list
//      always shows fresh data after a user creates an event.
//   2. Wrapped GET + POST in try/catch — all errors return proper JSON body
//      (no more "Failed to execute 'json' on 'Response': Unexpected end of
//      JSON input" on the frontend).
//   3. FK violation on organizer_id fixed by running
//      scripts/drop-all-user-fk-constraints.sql in Supabase.
// ============================================================================

const NO_STORE = { headers: { 'Cache-Control': 'no-store, max-age=0' } }

export async function GET() {
  try {
    const events = await db.event.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ events }, NO_STORE)
  } catch (e: any) {
    console.error('[api/events GET] query error:', e?.message?.slice(0, 100))
    return NextResponse.json({ events: [], dbError: true }, NO_STORE)
  }
}

export async function POST(req: NextRequest) {
  // === 1. Auth check ===
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { error: 'Anda harus login untuk membuat event.' },
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

  // === 3. Validate + extract fields ===
  const title = String(body?.title ?? '').trim()
  const description = String(body?.description ?? '').trim()
  const location = String(body?.location ?? '').trim()
  const startDate = String(body?.startDate ?? '').trim()
  const endDate = body?.endDate ? String(body.endDate).trim() : null
  const category = String(body?.category ?? 'Akademik').trim()
  const imageUrl = body?.imageUrl ? String(body.imageUrl).trim() : null
  // Recurrence fields (whitelist to prevent injection)
  const recurrence = ['none', 'daily', 'weekly', 'monthly'].includes(body?.recurrence)
    ? body.recurrence
    : 'none'
  const recurrenceEndDate = body?.recurrenceEndDate ? String(body.recurrenceEndDate).trim() : null

  if (!title || !startDate) {
    return NextResponse.json(
      { error: 'Judul dan tanggal mulai wajib diisi.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  // === 4. Create event ===
  try {
    const event = await db.event.create({
      data: {
        title,
        description,
        location,
        startDate,
        endDate,
        category,
        imageUrl,
        organizerId: session.userId,
        recurrence,
        recurrenceEndDate,
      },
    })
    return NextResponse.json({ event, ok: true }, NO_STORE)
  } catch (e: any) {
    const errMsg = e?.message?.slice(0, 200) || 'unknown error'
    console.error('[api/events POST] create error:', errMsg)

    const isFkViolation = e?.code === 'P2003' || /foreign key/i.test(errMsg)
    return NextResponse.json(
      {
        error: isFkViolation
          ? 'Gagal membuat event: constraint FK masih ada. Jalankan scripts/drop-all-user-fk-constraints.sql di Supabase SQL Editor.'
          : 'Gagal menyimpan event. Coba lagi atau hubungi admin.',
        detail: process.env.NODE_ENV === 'development' ? errMsg : undefined,
      },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
