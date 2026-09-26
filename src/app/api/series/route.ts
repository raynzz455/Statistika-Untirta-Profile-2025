import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// GET /api/series — list all series with article counts
export async function GET() {
  const series = await db.series.findMany({
    include: {
      _count: { select: { items: true } },
      creator: {
        select: { id: true, username: true, displayName: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({
    series: series.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      imageUrl: s.imageUrl,
      creator: s.creator,
      count: s._count.items,
      createdAt: s.createdAt,
    })),
  })
}

// POST /api/series — create a new series (login required)
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Anda harus login.' }, { status: 401 })

  const body = await req.json()
  const title = String(body?.title ?? '').trim()
  const description = body?.description ? String(body.description).trim() : null
  const imageUrl = body?.imageUrl ? String(body.imageUrl).trim() : null

  if (!title) return NextResponse.json({ error: 'Judul series wajib diisi.' }, { status: 400 })

  const series = await db.series.create({
    data: { title, description, imageUrl, creatorId: session.userId },
    include: {
      creator: { select: { id: true, username: true, displayName: true } },
    },
  })
  return NextResponse.json({ series })
}
