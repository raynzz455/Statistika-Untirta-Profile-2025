import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/users/[id]/profile — public profile + activity timeline
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params

  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      createdAt: true,
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 })
  }

  // Fetch all public activity in parallel
  const [articles, events, galleryItems, comments] = await Promise.all([
    db.article.findMany({
      where: { authorId: id, published: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, title: true, excerpt: true, date: true, category: true, imageUrl: true, createdAt: true },
    }),
    db.event.findMany({
      where: { organizerId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, title: true, startDate: true, location: true, category: true, imageUrl: true, createdAt: true },
    }),
    db.gallery.findMany({
      where: { uploaderId: id },
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: { id: true, caption: true, category: true, imageUrl: true, createdAt: true },
    }),
    db.comment.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        content: true,
        createdAt: true,
        article: {
          select: { id: true, title: true },
        },
      },
    }),
  ])

  // Likes received (sum of likes on user's articles)
  const userArticleIds = articles.map((a) => a.id)
  const likesReceived = await db.like.count({
    where: { articleId: { in: userArticleIds } },
  })

  // Total counts + follow counts
  const [totalArticles, totalEvents, totalGallery, totalComments, followersCount, followingCount] = await Promise.all([
    db.article.count({ where: { authorId: id, published: true } }),
    db.event.count({ where: { organizerId: id } }),
    db.gallery.count({ where: { uploaderId: id } }),
    db.comment.count({ where: { userId: id } }),
    db.follow.count({ where: { followingId: id } }),
    db.follow.count({ where: { followerId: id } }),
  ])

  // Linked student profile (if any)
  const student = await db.student.findFirst({
    where: { ownerId: id },
    select: { id: true, name: true, nim: true, kelas: true, tagline: true, bio: true, instagram: true, asalDaerah: true, imageUrl: true },
  })

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      memberSince: user.createdAt,
    },
    student,
    stats: {
      articles: totalArticles,
      events: totalEvents,
      gallery: totalGallery,
      comments: totalComments,
      likesReceived,
      followers: followersCount,
      following: followingCount,
    },
    recentActivity: {
      articles: articles.map((a) => ({ ...a, type: 'article' as const })),
      events: events.map((e) => ({ ...e, type: 'event' as const })),
      gallery: galleryItems.map((g) => ({ ...g, type: 'gallery' as const })),
      comments: comments.map((c) => ({ ...c, type: 'comment' as const })),
    },
  })
}
