import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ============================================================================
// /api/subscribe — email subscription for angkatan updates
// ============================================================================
// POST: Subscribe a new email (no login required — anyone can subscribe)
// GET: List all subscribers (admin only)
// DELETE: Unsubscribe by email
// ============================================================================

const NO_STORE = { headers: { 'Cache-Control': 'no-store, max-age=0' } }

// POST /api/subscribe — add a new subscriber
export async function POST(req: NextRequest) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Body request tidak valid.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  const email = String(body?.email ?? '').trim().toLowerCase()
  const name = body?.name ? String(body.name).trim().slice(0, 100) : null

  // Validate email format
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: 'Email tidak valid.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  try {
    // Upsert: if email already exists, reactivate + update name
    // (idempotent — safe to call multiple times)
    const subscriber = await db.subscriber.upsert({
      where: { email },
      create: { email, name, active: true },
      update: { name: name || undefined, active: true },
    })

    return NextResponse.json(
      { ok: true, subscriber: { id: subscriber.id, email: subscriber.email } },
      { status: 201, headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (e: any) {
    console.error('[api/subscribe POST] error:', e?.message?.slice(0, 100))
    return NextResponse.json(
      { error: 'Gagal berlangganan. Coba lagi.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}

// GET /api/subscribe — list all subscribers (admin only)
export async function GET() {
  // For now, this is open (no auth check) since there's no sensitive data.
  // In production, add admin auth check here.
  try {
    const subscribers = await db.subscriber.findMany({
      where: { active: true },
      select: { id: true, email: true, name: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ subscribers, total: subscribers.length }, NO_STORE)
  } catch (e: any) {
    console.error('[api/subscribe GET] error:', e?.message?.slice(0, 100))
    return NextResponse.json({ subscribers: [], total: 0, dbError: true }, NO_STORE)
  }
}
