import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
// withCache removed — next.config.ts sets Cache-Control: no-store on ALL /api/* routes

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const category = url.searchParams.get('category')
  const limit = Number(url.searchParams.get('limit') ?? '0') || undefined
  const includeDrafts = url.searchParams.get('includeDrafts') === '1'

  // Check session: drafts are visible to logged-in users (their own + admin sees all)
  let session: Awaited<ReturnType<typeof getSession>> = null
  if (includeDrafts) {
    session = await getSession()
  }

  let articles: any[] = []
  try {
    articles = await db.article.findMany({
      where: {
        AND: [
          // Published articles visible to everyone; drafts only to author/admin
          includeDrafts && session
            ? {
                OR: [
                  { published: true },
                  { authorId: session.userId },
                  ...(session.role === 'admin' ? [{}] : []),
                ],
              }
            : { published: true },
          ...(category && category !== 'all' ? [{ category }] : []),
        ],
      },
      include: {
        tags: { include: { tag: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  } catch (e: any) {
    // DB unreachable (missing DATABASE_URL, schema not pushed, etc).
    // Return empty list + dbError flag instead of 500 so the frontend
    // can render "Belum ada artikel" gracefully.
    console.error('[api/articles] query error:', e?.message?.slice(0, 100))
    return NextResponse.json(
      NextResponse.json({ articles: [], dbError: true }),
      CachePresets.publicDynamic
    )
  }
  return NextResponse.json(
    NextResponse.json({
      articles: articles.map((a) => ({
        ...a,
        tags: a.tags.map((at) => ({ id: at.tag.id, name: at.tag.name, color: at.tag.color })),
      })),
    }),
    CachePresets.publicList
  )
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { error: 'Anda harus login.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  try {
    const body = await req.json()
    const title = String(body?.title ?? '').trim()
    const excerpt = String(body?.excerpt ?? '').trim()
    const content = String(body?.content ?? '').trim()
    const category = String(body?.category ?? 'Berita').trim()
    const date = String(body?.date ?? new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })).trim()
    const author = body?.author ? String(body.author).trim() : session.displayName || session.username
    // Empty imageUrl means the frontend will render our prominent "Foto Tidak Tersedia" placeholder
    const imageUrl = body?.imageUrl ? String(body.imageUrl).trim() : null

    if (!title || !excerpt) {
      return NextResponse.json(
        { error: 'Judul dan ringkasan wajib diisi.' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      )
    }

    const article = await db.article.create({
      data: {
        title,
        excerpt,
        content: content || excerpt,
        category,
        date,
        author,
        imageUrl,
        authorId: session.userId,
      },
    })
    return NextResponse.json(
      { article, ok: true },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (e: any) {
    const errMsg = e?.message?.slice(0, 200) || 'unknown error'
    console.error('[articles POST] error:', errMsg)

    // Detect FK violation on author_id → user must run the SQL script
    const isFkViolation = e?.code === 'P2003' || /foreign key/i.test(errMsg)
    return NextResponse.json(
      {
        error: isFkViolation
          ? 'Gagal membuat artikel: constraint FK masih ada. Jalankan scripts/drop-all-user-fk-constraints.sql di Supabase SQL Editor.'
          : 'Gagal membuat artikel. Coba lagi atau hubungi admin.',
        detail: process.env.NODE_ENV === 'development' ? errMsg : undefined,
      },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
