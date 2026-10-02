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

    // CRITICAL FIX: Removed `include: { user: ... }` from findMany.
    // The include was doing a LEFT JOIN with the `users` table. For Google
    // OAuth users (not in Prisma users table), this JOIN returned null for
    // the user field. The Prisma client was apparently crashing on this
    // null relation (even though LEFT JOIN should handle it), causing the
    // entire GET route to throw → catch block → return 0 counts.
    //
    // Now we fetch RSVPs WITHOUT the user include. The counts and myStatus
    // don't need user info — only the optional "attendee list" does.
    // For the attendee list, we do a SEPARATE user lookup that gracefully
    // handles null users.
    const rsvps = await db.rsvp.findMany({
      where: { eventId: id },
      orderBy: { createdAt: 'asc' },
      // NO include: { user: ... } — this was causing the crash!
    })

    // Group by status
    const grouped = {
      hadir: rsvps.filter((r) => r.status === 'hadir'),
      mungkin: rsvps.filter((r) => r.status === 'mungkin'),
      tidak: rsvps.filter((r) => r.status === 'tidak'),
    }

    // Build RSVP response with user info (separate lookup, graceful null handling)
    // For Google OAuth users not in Prisma users table, user will be null.
    // We return the RSVPs with user: null, and the frontend handles it
    // with optional chaining (r.user?.displayName || 'Anggota').
    const userIds = [...new Set(rsvps.map((r) => r.userId))]
    let userMap = new Map<string, { id: string; username: string; displayName: string | null }>()
    if (userIds.length > 0) {
      try {
        const users = await db.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, username: true, displayName: true },
        })
        userMap = new Map(users.map((u) => [u.id, u]))
      } catch {
        // users table lookup failed — proceed with empty userMap
        // RSVPs will show 'Anggota' instead of user name
      }
    }

    const rsvpsWithUsers = rsvps.map((r) => ({
      ...r,
      user: userMap.get(r.userId) || null,
    }))

    return NextResponse.json({
      rsvps: rsvpsWithUsers,
      grouped: {
        hadir: grouped.hadir.map((r) => ({ ...r, user: userMap.get(r.userId) || null })),
        mungkin: grouped.mungkin.map((r) => ({ ...r, user: userMap.get(r.userId) || null })),
        tidak: grouped.tidak.map((r) => ({ ...r, user: userMap.get(r.userId) || null })),
      },
      myStatus: rsvps.find((r) => r.userId === session.userId)?.status || null,
      counts: {
        hadir: grouped.hadir.length,
        mungkin: grouped.mungkin.length,
        tidak: grouped.tidak.length,
        total: rsvps.length,
      },
      // Debug info — helps diagnose issues from the frontend console
      _debug: {
        eventId: id,
        sessionUserId: session.userId?.slice(0, 8) + '...',
        rsvpCount: rsvps.length,
        rsvpUserIds: rsvps.map((r) => r.userId?.slice(0, 8) + '...'),
      },
    }, NO_STORE)
  } catch (e: any) {
    const errMsg = e?.message?.slice(0, 200) || 'unknown error'
    console.error('[api/events/[id]/rsvp GET] error:', errMsg)
    // Include error details in response so frontend console.log can show it
    return NextResponse.json(
      {
        rsvps: [],
        grouped: { hadir: [], mungkin: [], tidak: [] },
        myStatus: null,
        counts: { hadir: 0, mungkin: 0, tidak: 0, total: 0 },
        dbError: true,
        // Include the actual error message so the frontend can log it
        _error: process.env.NODE_ENV === 'development' ? errMsg : 'Database query failed',
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
