import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper: extract a snippet around the first match of `q` in `text`
function extractSnippet(text: string, q: string, length = 80): string | undefined {
  if (!text) return undefined
  const lower = text.toLowerCase()
  const idx = lower.indexOf(q.toLowerCase())
  if (idx === -1) return undefined
  const start = Math.max(0, idx - Math.floor((length - q.length) / 2))
  const end = Math.min(text.length, start + length)
  const prefix = start > 0 ? '…' : ''
  const suffix = end < text.length ? '…' : ''
  return prefix + text.slice(start, end) + suffix
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const q = (url.searchParams.get('q') ?? '').trim().toLowerCase()
  const limit = Math.min(Number(url.searchParams.get('limit') ?? '5'), 10)
  // Type filter: comma-separated list of types to include (default all)
  const typeFilter = (url.searchParams.get('types') ?? '').split(',').filter(Boolean)
  const shouldInclude = (type: string) => typeFilter.length === 0 || typeFilter.includes(type)

  if (!q || q.length < 2) {
    return NextResponse.json({ students: [], articles: [], events: [], gallery: [], users: [] })
  }

  // Search across all content types in parallel
  const [students, articles, events, gallery, users] = await Promise.all([
    db.student.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { nim: { contains: q } },
          { tagline: { contains: q } },
          { bio: { contains: q } },
          { instagram: { contains: q } },
          { asalDaerah: { contains: q } },
        ],
      },
      take: limit,
      orderBy: { nim: 'asc' },
    }),
    db.article.findMany({
      where: {
        published: true,
        OR: [
          { title: { contains: q } },
          { excerpt: { contains: q } },
          { content: { contains: q } },
          { author: { contains: q } },
          { category: { contains: q } },
        ],
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        tags: { include: { tag: true } },
      },
    }),
    db.event.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { description: { contains: q } },
          { location: { contains: q } },
          { category: { contains: q } },
        ],
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    db.gallery.findMany({
      where: {
        OR: [
          { caption: { contains: q } },
          { category: { contains: q } },
        ],
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    // Also search users (for member profile navigation)
    db.user.findMany({
      where: {
        OR: [
          { username: { contains: q } },
          { displayName: { contains: q } },
        ],
      },
      take: limit,
      select: { id: true, username: true, displayName: true, role: true },
    }),
  ])

  // Also search tags — find articles with matching tag names
  const matchingTags = await db.tag.findMany({
    where: { name: { contains: q } },
    include: {
      articles: {
        include: {
          article: {
            select: { id: true, title: true, excerpt: true, content: true, category: true, date: true, author: true, published: true },
          },
        },
      },
    },
    take: 5,
  })

  // Add tag-matched articles to the articles list (dedup by id, only published)
  const articleIds = new Set(articles.map((a) => a.id))
  for (const tag of matchingTags) {
    for (const at of tag.articles) {
      if (at.article && at.article.published && !articleIds.has(at.article.id)) {
        articleIds.add(at.article.id)
        articles.push({
          ...at.article,
          imageUrl: null,
          authorId: '',
          authorUser: undefined as any,
          comments: [],
          likes: [],
          bookmarks: [],
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          excerpt: `[Tag: ${tag.name}] ${at.article.excerpt}`,
        } as any)
      }
    }
  }

  return NextResponse.json({
    students: shouldInclude('student') ? students.map((s) => ({
      id: s.id,
      type: 'student' as const,
      title: s.name,
      subtitle: `NIM. ${s.nim} • Kelas ${s.kelas}`,
      tag: extractSnippet(s.bio || s.tagline || '', q) || s.tagline?.slice(0, 60),
      view: 'profile' as const,
    })) : [],
    articles: shouldInclude('article') ? articles.map((a) => ({
      id: a.id,
      type: 'article' as const,
      title: a.title,
      subtitle: `${a.category} • ${a.date} • ${a.author}`,
      tag: extractSnippet(a.content || a.excerpt, q) || a.excerpt.slice(0, 80),
      view: 'article-detail' as const,
    })) : [],
    events: shouldInclude('event') ? events.map((e) => ({
      id: e.id,
      type: 'event' as const,
      title: e.title,
      subtitle: `${e.startDate}${e.location ? ' • ' + e.location : ''}`,
      tag: extractSnippet(e.description || '', q) || e.description?.slice(0, 80),
      view: 'events' as const,
    })) : [],
    gallery: shouldInclude('gallery') ? gallery.map((g) => ({
      id: g.id,
      type: 'gallery' as const,
      title: g.caption,
      subtitle: `Galeri • ${g.category}`,
      tag: undefined,
      view: 'gallery' as const,
    })) : [],
    users: shouldInclude('member') ? users.map((u) => ({
      id: u.id,
      type: 'member' as const,
      title: u.displayName || u.username,
      subtitle: `Member • @${u.username}${u.role === 'admin' ? ' • Admin' : ''}`,
      tag: undefined,
      view: 'member-profile' as const,
    })) : [],
  })
}
