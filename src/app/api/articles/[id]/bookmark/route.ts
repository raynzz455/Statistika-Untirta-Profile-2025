import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// GET /api/articles/[id]/bookmark — is this article bookmarked by me?
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const session = await getSession()
  if (!session) return NextResponse.json({ bookmarked: false })

  const bm = await db.bookmark.findUnique({
    where: { userId_articleId: { userId: session.userId, articleId: id } },
  })
  return NextResponse.json({ bookmarked: !!bm })
}

// POST /api/articles/[id]/bookmark — toggle bookmark
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Anda harus login untuk menyimpan artikel.' }, { status: 401 })
  const { id } = await ctx.params

  const article = await db.article.findUnique({ where: { id } })
  if (!article) return NextResponse.json({ error: 'Artikel tidak ditemukan.' }, { status: 404 })

  const existing = await db.bookmark.findUnique({
    where: { userId_articleId: { userId: session.userId, articleId: id } },
  })

  if (existing) {
    await db.bookmark.delete({ where: { id: existing.id } })
    return NextResponse.json({ bookmarked: false })
  } else {
    await db.bookmark.create({ data: { userId: session.userId, articleId: id } })
    return NextResponse.json({ bookmarked: true })
  }
}
