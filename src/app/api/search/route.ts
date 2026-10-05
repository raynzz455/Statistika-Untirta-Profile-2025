import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { memoize } from '@/lib/cache'

// ============================================================================
// Search API — case-insensitive multi-table search
// ============================================================================
// CRITICAL: All `contains` queries MUST use `mode: 'insensitive'` to generate
// PostgreSQL ILIKE (case-insensitive). Without this, Prisma generates
// case-sensitive LIKE — which fails to match "Raynaldi" when user searches
// "rayn". This was the root cause of "kadang bisa search, seringnya tidak":
// searches worked when the user's query happened to match the DB's case
// (e.g. typing "Raynaldi" exactly), but failed on lowercase queries.
//
// Also wrapped in try/catch — DB unreachable returns empty results (200)
// instead of crashing with 500, so the frontend search box keeps working.
// ============================================================================

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
  // NOTE: we no longer lowercase q — `mode: 'insensitive'` makes the
  // Postgres query case-insensitive via ILIKE. Keeping the original case
  // also helps with the snippet extraction (which is already case-insensitive).
  const q = (url.searchParams.get('q') ?? '').trim()
  const limit = Math.min(Number(url.searchParams.get('limit') ?? '5'), 10)
  // Type filter: comma-separated list of types to include (default all)
  const typeFilter = (url.searchParams.get('types') ?? '').split(',').filter(Boolean)
  const shouldInclude = (type: string) => typeFilter.length === 0 || typeFilter.includes(type)

  // Return empty results for too-short queries
  if (!q || q.length < 2) {
    return NextResponse.json({ students: [], articles: [], events: [], gallery: [], users: [] })
  }

  // Search across all content types — wrapped in try/catch so DB errors
  // return empty results (200) instead of crashing the search box (500).
  const EMPTY = { students: [], articles: [], events: [], gallery: [], users: [] }

  let students: any[] = []
  let articles: any[] = []
  let events: any[] = []
  let gallery: any[] = []
  let users: any[] = []

  try {
    const result = await memoize(
      `search:${q.toLowerCase()}:${limit}`,
      async () => {
        const [s, a, e, g, u] = await Promise.all([
          // Students: search name, nim, tagline, bio, instagram, asalDaerah
          db.student.findMany({
            where: {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { nim: { contains: q, mode: 'insensitive' } },
                { tagline: { contains: q, mode: 'insensitive' } },
                { bio: { contains: q, mode: 'insensitive' } },
                { instagram: { contains: q, mode: 'insensitive' } },
                { asalDaerah: { contains: q, mode: 'insensitive' } },
                { nickname: { contains: q, mode: 'insensitive' } },
              ],
            },
            take: limit,
            orderBy: { nim: 'asc' },
          }),
          // Articles: search title, excerpt, content, author, category
          db.article.findMany({
            where: {
              published: true,
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { excerpt: { contains: q, mode: 'insensitive' } },
                { content: { contains: q, mode: 'insensitive' } },
                { author: { contains: q, mode: 'insensitive' } },
                { category: { contains: q, mode: 'insensitive' } },
              ],
            },
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
              tags: { include: { tag: true } },
            },
          }),
          // Events: search title, description, location, category
          db.event.findMany({
            where: {
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
                { location: { contains: q, mode: 'insensitive' } },
                { category: { contains: q, mode: 'insensitive' } },
              ],
            },
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          // Gallery: search caption, category
          db.gallery.findMany({
            where: {
              OR: [
                { caption: { contains: q, mode: 'insensitive' } },
                { category: { contains: q, mode: 'insensitive' } },
              ],
            },
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          // Users (for member profile navigation)
          db.user.findMany({
            where: {
              OR: [
                { username: { contains: q, mode: 'insensitive' } },
                { displayName: { contains: q, mode: 'insensitive' } },
              ],
            },
            take: limit,
            select: { id: true, username: true, displayName: true, role: true },
          }),
        ])

        // Also search tags — find articles with matching tag names
        const matchingTags = await db.tag.findMany({
          where: { name: { contains: q, mode: 'insensitive' } },
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
        const articleIds = new Set(a.map((art) => art.id))
        for (const tag of matchingTags) {
          for (const at of tag.articles) {
            if (at.article && at.article.published && !articleIds.has(at.article.id)) {
              articleIds.add(at.article.id)
              a.push({
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

        return { students: s, articles: a, events: e, gallery: g, users: u }
      },
      10000
    )

    students = result.students
    articles = result.articles
    events = result.events
    gallery = result.gallery
    users = result.users
  } catch (err: any) {
    console.error('[api/search] query error:', err?.message?.slice(0, 100))
    return NextResponse.json(EMPTY)
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
