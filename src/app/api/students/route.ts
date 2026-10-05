import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// Cache-Control header — set to no-store so the directory always shows
// fresh data. We intentionally DO NOT cache /api/students because users
// frequently update their photos/bio via PUT /api/students/[id], and they
// expect to see the change immediately when they navigate to the directory.
// (Previously this used CachePresets.publicList which cached 60s + 300s SWR
// — that caused "profile tidak ter-update" bugs after save.)
const NO_STORE = { headers: { 'Cache-Control': 'no-store, max-age=0' } }

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const kelas = url.searchParams.get('kelas')
  const q = url.searchParams.get('q')

  let students: any[] = []
  try {
    students = await db.student.findMany({
      where: {
        ...(kelas && kelas !== 'all' ? { kelas } : {}),
        ...(q ? { name: { contains: q } } : {}),
      },
      orderBy: { nim: 'asc' },
    })
  } catch (e: any) {
    // Database not yet configured (e.g. fresh Supabase project, missing
    // DATABASE_URL, or schema not pushed). Return an empty list instead
    // of a 500 — the frontend gracefully renders "Belum ada mahasiswa"
    // instead of crashing.
    console.error('[api/students] query error:', e?.message?.slice(0, 100))
    return NextResponse.json({ students: [], dbError: true }, NO_STORE)
  }
  return NextResponse.json({ students }, NO_STORE)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Anda harus login.' }, { status: 401 })
  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'Hanya admin yang dapat menambah data mahasiswa.' }, { status: 403 })
  }

  const body = await req.json()
  const name = String(body?.name ?? '').trim()
  const nickname = body?.nickname ? String(body.nickname).trim() : null
  const nim = String(body?.nim ?? '').trim()
  const kelas = String(body?.kelas ?? 'A').trim()
  const tagline = body?.tagline ? String(body.tagline).trim() : null
  const bio = body?.bio ? String(body.bio).trim() : null
  const instagram = body?.instagram ? String(body.instagram).trim() : null
  const asalDaerah = body?.asalDaerah ? String(body.asalDaerah).trim() : null
  const imageUrl = body?.imageUrl ? String(body.imageUrl).trim() : null
  const lagu = body?.lagu ? String(body.lagu).trim() : null
  const laguArtis = body?.laguArtis ? String(body.laguArtis).trim() : null
  const laguUrl = body?.laguUrl ? String(body.laguUrl).trim() : null

  if (!name || !nim) {
    return NextResponse.json({ error: 'Nama dan NIM wajib diisi.' }, { status: 400 })
  }

  const dup = await db.student.findUnique({ where: { nim } })
  if (dup) {
    return NextResponse.json({ error: 'NIM sudah terdaftar.' }, { status: 409 })
  }

  const student = await db.student.create({
    data: { name, nickname, nim, kelas, tagline, bio, instagram, asalDaerah, imageUrl, ownerId: session.userId, lagu, laguArtis, laguUrl },
  })
  return NextResponse.json({ student })
}
