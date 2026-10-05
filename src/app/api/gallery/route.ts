import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// ============================================================================
// /api/gallery — list + create gallery items
// ============================================================================
// CRITICAL FIXES (commit on 2025-10):
//   1. Removed `withCache(CachePresets.publicStatic)` from GET — it caused
//      stale data after a user uploaded a new photo (300s + 600s SWR cache).
//      Now uses Cache-Control: no-store so the gallery always shows fresh items.
//   2. Wrapped POST in comprehensive try/catch — previously, if body parse
//      failed OR db.gallery.create threw (e.g. FK violation for Google OAuth
//      user UUID not in users table), the route returned 500 with EMPTY body
//      → frontend threw "Failed to execute 'json' on 'Response': Unexpected
//      end of JSON input". Now all errors return proper JSON.
//   3. Root cause of FK violation: solved by running
//      `scripts/drop-all-user-fk-constraints.sql` in Supabase SQL Editor
//      (drops gallery_uploader_id_fkey + all other FKs to users.id).
// ============================================================================

// Cache-Control header — no-store so the gallery always shows fresh items
// after a user uploads new photos.
const NO_STORE = { headers: { 'Cache-Control': 'no-store, max-age=0' } }

export async function GET() {
  try {
    const items = await db.gallery.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ items }, NO_STORE)
  } catch (e: any) {
    // DB unreachable (e.g. fresh Supabase project, missing DATABASE_URL, or
    // schema not pushed). Return empty list + dbError flag instead of 500
    // so the gallery page renders "Belum ada foto" gracefully.
    console.error('[api/gallery GET] query error:', e?.message?.slice(0, 100))
    return NextResponse.json({ items: [], dbError: true }, NO_STORE)
  }
}

export async function POST(req: NextRequest) {
  // === 1. Auth check ===
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { error: 'Anda harus login untuk mengunggah foto.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  // === 2. Parse request body (defensive — body may not be valid JSON) ===
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Body request tidak valid (harus JSON).' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  // === 3. Validate input ===
  const caption = String(body?.caption ?? '').trim()
  const category = String(body?.category ?? 'Umum').trim()
  const imageUrl = body?.imageUrl ? String(body.imageUrl).trim() : ''

  if (!caption || !imageUrl) {
    return NextResponse.json(
      { error: 'Caption dan URL gambar wajib diisi.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  // === 4. Create gallery item ===
  // NOTE: This may throw if:
  //   - FK constraint gallery_uploader_id_fkey still exists AND user is a
  //     Google OAuth user (session.userId is a Supabase UUID, not in users
  //     table). FIX: run scripts/drop-all-user-fk-constraints.sql in Supabase.
  //   - DB unreachable (DATABASE_URL not set, schema not pushed)
  //   - Connection pool exhausted
  // All errors return a proper JSON body so the frontend can parse them.
  try {
    const item = await db.gallery.create({
      data: {
        caption,
        category,
        imageUrl,
        uploaderId: session.userId,
      },
    })
    return NextResponse.json({ item, ok: true }, NO_STORE)
  } catch (e: any) {
    const errMsg = e?.message?.slice(0, 200) || 'unknown error'
    console.error('[api/gallery POST] create error:', errMsg)

    // Detect FK violation specifically and give a helpful hint
    const isFkViolation = e?.code === 'P2003' || /foreign key/i.test(errMsg)
    return NextResponse.json(
      {
        error: isFkViolation
          ? 'Gagal upload: constraint FK masih ada. Jalankan scripts/drop-all-user-fk-constraints.sql di Supabase SQL Editor.'
          : 'Gagal menyimpan foto. Coba lagi atau hubungi admin.',
        detail: process.env.NODE_ENV === 'development' ? errMsg : undefined,
      },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
