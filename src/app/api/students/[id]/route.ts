import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// Cache-Control header — set to no-store so the profile detail page always
// shows fresh data. After a user updates their photo/bio via PUT, they
// navigate to the profile page and expect to see the change immediately.
// Without this header, the browser may use heuristic caching and show
// stale data for minutes.
const NO_STORE = { headers: { 'Cache-Control': 'no-store, max-age=0' } }

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  let student
  try {
    student = await db.student.findUnique({
      where: { id },
      include: {
        portfolios: {
          orderBy: [{ type: 'asc' }, { order: 'asc' }, { createdAt: 'desc' }],
        },
      },
    })
  } catch (e: any) {
    console.error('[api/students/[id]] query error:', e?.message?.slice(0, 100))
    return NextResponse.json(
      { error: 'Gagal memuat profil. Database belum siap.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
  if (!student) {
    return NextResponse.json(
      { error: 'Mahasiswa tidak ditemukan.' },
      { status: 404, headers: { 'Cache-Control': 'no-store' } }
    )
  }
  return NextResponse.json({ student }, NO_STORE)
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { error: 'Anda harus login.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    )
  }
  const { id } = await ctx.params

  // === Find the student (with try/catch — DB may be unreachable) ===
  let student
  try {
    student = await db.student.findUnique({ where: { id } })
  } catch (e: any) {
    console.error('[api/students/[id] PUT] findUnique error:', e?.message?.slice(0, 100))
    return NextResponse.json(
      { error: 'Gagal mengakses database. Coba lagi.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
  if (!student) {
    return NextResponse.json(
      { error: 'Mahasiswa tidak ditemukan.' },
      { status: 404, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  // === Authorization: owner of profile OR admin can edit ===
  const isOwner = student.ownerId === session.userId
  const isAdmin = session.role === 'admin'
  if (!isOwner && !isAdmin) {
    return NextResponse.json(
      { error: 'Tidak punya akses. Hanya pemilik profil atau admin yang dapat mengedit.' },
      { status: 403, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  // === Parse request body ===
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Body request tidak valid (harus JSON).' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  // === Update student record ===
  // NOTE on imageUrl handling:
  //   - body.imageUrl === undefined → field is NOT updated (frontend didn't send it)
  //   - body.imageUrl === '' (empty string) → field is CLEARED in DB (user removed photo)
  //   - body.imageUrl === 'https://...' → field is SET to URL (user uploaded new photo)
  //   The frontend MUST send the actual string value (not `value || undefined`)
  //   so empty strings reach us here. See SettingsView.tsx handleSave.
  try {
    const updated = await db.student.update({
      where: { id },
      data: {
        ...(body.name !== undefined && isAdmin ? { name: String(body.name) } : {}),
        ...(body.nickname !== undefined ? { nickname: body.nickname ? String(body.nickname) : null } : {}),
        ...(body.nim !== undefined && isAdmin ? { nim: String(body.nim) } : {}),
        ...(body.kelas !== undefined && isAdmin ? { kelas: String(body.kelas) } : {}),
        ...(body.tagline !== undefined ? { tagline: String(body.tagline) } : {}),
        ...(body.bio !== undefined ? { bio: String(body.bio) } : {}),
        ...(body.instagram !== undefined ? { instagram: String(body.instagram) } : {}),
        ...(body.asalDaerah !== undefined ? { asalDaerah: String(body.asalDaerah) } : {}),
        ...(body.imageUrl !== undefined ? { imageUrl: String(body.imageUrl) } : {}),
        ...(body.lagu !== undefined ? { lagu: body.lagu ? String(body.lagu) : null } : {}),
        ...(body.laguArtis !== undefined ? { laguArtis: body.laguArtis ? String(body.laguArtis) : null } : {}),
        ...(body.laguUrl !== undefined ? { laguUrl: body.laguUrl ? String(body.laguUrl) : null } : {}),
      },
      include: { portfolios: { orderBy: [{ type: 'asc' }, { order: 'asc' }] } },
    })
    return NextResponse.json(
      { student: updated, ok: true },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (e: any) {
    console.error('[api/students/[id] PUT] update error:', e?.message?.slice(0, 100))
    return NextResponse.json(
      { error: 'Gagal menyimpan perubahan. Coba lagi atau hubungi admin.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Anda harus login.' }, { status: 401 })
  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'Hanya admin yang dapat menghapus data mahasiswa.' }, { status: 403 })
  }
  const { id } = await ctx.params
  await db.student.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
