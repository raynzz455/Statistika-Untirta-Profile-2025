// ============================================================================
// GET /api/students/class-history?semester=3 — Students grouped by class in semester
// ============================================================================
// Returns students with their class assignment for the specified semester,
// queried from the student_class_history table.
//
// Query params:
//   semester (required) — 1, 2, 3, 4, 5, 6
//   angkatan (optional) — filter by angkatan (default: all)
//
// Response:
//   { classA: Student[], classB: Student[], total: number, semester: number }
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withCache, CachePresets } from '@/lib/cache'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const semester = parseInt(searchParams.get('semester') || '1', 10)
  const angkatan = searchParams.get('angkatan')

  if (!semester || semester < 1 || semester > 8) {
    return NextResponse.json(
      { error: 'Semester harus antara 1-8.' },
      { status: 400 }
    )
  }

  // Query student_class_history joined with students
  const history = await db.studentClassHistory.findMany({
    where: {
      semester,
      ...(angkatan ? { angkatan } : {}),
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          nim: true,
          imageUrl: true,
          kelas: true,
          semester: true,
          angkatan: true,
          nickname: true,
        },
      },
    },
    orderBy: [{ kelas: 'asc' }, { student: { nim: 'asc' } }],
  })

  // Group by kelas
  const classA = history
    .filter((h) => h.kelas === 'A')
    .map((h) => ({
      id: h.student.id,
      name: h.student.name,
      nim: h.student.nim,
      kelas: h.kelas,
      imageUrl: h.student.imageUrl,
      angkatan: h.student.angkatan,
      semester: h.semester,
      nickname: h.student.nickname,
      academicYear: h.academicYear,
      isCurrent: h.isCurrent,
    }))

  const classB = history
    .filter((h) => h.kelas === 'B')
    .map((h) => ({
      id: h.student.id,
      name: h.student.name,
      nim: h.student.nim,
      kelas: h.kelas,
      imageUrl: h.student.imageUrl,
      angkatan: h.student.angkatan,
      semester: h.semester,
      nickname: h.student.nickname,
      academicYear: h.academicYear,
      isCurrent: h.isCurrent,
    }))

  return withCache(
    NextResponse.json({
      classA,
      classB,
      total: history.length,
      semester,
      academicYear: history[0]?.academicYear || null,
      isCurrent: history.some((h) => h.isCurrent),
    }),
    CachePresets.publicList
  )
}
