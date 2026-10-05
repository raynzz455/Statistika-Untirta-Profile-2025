import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ============================================================================
// /api/activity — recent activity feed across all members
// ============================================================================
// Fixes:
//   1. Wrapped in try/catch — DB errors return { activity: [], dbError: true }
//      instead of crashing with 500 empty body (which caused the frontend
//      ActivityFeed to throw "e.map is not a function" when the response
//      shape was unexpected).
//   2. Cache-Control: no-store — activity feed must show fresh data.
//   3. Handle null user on comments/likes — for Google OAuth users, the
//      Prisma `include: { user: ... }` relation returns null because the
//      user isn't in the Prisma `users` table. Previously, the code did
//      `c.user.id` which throws "Cannot read property 'id' of null".
//      Now we use optional chaining `c.user?.id` and filter out entries
//      with null users.
// ============================================================================

const NO_STORE = { headers: { 'Cache-Control': 'no-store, max-age=0' } }

export async function GET() {
  const limit = 20

  try {
    // Fetch recent items from each content type in parallel
    const [articles, events, gallery, comments, likes] = await Promise.all([
      db.article.findMany({
        where: { published: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          title: true,
          excerpt: true,
          category: true,
          date: true,
          imageUrl: true,
          author: true,
          createdAt: true,
          authorId: true,
        },
      }),
      db.event.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          title: true,
          startDate: true,
          location: true,
          category: true,
          imageUrl: true,
          createdAt: true,
        },
      }),
      db.gallery.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          caption: true,
          category: true,
          imageUrl: true,
          createdAt: true,
        },
      }),
      db.comment.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          content: true,
          createdAt: true,
          article: { select: { id: true, title: true } },
          user: { select: { id: true, username: true, displayName: true } },
        },
      }),
      db.like.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          createdAt: true,
          article: { select: { id: true, title: true } },
          user: { select: { id: true, username: true, displayName: true } },
        },
      }),
    ])

    // Fetch user info for event organizers + gallery uploaders
    const eventUploaderIds = await db.event.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { id: true, organizerId: true },
    })
    const galleryUploaderIds = await db.gallery.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { id: true, uploaderId: true },
    })

    // Build user IDs set — use optional chaining for comments/likes users
    // (they may be null for Google OAuth users not in users table)
    const userIds = new Set<string>([
      ...eventUploaderIds.map((e) => e.organizerId),
      ...galleryUploaderIds.map((g) => g.uploaderId),
      ...comments.map((c) => c.user?.id).filter(Boolean) as string[],
      ...likes.map((l) => l.user?.id).filter(Boolean) as string[],
    ])

    const users = await db.user.findMany({
      where: { id: { in: Array.from(userIds) } },
      select: { id: true, username: true, displayName: true, role: true },
    })
    const userMap = new Map(users.map((u) => [u.id, u]))

    // Map event/gallery IDs to user IDs
    const eventUserMap = new Map(eventUploaderIds.map((e) => [e.id, e.organizerId]))
    const galleryUserMap = new Map(galleryUploaderIds.map((g) => [g.id, g.uploaderId]))

    // Build unified timeline
    type ActivityItem = {
      id: string
      type: 'article' | 'event' | 'gallery' | 'comment' | 'like'
      timestamp: Date
      user: { id: string; username: string; displayName: string | null; role: string } | null
      title: string
      subtitle?: string
      excerpt?: string
      imageUrl?: string | null
      category?: string
      targetId?: string
      targetTitle?: string
    }

    const timeline: ActivityItem[] = []

    for (const a of articles) {
      timeline.push({
        id: `article-${a.id}`,
        type: 'article',
        timestamp: a.createdAt,
        user: null,
        title: a.title,
        excerpt: a.excerpt,
        imageUrl: a.imageUrl,
        category: a.category,
        targetId: a.id,
      })
    }

    for (const e of events) {
      const userId = eventUserMap.get(e.id)
      const user = userId ? userMap.get(userId) : null
      timeline.push({
        id: `event-${e.id}`,
        type: 'event',
        timestamp: e.createdAt,
        user: user ? { id: user.id, username: user.username, displayName: user.displayName, role: user.role } : null,
        title: e.title,
        subtitle: `${e.startDate}${e.location ? ' • ' + e.location : ''}`,
        imageUrl: e.imageUrl,
        category: e.category,
        targetId: e.id,
      })
    }

    for (const g of gallery) {
      const userId = galleryUserMap.get(g.id)
      const user = userId ? userMap.get(userId) : null
      timeline.push({
        id: `gallery-${g.id}`,
        type: 'gallery',
        timestamp: g.createdAt,
        user: user ? { id: user.id, username: user.username, displayName: user.displayName, role: user.role } : null,
        title: g.caption,
        imageUrl: g.imageUrl,
        category: g.category,
        targetId: g.id,
      })
    }

    // Comments — use optional chaining, skip entries with null user
    for (const c of comments) {
      if (!c.user) continue // skip if user is null (Google OAuth user not in users table)
      timeline.push({
        id: `comment-${c.id}`,
        type: 'comment',
        timestamp: c.createdAt,
        user: { id: c.user.id, username: c.user.username, displayName: c.user.displayName, role: c.user.role },
        title: c.content.slice(0, 100),
        targetId: c.article?.id,
        targetTitle: c.article?.title,
      })
    }

    // Likes — same null user handling
    for (const l of likes) {
      if (!l.user) continue
      timeline.push({
        id: `like-${l.id}`,
        type: 'like',
        timestamp: l.createdAt,
        user: { id: l.user.id, username: l.user.username, displayName: l.user.displayName, role: l.user.role },
        title: 'menyukai artikel',
        targetId: l.article?.id,
        targetTitle: l.article?.title,
      })
    }

    // Sort by timestamp desc, take top N
    timeline.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    const top = timeline.slice(0, limit)

    return NextResponse.json({
      activity: top.map((item) => ({
        ...item,
        timestamp: item.timestamp.toISOString(),
        timeAgo: getTimeAgo(item.timestamp),
      })),
    }, NO_STORE)
  } catch (e: any) {
    console.error('[api/activity GET] error:', e?.message?.slice(0, 100))
    return NextResponse.json(
      { activity: [], dbError: true },
      NO_STORE
    )
  }
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'baru saja'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} menit lalu`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} hari lalu`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `${weeks} minggu lalu`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} bulan lalu`
  return `${Math.floor(months / 12)} tahun lalu`
}
