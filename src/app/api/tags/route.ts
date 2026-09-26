import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/tags — list all tags with article counts
export async function GET() {
  const tags = await db.tag.findMany({
    include: {
      _count: {
        select: { articles: true },
      },
    },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json({
    tags: tags.map((t) => ({
      id: t.id,
      name: t.name,
      color: t.color,
      count: t._count.articles,
    })),
  })
}

// POST /api/tags — create a new tag (login required)
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Anda harus login.' }, { status: 401 })

  const body = await req.json()
  const name = String(body?.name ?? '').trim().toLowerCase()
  const color = body?.color ? String(body.color).trim() : '#e892b8'

  if (!name) return NextResponse.json({ error: 'Nama tag wajib diisi.' }, { status: 400 })

  const existing = await db.tag.findUnique({ where: { name } })
  if (existing) return NextResponse.json({ tag: existing })

  const tag = await db.tag.create({ data: { name, color } })
  return NextResponse.json({ tag })
}

import { NextRequest } from 'next/server'
import { getSession } from '@/lib/session'
