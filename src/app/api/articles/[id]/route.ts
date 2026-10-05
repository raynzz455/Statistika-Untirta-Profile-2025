import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// ============================================================================
// /api/articles/[id] — GET, PUT, DELETE single article
// ============================================================================
// Security:
//   - GET: public (no auth needed to read published articles)
//   - PUT: author OR admin only
//   - DELETE: author OR admin only, IDEMPOTENT (returns 200 even if
//     article already deleted — prevents 404 when user clicks delete
//     on a stale list item)
// ============================================================================

const NO_STORE = { headers: { 'Cache-Control': 'no-store, max-age=0' } }

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  try {
    const article = await db.article.findUnique({
      where: { id },
      include: { tags: { include: { tag: true } } },
    })
    if (!article) {
      return NextResponse.json(
        { error: 'Artikel tidak ditemukan.' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } }
      )
    }
    return NextResponse.json({ article }, NO_STORE)
  } catch (e: any) {
    console.error('[api/articles/[id] GET] error:', e?.message?.slice(0, 100))
    return NextResponse.json(
      { error: 'Gagal memuat artikel.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { error: 'Anda harus login.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    )
  }
  const { id } = await ctx.params

  try {
    const article = await db.article.findUnique({ where: { id } })
    if (!article) {
      return NextResponse.json(
        { error: 'Artikel tidak ditemukan.' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } }
      )
    }

    // Only author or admin can edit
    if (article.authorId !== session.userId && session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Tidak punya akses.' },
        { status: 403, headers: { 'Cache-Control': 'no-store' } }
      )
    }

    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { error: 'Body request tidak valid.' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      )
    }

    const updated = await db.article.update({
      where: { id },
      data: {
        ...(body.title !== undefined ? { title: String(body.title).slice(0, 500) } : {}),
        ...(body.excerpt !== undefined ? { excerpt: String(body.excerpt).slice(0, 1000) } : {}),
        ...(body.content !== undefined ? { content: String(body.content) } : {}),
        ...(body.category !== undefined ? { category: String(body.category) } : {}),
        ...(body.date !== undefined ? { date: String(body.date) } : {}),
        ...(body.author !== undefined ? { author: String(body.author).slice(0, 200) } : {}),
        ...(body.imageUrl !== undefined ? { imageUrl: body.imageUrl ? String(body.imageUrl) : null } : {}),
        ...(body.published !== undefined ? { published: Boolean(body.published) } : {}),
      },
    })
    return NextResponse.json({ article: updated, ok: true }, NO_STORE)
  } catch (e: any) {
    console.error('[api/articles/[id] PUT] error:', e?.message?.slice(0, 100))
    return NextResponse.json(
      { error: 'Gagal memperbarui artikel.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { error: 'Anda harus login.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    )
  }
  const { id } = await ctx.params

  try {
    const article = await db.article.findUnique({ where: { id } })
    if (!article) {
      // IDEMPOTENT DELETE: return 200 even if article doesn't exist.
      // This prevents 404 when user clicks delete on a stale list item
      // (article was already deleted by another admin/session).
      return NextResponse.json(
        { ok: true, alreadyDeleted: true, message: 'Artikel sudah dihapus.' },
        NO_STORE
      )
    }

    // Only author or admin can delete
    if (article.authorId !== session.userId && session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Tidak punya akses.' },
        { status: 403, headers: { 'Cache-Control': 'no-store' } }
      )
    }

    await db.article.delete({ where: { id } })
    return NextResponse.json({ ok: true }, NO_STORE)
  } catch (e: any) {
    console.error('[api/articles/[id] DELETE] error:', e?.message?.slice(0, 100))
    return NextResponse.json(
      { error: 'Gagal menghapus artikel.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
