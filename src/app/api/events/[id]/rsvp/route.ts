import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// GET /api/events/[id]/rsvps — list all RSVPs for an event (admin/organizer only)
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Anda harus login.' }, { status: 401 })
  const { id } = await ctx.params

  const event = await db.event.findUnique({ where: { id } })
  if (!event) return NextResponse.json({ error: 'Event tidak ditemukan.' }, { status: 404 })

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
  })
}

// POST /api/events/[id]/rsvp — set/update my RSVP status
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Anda harus login.' }, { status: 401 })
  const { id } = await ctx.params

  const body = await req.json()
  const status = ['hadir', 'mungkin', 'tidak'].includes(body?.status) ? body.status : 'hadir'

  const event = await db.event.findUnique({ where: { id } })
  if (!event) return NextResponse.json({ error: 'Event tidak ditemukan.' }, { status: 404 })

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

  return NextResponse.json({ rsvp, status })
}
