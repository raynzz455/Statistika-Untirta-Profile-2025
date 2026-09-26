import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// GET /api/users/[id]/follow — is current user following this user?
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const session = await getSession()
  if (!session) return NextResponse.json({ following: false, followersCount: 0, followingCount: 0 })

  const [existing, followersCount, followingCount] = await Promise.all([
    db.follow.findUnique({
      where: { followerId_followingId: { followerId: session.userId, followingId: id } },
    }),
    db.follow.count({ where: { followingId: id } }),
    db.follow.count({ where: { followerId: id } }),
  ])

  return NextResponse.json({
    following: !!existing,
    followersCount,
    followingCount,
  })
}

// POST /api/users/[id]/follow — toggle follow (login required)
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Anda harus login untuk follow.' }, { status: 401 })
  const { id } = await ctx.params

  if (id === session.userId) {
    return NextResponse.json({ error: 'Tidak dapat follow diri sendiri.' }, { status: 400 })
  }

  const target = await db.user.findUnique({ where: { id } })
  if (!target) return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 })

  const existing = await db.follow.findUnique({
    where: { followerId_followingId: { followerId: session.userId, followingId: id } },
  })

  if (existing) {
    await db.follow.delete({ where: { id: existing.id } })
    return NextResponse.json({ following: false })
  } else {
    await db.follow.create({ data: { followerId: session.userId, followingId: id } })
    // Create notification for the followed user
    try {
      await db.notification.create({
        data: {
          type: 'follow',
          recipientId: id,
          actorId: session.userId,
        },
      })
    } catch { /* ignore notification errors */ }
    return NextResponse.json({ following: true })
  }
}
