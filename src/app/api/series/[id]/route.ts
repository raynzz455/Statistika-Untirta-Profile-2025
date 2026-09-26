import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// GET /api/series/[id] — get series with all articles in order
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const series = await db.series.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, username: true, displayName: true, role: true } },
      items: {
        orderBy: { order: 'asc' },
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
      },
    },
  })
  if (!series) return NextResponse.json({ error: 'Series tidak ditemukan.' }, { status: 404 })

  return NextResponse.json({
    series: {
      id: series.id,
      title: series.title,
      description: series.description,
      imageUrl: series.imageUrl,
      creator: series.creator,
      createdAt: series.createdAt,
      items: series.items.map((item) => ({
        id: item.id,
        order: item.order,
        article: item.article,
      })),
    },
  })
}

// PATCH /api/series/[id] — update series (creator or admin)
// Body: { title?, description?, imageUrl?, articleIds?: string[] (reorders/replaces items) }
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Anda harus login.' }, { status: 401 })
  const { id } = await ctx.params

  const series = await db.series.findUnique({ where: { id } })
  if (!series) return NextResponse.json({ error: 'Series tidak ditemukan.' }, { status: 404 })

  if (series.creatorId !== session.userId && session.role !== 'admin') {
    return NextResponse.json({ error: 'Tidak punya akses.' }, { status: 403 })
  }

  const body = await req.json()

  // Update basic fields
  const updateData: any = {}
  if (body.title !== undefined) updateData.title = String(body.title).trim()
  if (body.description !== undefined) updateData.description = body.description ? String(body.description).trim() : null
  if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl ? String(body.imageUrl).trim() : null

  if (Object.keys(updateData).length > 0) {
    await db.series.update({ where: { id }, data: updateData })
  }

  // Update article items if provided (replaces all items)
  if (Array.isArray(body.articleIds)) {
    await db.seriesItem.deleteMany({ where: { seriesId: id } })
    const articleIds = body.articleIds.filter(Boolean).slice(0, 50) // max 50 articles
    for (let i = 0; i < articleIds.length; i++) {
      try {
        await db.seriesItem.create({
          data: { seriesId: id, articleId: String(articleIds[i]), order: i },
        })
      } catch {
        // skip duplicates or invalid article IDs
      }
    }
  }

  return NextResponse.json({ ok: true })
}

// DELETE /api/series/[id] — delete series (creator or admin)
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Anda harus login.' }, { status: 401 })
  const { id } = await ctx.params

  const series = await db.series.findUnique({ where: { id } })
  if (!series) return NextResponse.json({ error: 'Series tidak ditemukan.' }, { status: 404 })

  if (series.creatorId !== session.userId && session.role !== 'admin') {
    return NextResponse.json({ error: 'Tidak punya akses.' }, { status: 403 })
  }

  await db.series.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
