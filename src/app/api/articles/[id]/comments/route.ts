import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// GET /api/articles/[id]/comments — list comments for an article
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const comments = await db.comment.findMany({
    where: { articleId: id },
    include: {
      user: {
        select: { id: true, username: true, displayName: true, role: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json({ comments })
}

// POST /api/articles/[id]/comments — add a comment (login required)
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Anda harus login untuk berkomentar.' }, { status: 401 })
  const { id } = await ctx.params

  const article = await db.article.findUnique({ where: { id } })
  if (!article) return NextResponse.json({ error: 'Artikel tidak ditemukan.' }, { status: 404 })

  const body = await req.json()
  const content = String(body?.content ?? '').trim()
  if (!content) return NextResponse.json({ error: 'Komentar tidak boleh kosong.' }, { status: 400 })
  if (content.length > 500) return NextResponse.json({ error: 'Komentar maksimal 500 karakter.' }, { status: 400 })

  const comment = await db.comment.create({
    data: { content, articleId: id, userId: session.userId },
    include: {
      user: {
        select: { id: true, username: true, displayName: true, role: true },
      },
    },
  })
  // Create notification for article author (not if commenting on own article)
  if (article.authorId !== session.userId) {
    try {
      await db.notification.create({
        data: {
          type: 'comment',
          recipientId: article.authorId,
          actorId: session.userId,
          articleId: id,
          content: content.slice(0, 100),
        },
      })
    } catch { /* ignore */ }
  }
  return NextResponse.json({ comment })
}

// DELETE /api/articles/[id]/comments?commentId=X — delete a comment (author or admin)
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Anda harus login.' }, { status: 401 })
  const { id } = await ctx.params

  const url = new URL(req.url)
  const commentId = url.searchParams.get('commentId')
  if (!commentId) return NextResponse.json({ error: 'commentId wajib diisi.' }, { status: 400 })

  const comment = await db.comment.findUnique({ where: { id: commentId } })
  if (!comment) return NextResponse.json({ error: 'Komentar tidak ditemukan.' }, { status: 404 })
  if (comment.articleId !== id) return NextResponse.json({ error: 'Komentar tidak cocok dengan artikel.' }, { status: 400 })

  if (comment.userId !== session.userId && session.role !== 'admin') {
    return NextResponse.json({ error: 'Tidak punya akses.' }, { status: 403 })
  }

  await db.comment.delete({ where: { id: commentId } })
  return NextResponse.json({ ok: true })
}
