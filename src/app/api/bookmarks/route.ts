import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// GET /api/bookmarks — list current user's bookmarked articles
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ articles: [] })

  try {
    const bookmarks = await db.bookmark.findMany({
      where: { userId: session.userId },
      include: {
        article: {
          select: {
            id: true,
            title: true,
            excerpt: true,
            date: true,
            author: true,
            category: true,
            imageUrl: true,
            published: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const articles = bookmarks
      .map((b) => b.article)
      .filter((a) => a !== null)

    return NextResponse.json({ articles })
  } catch (e: any) {
    console.error('[api/bookmarks GET] query error:', e?.message?.slice(0, 100))
    return NextResponse.json({ articles: [], dbError: true })
  }
}
