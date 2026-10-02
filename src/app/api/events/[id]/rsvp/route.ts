import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// ============================================================================
// /api/events/[id]/rsvp — list + create/update RSVP
// ============================================================================
// Fixes:
//   1. Wrapped GET + POST in try/catch — DB errors return proper JSON body
//      instead of empty 500 (which caused "Failed to execute 'json' on
//      'Response': Unexpected end of JSON input" on the frontend).
//   2. Cache-Control: no-store on all responses (RSVP counts must be fresh).
//   3. FK violation on rsvps.user_id fixed by running
//      scripts/drop-all-user-fk-constraints.sql in Supabase.
// ============================================================================

const NO_STORE = { headers: { 'Cache-Control': 'no-store, max-age=0' } }
const noStoreHeader = { 'Cache-Control': 'no-store' }

// GET /api/events/[id]/rsvp — list all RSVPs for an event
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { error: 'Anda harus login.' },
      { status: 401, headers: noStoreHeader }
    )
  }
  const { id } = await ctx.params

  try {
    const event = await db.event.findUnique({ where: { id } })
    if (!event) {
      return NextResponse.json(
        { error: 'Event tidak ditemukan.' },
        { status: 404, headers: noStoreHeader }
      )
    }

    const rsvps = await db.rsvp.findMany({
      where: { eventId: id },
      include: {
        user: {
          select: { id: true, username: true, displayName: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Group by status
    const grouped = {
      hadir: rsvps.filter((r) => r.status === 'hadir'),
      mungkin: rsvps.filter((r) => r.status === 'mungkin'),
      tidak: rsvps.filter((r) => r.status === 'tidak'),
    }

    return NextResponse.json({
      rsvps,
      grouped,
      myStatus: rsvps.find((r) => r.userId === session.userId)?.status || null,
      counts: {
        hadir: grouped.hadir.length,
        mungkin: grouped.mungkin.length,
        tidak: grouped.tidak.length,
        total: rsvps.length,
      },
    }, NO_STORE)
  } catch (e: any) {
    console.error('[api/events/[id]/rsvp GET] error:', e?.message?.slice(0, 100))
    return NextResponse.json(
      {
        rsvps: [],
        grouped: { hadir: [], mungkin: [], tidak: [] },
        myStatus: null,
        counts: { hadir: 0, mungkin: 0, tidak: 0, total: 0 },
        dbError: true,
      },
      NO_STORE
    )
  }
}

// POST /api/events/[id]/rsvp — set/update my RSVP status
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { error: 'Anda harus login untuk RSVP.' },
      { status: 401, headers: noStoreHeader }
    )
  }
  const { id } = await ctx.params

  // Parse body
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Body request tidak valid.' },
      { status: 400, headers: noStoreHeader }
    )
  }

  const status = ['hadir', 'mungkin', 'tidak'].includes(body?.status) ? body.status : 'hadir'

  try {
    const event = await db.event.findUnique({ where: { id } })
    if (!event) {
      return NextResponse.json(
        { error: 'Event tidak ditemukan.' },
        { status: 404, headers: noStoreHeader }
      )
    }

    // Upsert RSVP for current user
    const existing = await db.rsvp.findUnique({
      where: { userId_eventId: { userId: session.userId, eventId: id } },
    })

    let rsvp
    if (existing) {
      rsvp = await db.rsvp.update({
        where: { id: existing.id },
        data: { status },
      })
    } else {
      rsvp = await db.rsvp.create({
        data: { userId: session.userId, eventId: id, status },
      })
    }

    return NextResponse.json({ rsvp, status, ok: true }, NO_STORE)
  } catch (e: any) {
    const errMsg = e?.message?.slice(0, 200) || 'unknown error'
    console.error('[api/events/[id]/rsvp POST] error:', errMsg)

    // Detect FK violation (Google OAuth user UUID not in users table)
    const isFkViolation = e?.code === 'P2003' || /foreign key/i.test(errMsg)
    return NextResponse.json(
      {
        error: isFkViolation
          ? 'Gagal RSVP: constraint FK masih ada. Jalankan scripts/drop-all-user-fk-constraints.sql di Supabase SQL Editor.'
          : 'Gagal memperbarui RSVP. Coba lagi.',
        detail: process.env.NODE_ENV === 'development' ? errMsg : undefined,
      },
      { status: 500, headers: noStoreHeader }
    )
  }
}
