import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// Simple in-memory rate limit: per-name+IP, max 3 submissions per 10 minutes
type RateBucket = { count: number; firstAt: number }
const rateMap = new Map<string, RateBucket>()
const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 3

function rateLimitKey(name: string, ip: string): string {
  return `${name.toLowerCase()}|${ip}`
}

function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const bucket = rateMap.get(key)
  if (!bucket || now - bucket.firstAt > WINDOW_MS) {
    rateMap.set(key, { count: 1, firstAt: now })
    return true
  }
  if (bucket.count >= MAX_PER_WINDOW) return false
  bucket.count += 1
  return true
}

// GET /api/aspirasi?category=Akademik — list approved aspirations
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const limit = Math.min(Number(searchParams.get('limit') || 200), 500)

  const where: { approved: boolean; category?: string } = { approved: true }
  if (category && category !== 'all') where.category = category

  const items = await db.aspirasi.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      name: true,
      content: true,
      category: true,
      createdAt: true,
    },
  })

  // Stats per category
  const stats = await db.aspirasi.groupBy({
    by: ['category'],
    where: { approved: true },
    _count: { _all: true },
  })

  return NextResponse.json({
    items,
    stats: stats.map((s) => ({ category: s.category, count: s._count._all })),
    total: items.length,
  })
}

// POST /api/aspirasi — submit new aspiration (no auth, just name)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Body tidak valid.' }, { status: 400 })

  const name = String(body?.name ?? '').trim().slice(0, 60)
  const content = String(body?.content ?? '').trim().slice(0, 500)
  const category = String(body?.category ?? 'Umum').trim()

  if (!name) return NextResponse.json({ error: 'Nama wajib diisi.' }, { status: 400 })
  if (name.length < 2) return NextResponse.json({ error: 'Nama terlalu pendek.' }, { status: 400 })
  if (!content) return NextResponse.json({ error: 'Aspirasi wajib diisi.' }, { status: 400 })
  if (content.length < 3) return NextResponse.json({ error: 'Aspirasi terlalu pendek.' }, { status: 400 })

  const ALLOWED_CATEGORIES = ['Akademik', 'Fasilitas', 'Organisasi', 'Sosial', 'Umum']
  const finalCategory = ALLOWED_CATEGORIES.includes(category) ? category : 'Umum'

  // Rate limit by name + IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rlKey = rateLimitKey(name, ip)
  if (!checkRateLimit(rlKey)) {
    return NextResponse.json(
      { error: 'Terlalu banyak aspirasi dalam waktu singkat. Coba lagi nanti.' },
      { status: 429 }
    )
  }

  const item = await db.aspirasi.create({
    data: {
      name,
      content,
      category: finalCategory,
      approved: true,
    },
  })

  return NextResponse.json({ item }, { status: 201 })
}

// DELETE /api/aspirasi?isAdmin=true — admin only, hard delete by id
// We use POST /api/aspirasi/[id] with method override pattern OR check session here
export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Hanya admin.' }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID wajib diisi.' }, { status: 400 })

  await db.aspirasi.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
