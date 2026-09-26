import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/users/[id]/following — list users this user is following
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const follows = await db.follow.findMany({
    where: { followerId: id },
    include: {
      following: {
        select: { id: true, username: true, displayName: true, role: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({
    following: follows.map((f) => f.following),
  })
}
