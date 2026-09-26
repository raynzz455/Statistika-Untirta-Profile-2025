import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// GET /api/recommendations — recommend articles based on user's activity
// Algorithm:
// 1. Get articles the user has liked, bookmarked, or commented on
// 2. Find tags + categories of those articles
// 3. Recommend other published articles with matching tags/categories
//    that the user hasn't interacted with yet
// 4. If no user history, return most-liked + newest articles
export async function GET() {
  const session = await getSession()
  const limit = 6

  // Anonymous user — return most popular + newest articles
  if (!session) {
    const [popular, recent] = await Promise.all([
      db.article.findMany({
        where: { published: true },
        include: { _count: { select: { likes: true } } },
        orderBy: { likes: { _count: 'desc' } },
        take: 3,
      }),
      db.article.findMany({
        where: { published: true },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
    ])

    // Merge + dedupe
    const seen = new Set<string>()
    const recommended = [...popular, ...recent].filter((a) => {
      if (seen.has(a.id)) return false
      seen.add(a.id)
      return true
    }).slice(0, limit)

    return NextResponse.json({
      recommendations: recommended.map((a) => ({
        ...a,
        reason: 'Populer & Terbaru',
        score: 0,
      })),
      basedOnHistory: false,
    })
  }

  // Logged-in user — find their interaction history
  const [likedArticles, bookmarkedArticles, commentedArticles] = await Promise.all([
    db.like.findMany({
      where: { userId: session.userId },
      select: { articleId: true },
    }),
    db.bookmark.findMany({
      where: { userId: session.userId },
      select: { articleId: true },
    }),
    db.comment.findMany({
      where: { userId: session.userId },
      select: { articleId: true },
    }),
  ])

  const interactedArticleIds = new Set([
    ...likedArticles.map((l) => l.articleId),
    ...bookmarkedArticles.map((b) => b.articleId),
    ...commentedArticles.map((c) => c.articleId),
  ])

  // If no history, return popular + newest
  if (interactedArticleIds.size === 0) {
    const [popular, recent] = await Promise.all([
      db.article.findMany({
        where: { published: true },
        include: { _count: { select: { likes: true } } },
        orderBy: { likes: { _count: 'desc' } },
        take: 3,
      }),
      db.article.findMany({
        where: { published: true },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
    ])

    const seen = new Set<string>()
    const recommended = [...popular, ...recent].filter((a) => {
      if (seen.has(a.id)) return false
      seen.add(a.id)
      return true
    }).slice(0, limit)

    return NextResponse.json({
      recommendations: recommended.map((a) => ({
        ...a,
        reason: 'Mulai berinteraksi untuk rekomendasi personal',
        score: 0,
      })),
      basedOnHistory: false,
    })
  }

  // Get tags + categories from interacted articles
  const interactedArticles = await db.article.findMany({
    where: { id: { in: Array.from(interactedArticleIds) } },
    select: { id: true, category: true, tags: { include: { tag: true } } },
  })

  const tagIds = new Set<string>()
  const categories = new Set<string>()
  for (const a of interactedArticles) {
    categories.add(a.category)
    for (const at of a.tags) {
      tagIds.add(at.tagId)
    }
  }

  // Also get tags + categories from articles by users this user follows
  const following = await db.follow.findMany({
    where: { followerId: session.userId },
    select: { followingId: true },
  })
  const followingIds = following.map((f) => f.followingId)

  let followedArticles: { id: string; category: string; tags: { tagId: string }[] }[] = []
  if (followingIds.length > 0) {
    followedArticles = await db.article.findMany({
      where: { authorId: { in: followingIds }, published: true },
      select: { id: true, category: true, tags: { select: { tagId: true } } },
      take: 20,
    })
    for (const a of followedArticles) {
      categories.add(a.category)
      for (const at of a.tags) {
        tagIds.add(at.tagId)
      }
    }
  }

  // Find candidate articles: published, not interacted, matching tags or categories
  const candidates = await db.article.findMany({
    where: {
      published: true,
      id: { notIn: Array.from(interactedArticleIds) },
      OR: [
        { tags: { some: { tagId: { in: Array.from(tagIds) } } } },
        { category: { in: Array.from(categories) } },
      ],
    },
    include: {
      tags: { include: { tag: true } },
      _count: { select: { likes: true } },
    },
    take: 50, // get a pool of candidates, then score them
  })

  // Score each candidate
  type ScoredArticle = typeof candidates[0] & { _score: number; _reason: string }
  const scored: ScoredArticle[] = candidates.map((a) => {
    let score = 0
    let reasons: string[] = []

    // +3 per matching tag
    const matchingTags = a.tags.filter((t) => tagIds.has(t.tagId))
    if (matchingTags.length > 0) {
      score += matchingTags.length * 3
      reasons.push(`${matchingTags.length} tag cocok`)
    }

    // +2 for matching category
    if (categories.has(a.category)) {
      score += 2
      reasons.push(`kategori ${a.category}`)
    }

    // +1 per like (popularity boost)
    score += a._count.likes

    // +5 if authored by a followed user
    if (followingIds.length > 0) {
      // We need to check authorId — it's not in the select above
      // Workaround: we'll add it below
    }

    return { ...a, _score: score, _reason: reasons.join(' + ') || 'Rekomendasi' } as ScoredArticle
  })

  // Boost articles by followed authors — need to fetch authorId
  if (followingIds.length > 0) {
    const followedArticleIds = new Set(followedArticles.map((a) => a.id))
    for (const a of scored) {
      if (followedArticleIds.has(a.id)) {
        a._score += 5
        a._reason = (a._reason ? a._reason + ' + ' : '') + 'dari member yang Anda ikuti'
      }
    }
  }

  // Sort by score desc, then by createdAt desc as tiebreaker
  scored.sort((a, b) => b._score - a._score)

  const recommendations = scored.slice(0, limit).map((a) => ({
    id: a.id,
    title: a.title,
    excerpt: a.excerpt,
    date: a.date,
    author: a.author,
    category: a.category,
    imageUrl: a.imageUrl,
    tags: a.tags.map((at) => ({ id: at.tag.id, name: at.tag.name, color: at.tag.color })),
    score: a._score,
    reason: a._reason,
  }))

  return NextResponse.json({
    recommendations,
    basedOnHistory: true,
    historySize: interactedArticleIds.size,
    followedCount: followingIds.length,
  })
}
