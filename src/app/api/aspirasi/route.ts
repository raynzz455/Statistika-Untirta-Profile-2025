import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// ============================================================================
// /api/aspirasi — list + submit + delete aspirations
// ============================================================================
// Fixes:
//   1. Removed withCache(CachePresets.publicDynamic) — was caching 15s + 60s
//      SWR, causing "tidak auto fetch data terbaru" after submit. New
//      submissions didn't appear until cache expired. Now uses
//      Cache-Control: no-store so the list always shows fresh data.
//   2. Wrapped GET + POST + DELETE in try/catch — DB errors return proper
//      JSON body (200 with empty array for GET, 500 with error message for
//      POST/DELETE) instead of crashing with empty 500 body that caused
//      "Failed to execute 'json' on 'Response': Unexpected end of JSON input".
// ============================================================================

const NO_STORE = { headers: { 'Cache-Control': 'no-store, max-age=0' } }

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

  try {
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
    }, NO_STORE)
  } catch (e: any) {
    console.error('[api/aspirasi GET] query error:', e?.message?.slice(0, 100))
    return NextResponse.json(
      { items: [], stats: [], total: 0, dbError: true },
      NO_STORE
    )
  }
}

// POST /api/aspirasi — submit new aspiration (no auth, just name)
export async function POST(req: NextRequest) {
  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Body tidak valid.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  const name = String(body?.name ?? '').trim().slice(0, 60)
  const content = String(body?.content ?? '').trim().slice(0, 500)
  const category = String(body?.category ?? 'Umum').trim()

  if (!name) return NextResponse.json({ error: 'Nama wajib diisi.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
  if (name.length < 2) return NextResponse.json({ error: 'Nama terlalu pendek.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
  if (!content) return NextResponse.json({ error: 'Aspirasi wajib diisi.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
  if (content.length < 3) return NextResponse.json({ error: 'Aspirasi terlalu pendek.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } })

  const ALLOWED_CATEGORIES = ['Akademik', 'Fasilitas', 'Organisasi', 'Sosial', 'Umum']
  const finalCategory = ALLOWED_CATEGORIES.includes(category) ? category : 'Umum'

  // Rate limit by name + IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rlKey = rateLimitKey(name, ip)
  if (!checkRateLimit(rlKey)) {
    return NextResponse.json(
      { error: 'Terlalu banyak aspirasi dalam waktu singkat. Coba lagi nanti.' },
      { status: 429, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  try {
    const item = await db.aspirasi.create({
      data: {
        name,
        content,
        category: finalCategory,
        approved: true,
      },
    })
    return NextResponse.json({ item }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
  } catch (e: any) {
    console.error('[api/aspirasi POST] create error:', e?.message?.slice(0, 100))
    return NextResponse.json(
      { error: 'Gagal menyimpan aspirasi. Coba lagi.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}

// DELETE /api/aspirasi?id=xxx — admin only, hard delete by id
export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json(
      { error: 'Hanya admin.' },
      { status: 403, headers: { 'Cache-Control': 'no-store' } }
    )
  }
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json(
      { error: 'ID wajib diisi.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  try {
    await db.aspirasi.delete({ where: { id } })
    return NextResponse.json({ ok: true }, NO_STORE)
  } catch (e: any) {
    console.error('[api/aspirasi DELETE] error:', e?.message?.slice(0, 100))
    return NextResponse.json(
      { error: 'Gagal menghapus aspirasi.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
