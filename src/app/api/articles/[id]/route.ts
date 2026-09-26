import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

function placeholder(text: string, w = 800, h = 600) {
  return `https://placehold.co/${w}x${h}/f9d8e5/1a1a1a?text=${encodeURIComponent(text)}`
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const article = await db.article.findUnique({ where: { id } })
  if (!article) return NextResponse.json({ error: 'Artikel tidak ditemukan.' }, { status: 404 })
  return NextResponse.json({ article })
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Anda harus login.' }, { status: 401 })
  const { id } = await ctx.params

  const article = await db.article.findUnique({ where: { id } })
  if (!article) return NextResponse.json({ error: 'Artikel tidak ditemukan.' }, { status: 404 })

  // Only author or admin can edit
  if (article.authorId !== session.userId && session.role !== 'admin') {
    return NextResponse.json({ error: 'Tidak punya akses.' }, { status: 403 })
  }

  const body = await req.json()
  const updated = await db.article.update({
    where: { id },
    data: {
      ...(body.title !== undefined ? { title: String(body.title) } : {}),
      ...(body.excerpt !== undefined ? { excerpt: String(body.excerpt) } : {}),
      ...(body.content !== undefined ? { content: String(body.content) } : {}),
      ...(body.category !== undefined ? { category: String(body.category) } : {}),
      ...(body.date !== undefined ? { date: String(body.date) } : {}),
      ...(body.author !== undefined ? { author: String(body.author) } : {}),
      ...(body.imageUrl !== undefined ? { imageUrl: body.imageUrl ? String(body.imageUrl) : placeholder(article.title.slice(0, 20)) } : {}),
      ...(body.published !== undefined ? { published: Boolean(body.published) } : {}),
    },
  })
  return NextResponse.json({ article: updated })
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Anda harus login.' }, { status: 401 })
  const { id } = await ctx.params

  const article = await db.article.findUnique({ where: { id } })
  if (!article) return NextResponse.json({ error: 'Artikel tidak ditemukan.' }, { status: 404 })

  if (article.authorId !== session.userId && session.role !== 'admin') {
    return NextResponse.json({ error: 'Tidak punya akses.' }, { status: 403 })
  }

  await db.article.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
