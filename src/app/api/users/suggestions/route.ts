import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// GET /api/users/suggestions — "Who to follow" based on:
// 1. Users whose articles the current user has liked/bookmarked/commented on
// 2. Users followed by people the current user follows (friends-of-friends)
// 3. Most active contributors (fallback)
export async function GET() {
  const session = await getSession()
  const limit = 5

  if (!session) {
    // For anonymous users, return most active contributors
    try {
      const topUsers = await db.user.findMany({
        where: { role: 'user' },
        take: limit,
        select: { id: true, username: true, displayName: true, role: true },
      })
      return NextResponse.json({ suggestions: topUsers.map(u => ({ id: u.id, username: u.username, displayName: u.displayName, role: u.role, reason: 'Kontributor aktif' })) })
    } catch (e: any) {
      console.error('[api/users/suggestions anon GET] query error:', e?.message?.slice(0, 100))
      return NextResponse.json({ suggestions: [], dbError: true })
    }
  }

  try {
    // Get IDs of users the current user already follows
    const following = await db.follow.findMany({
      where: { followerId: session.userId },
      select: { followingId: true },
    })
    const followingIds = new Set(following.map((f) => f.followingId))
    followingIds.add(session.userId) // exclude self

    // 1. Authors of articles the user has liked/bookmarked/commented on
    const [likedArticles, bookmarkedArticles, commentedArticles] = await Promise.all([
      db.like.findMany({ where: { userId: session.userId }, include: { article: { select: { authorId: true } } }, take: 20 }),
      db.bookmark.findMany({ where: { userId: session.userId }, include: { article: { select: { authorId: true } } }, take: 20 }),
      db.comment.findMany({ where: { userId: session.userId }, include: { article: { select: { authorId: true } } }, take: 20 }),
    ])

    const interactedAuthorIds = new Set<string>()
    for (const l of likedArticles) if (l.article?.authorId) interactedAuthorIds.add(l.article.authorId)
    for (const b of bookmarkedArticles) if (b.article?.authorId) interactedAuthorIds.add(b.article.authorId)
    for (const c of commentedArticles) if (c.article?.authorId) interactedAuthorIds.add(c.article.authorId)

    // Remove already-followed + self
    for (const id of followingIds) interactedAuthorIds.delete(id)

    let suggestions: { id: string; username: string; displayName: string | null; role: string; reason: string }[] = []

    // Add interacted authors first
    if (interactedAuthorIds.size > 0) {
      const authors = await db.user.findMany({
        where: { id: { in: Array.from(interactedAuthorIds) } },
        select: { id: true, username: true, displayName: true, role: true },
        take: limit,
      })
      suggestions.push(...authors.map((u) => ({ ...u, reason: 'Anda menyukai artikel mereka' })))
    }

    // 2. Friends-of-friends (users followed by people I follow)
    if (suggestions.length < limit && following.length > 0) {
      const friendOfFriendFollows = await db.follow.findMany({
        where: {
          followerId: { in: Array.from(followingIds).filter((id) => id !== session.userId) },
          followingId: { notIn: Array.from(followingIds) },
        },
        select: {
          following: { select: { id: true, username: true, displayName: true, role: true } },
        },
        take: 20,
        distinct: ['followingId'],
      })

      const fofIds = new Set(suggestions.map((s) => s.id))
      for (const f of friendOfFriendFollows) {
        if (suggestions.length >= limit) break
        if (!fofIds.has(f.following.id) && !followingIds.has(f.following.id)) {
          suggestions.push({ ...f.following, reason: 'Diikuti oleh teman Anda' })
          fofIds.add(f.following.id)
        }
      }
    }

    // 3. Fallback: most active contributors not yet followed
    if (suggestions.length < limit) {
      const existingIds = new Set(suggestions.map((s) => s.id))
      const excludeIds = [...Array.from(followingIds), ...Array.from(existingIds)]
      const topUsers = await db.user.findMany({
        where: {
          id: { notIn: excludeIds },
          role: 'user',
        },
        take: limit - suggestions.length,
        select: { id: true, username: true, displayName: true, role: true },
      })
      suggestions.push(...topUsers.map((u) => ({ id: u.id, username: u.username, displayName: u.displayName, role: u.role, reason: 'Kontributor aktif' })))
    }

    return NextResponse.json({ suggestions: suggestions.slice(0, limit) })
  } catch (e: any) {
    console.error('[api/users/suggestions GET] query error:', e?.message?.slice(0, 100))
    return NextResponse.json({ suggestions: [], dbError: true })
  }
}
