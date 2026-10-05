import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/leaderboard — top contributors based on articles, likes received, comments, events
export async function GET() {
  try {
    // Fetch all users with their content counts
    const users = await db.user.findMany({
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        _count: {
          select: {
            articles: true,
            events: true,
            galleryItems: true,
            comments: true,
          },
        },
      },
    })

    // Fetch likes received (sum of likes on each user's articles)
    const likesReceived = await db.like.groupBy({
      by: ['articleId'],
      _count: { _all: true },
    })

    // Map articleId → like count
    const likeCounts = new Map(likesReceived.map((l) => [l.articleId, l._count._all]))

    // Get article→author mapping
    const articles = await db.article.findMany({
      where: { published: true },
      select: { id: true, authorId: true },
    })
    const articleAuthor = new Map(articles.map((a) => [a.id, a.authorId]))

    // Aggregate likes per author
    const likesPerAuthor = new Map<string, number>()
    for (const [articleId, count] of likeCounts) {
      const authorId = articleAuthor.get(articleId)
      if (authorId) {
        likesPerAuthor.set(authorId, (likesPerAuthor.get(authorId) || 0) + count)
      }
    }

    // Build leaderboard entries with composite score
    const leaderboard = users
      .map((u) => {
        const articles = u._count.articles
        const events = u._count.events
        const gallery = u._count.galleryItems
        const comments = u._count.comments
        const likes = likesPerAuthor.get(u.id) || 0
        // Score formula: articles*5 + likes*2 + events*3 + gallery*2 + comments*1
        const score = articles * 5 + likes * 2 + events * 3 + gallery * 2 + comments * 1
        return {
          id: u.id,
          username: u.username,
          displayName: u.displayName,
          role: u.role,
          stats: { articles, events, gallery, comments, likes },
          score,
        }
      })
      .filter((u) => u.score > 0) // Only show contributors with activity
      .sort((a, b) => b.score - a.score)
      .slice(0, 10) // Top 10

    return NextResponse.json({
      leaderboard,
      totalContributors: users.filter((u) => {
        const articles = u._count.articles
        const events = u._count.events
        const gallery = u._count.galleryItems
        const comments = u._count.comments
        return articles + events + gallery + comments > 0
      }).length,
    })
  } catch (e: any) {
    console.error('[api/leaderboard GET] query error:', e?.message?.slice(0, 100))
    return NextResponse.json({ leaderboard: [], totalContributors: 0, dbError: true })
  }
}
