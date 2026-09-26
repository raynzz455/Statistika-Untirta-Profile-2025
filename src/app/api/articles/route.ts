import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

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

  const articles = await db.article.findMany({
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
  return NextResponse.json({
    articles: articles.map((a) => ({
      ...a,
      tags: a.tags.map((at) => ({ id: at.tag.id, name: at.tag.name, color: at.tag.color })),
    })),
  })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Anda harus login.' }, { status: 401 })
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
      return NextResponse.json({ error: 'Judul dan ringkasan wajib diisi.' }, { status: 400 })
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
    return NextResponse.json({ article })
  } catch (e) {
    console.error('[articles POST] error', e)
    return NextResponse.json({ error: 'Gagal membuat artikel.' }, { status: 500 })
  }
}
