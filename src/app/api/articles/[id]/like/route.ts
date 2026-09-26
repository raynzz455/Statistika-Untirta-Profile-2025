import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// GET /api/articles/[id]/like — get like count + whether I liked
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const session = await getSession()

  const [count, myLike] = await Promise.all([
    db.like.count({ where: { articleId: id } }),
    session ? db.like.findUnique({ where: { userId_articleId: { userId: session.userId, articleId: id } } }) : null,
  ])

  return NextResponse.json({ count, liked: !!myLike })
}

// POST /api/articles/[id]/like — toggle like (login required)
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Anda harus login untuk menyukai artikel.' }, { status: 401 })
  const { id } = await ctx.params

  const article = await db.article.findUnique({ where: { id } })
  if (!article) return NextResponse.json({ error: 'Artikel tidak ditemukan.' }, { status: 404 })

  const existing = await db.like.findUnique({
    where: { userId_articleId: { userId: session.userId, articleId: id } },
  })

  if (existing) {
    await db.like.delete({ where: { id: existing.id } })
    const count = await db.like.count({ where: { articleId: id } })
    return NextResponse.json({ liked: false, count })
  } else {
    await db.like.create({ data: { userId: session.userId, articleId: id } })
    // Create notification for article author (not if liking own article)
    if (article.authorId !== session.userId) {
      try {
        await db.notification.create({
          data: {
            type: 'like',
            recipientId: article.authorId,
            actorId: session.userId,
            articleId: id,
          },
        })
      } catch { /* ignore */ }
    }
    const count = await db.like.count({ where: { articleId: id } })
    return NextResponse.json({ liked: true, count })
  }
}
