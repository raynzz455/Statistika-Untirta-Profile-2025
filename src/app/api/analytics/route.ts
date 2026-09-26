import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// GET /api/analytics — admin-only aggregate stats for dashboard charts
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Hanya admin.' }, { status: 403 })
  }

  // Articles per category
  const articlesByCategory = await db.article.groupBy({
    by: ['category'],
    _count: { _all: true },
  })

  // Likes per article (top 5)
  const likesByArticle = await db.like.groupBy({
    by: ['articleId'],
    _count: { _all: true },
    orderBy: { _count: { articleId: 'desc' } },
    take: 5,
  })
  const topArticleIds = likesByArticle.map((l) => l.articleId)
  const topArticles = await db.article.findMany({
    where: { id: { in: topArticleIds } },
    select: { id: true, title: true },
  })
  const topArticlesWithLikes = topArticleIds.map((id) => {
    const article = topArticles.find((a) => a.id === id)
    const likeEntry = likesByArticle.find((l) => l.articleId === id)
    return {
      id,
      title: article?.title || 'Deleted article',
      likes: likeEntry?._count._all || 0,
    }
  }).sort((a, b) => b.likes - a.likes)

  // Comments per article (top 5)
  const commentsByArticle = await db.comment.groupBy({
    by: ['articleId'],
    _count: { _all: true },
    orderBy: { _count: { articleId: 'desc' } },
    take: 5,
  })
  const topCommentArticleIds = commentsByArticle.map((l) => l.articleId)
  const topCommentArticles = await db.article.findMany({
    where: { id: { in: topCommentArticleIds } },
    select: { id: true, title: true },
  })
  const topCommentArticlesWithCounts = topCommentArticleIds.map((id) => {
    const article = topCommentArticles.find((a) => a.id === id)
    const entry = commentsByArticle.find((l) => l.articleId === id)
    return {
      id,
      title: article?.title || 'Deleted article',
      comments: entry?._count._all || 0,
    }
  }).sort((a, b) => b.comments - a.comments)

  // RSVPs per event
  const rsvpsByEvent = await db.rsvp.groupBy({
    by: ['eventId'],
    _count: { _all: true },
  })
  const rsvpEventIds = rsvpsByEvent.map((r) => r.eventId)
  const rsvpEvents = await db.event.findMany({
    where: { id: { in: rsvpEventIds } },
    select: { id: true, title: true },
  })
  const eventsWithRsvps = rsvpsByEvent.map((r) => {
    const event = rsvpEvents.find((e) => e.id === r.eventId)
    return {
      id: r.eventId,
      title: event?.title || 'Deleted event',
      rsvps: r._count._all,
    }
  }).sort((a, b) => b.rsvps - a.rsvps)

  // RSVP breakdown by status
  const rsvpsByStatus = await db.rsvp.groupBy({
    by: ['status'],
    _count: { _all: true },
  })

  // Content over time (last 7 days) — group by day
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const [recentArticles, recentEvents, recentComments, recentLikes, recentGallery] = await Promise.all([
    db.article.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    }),
    db.event.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    }),
    db.comment.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    }),
    db.like.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    }),
    db.gallery.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    }),
  ])

  // Group by day of week
  const days: { label: string; articles: number; events: number; comments: number; likes: number; gallery: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const dayLabel = d.toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit' })
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
    days.push({
      label: dayLabel,
      articles: recentArticles.filter((a) => a.createdAt >= dayStart && a.createdAt < dayEnd).length,
      events: recentEvents.filter((e) => e.createdAt >= dayStart && e.createdAt < dayEnd).length,
      comments: recentComments.filter((c) => c.createdAt >= dayStart && c.createdAt < dayEnd).length,
      likes: recentLikes.filter((l) => l.createdAt >= dayStart && l.createdAt < dayEnd).length,
      gallery: recentGallery.filter((g) => g.createdAt >= dayStart && g.createdAt < dayEnd).length,
    })
  }

  // Totals
  const [totalArticles, totalEvents, totalComments, totalLikes, totalGallery, totalUsers, totalStudents, totalBookmarks] = await Promise.all([
    db.article.count(),
    db.event.count(),
    db.comment.count(),
    db.like.count(),
    db.gallery.count(),
    db.user.count(),
    db.student.count(),
    db.bookmark.count(),
  ])

  return NextResponse.json({
    articlesByCategory: articlesByCategory.map((c) => ({ category: c.category, count: c._count._all })),
    topArticlesByLikes: topArticlesWithLikes,
    topArticlesByComments: topCommentArticlesWithCounts,
    eventsByRsvp: eventsWithRsvps,
    rsvpBreakdown: rsvpsByStatus.map((s) => ({ status: s.status, count: s._count._all })),
    contentOverTime: days,
    totals: {
      articles: totalArticles,
      events: totalEvents,
      comments: totalComments,
      likes: totalLikes,
      gallery: totalGallery,
      users: totalUsers,
      students: totalStudents,
      bookmarks: totalBookmarks,
    },
  })
}
