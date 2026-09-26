import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// POST /api/articles/[id]/tags — assign tags to article (replaces existing)
// Body: { tags: ["name1", "name2", ...] } — tags are created if they don't exist
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Anda harus login.' }, { status: 401 })
  const { id } = await ctx.params

  const article = await db.article.findUnique({ where: { id } })
  if (!article) return NextResponse.json({ error: 'Artikel tidak ditemukan.' }, { status: 404 })

  // Only author or admin can edit tags
  if (article.authorId !== session.userId && session.role !== 'admin') {
    return NextResponse.json({ error: 'Tidak punya akses.' }, { status: 403 })
  }

  const body = await req.json()
  const tagNames: string[] = (Array.isArray(body?.tags) ? body.tags : [])
    .map((t: any) => String(t).trim().toLowerCase())
    .filter(Boolean)

  // Remove existing tag assignments
  await db.articleTag.deleteMany({ where: { articleId: id } })

  // Create tags if they don't exist, then connect
  if (tagNames.length > 0) {
    // Use upsert pattern: find or create each tag
    const tagRecords = []
    for (const name of tagNames.slice(0, 10)) { // max 10 tags per article
      const tag = await db.tag.upsert({
        where: { name },
        update: {},
        create: { name },
      })
      tagRecords.push(tag)
    }

    // Connect tags to article
    for (const tag of tagRecords) {
      try {
        await db.articleTag.create({
          data: { articleId: id, tagId: tag.id },
        })
      } catch {
        // skip duplicates
      }
    }
  }

  // Return updated article with tags
  const updated = await db.article.findUnique({
    where: { id },
    include: { tags: { include: { tag: true } } },
  })
  return NextResponse.json({
    tags: (updated?.tags || []).map((at) => ({ id: at.tag.id, name: at.tag.name, color: at.tag.color })),
  })
}
