// ============================================================================
// GET /api/students/unlinked — List students without ownerId (admin only)
// ============================================================================
// Returns students who have NOT yet been claimed via NIM or linked by admin.
// Useful for admin to see which students haven't signed up yet.
//
// Query params:
//   ?kelas=A     — filter by class (A or B)
//   ?angkatan=2025 — filter by year
//
// Response: { students: [{ id, name, nim, kelas, angkatan, email }], total: number }
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-server'

export async function GET(req: NextRequest) {
  // === Admin check ===
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Anda harus login.' }, { status: 401 })
  }
  if (user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Hanya admin yang dapat melihat daftar mahasiswa belum ter-link.' },
      { status: 403 }
    )
  }

  // === Parse query params ===
  const { searchParams } = new URL(req.url)
  const kelas = searchParams.get('kelas')
  const angkatan = searchParams.get('angkatan')

  // === Build where clause ===
  const where: {
    ownerId: null
    kelas?: string
    angkatan?: string
  } = { ownerId: null }
  if (kelas) where.kelas = kelas
  if (angkatan) where.angkatan = angkatan

  try {
    // === Query unlinked students ===
    const students = await db.student.findMany({
      where,
      select: {
        id: true,
        name: true,
        nim: true,
        kelas: true,
        angkatan: true,
        email: true,
        createdAt: true,
      },
      orderBy: [{ kelas: 'asc' }, { nim: 'asc' }],
    })

    return NextResponse.json({
      students,
      total: students.length,
      filter: { kelas: kelas || 'all', angkatan: angkatan || 'all' },
    })
  } catch (e: any) {
    console.error('[api/students/unlinked GET] query error:', e?.message?.slice(0, 100))
    return NextResponse.json({
      students: [],
      total: 0,
      filter: { kelas: kelas || 'all', angkatan: angkatan || 'all' },
      dbError: true,
    })
  }
}
