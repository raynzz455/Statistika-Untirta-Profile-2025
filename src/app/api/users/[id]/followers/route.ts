import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/users/[id]/followers — list users who follow this user
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const follows = await db.follow.findMany({
    where: { followingId: id },
    include: {
      follower: {
        select: { id: true, username: true, displayName: true, role: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({
    followers: follows.map((f) => f.follower),
  })
}
