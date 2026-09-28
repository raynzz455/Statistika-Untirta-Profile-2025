// ============================================================================
// POST /api/students/claim — NIM-based student profile claim
// ============================================================================
// Allows an authenticated user (via Google OAuth or custom session) to
// "claim" their pre-listed student profile by entering their NIM.
//
// Flow:
//   1. Admin seeds student list with NIMs (students table, ownerId=NULL)
//   2. User signs up via Google OAuth → auth.users + profiles created
//   3. User enters their NIM → this endpoint links the student record
//   4. students.ownerId = auth.users.id, students.claimedAt = now()
//   5. User can now edit their student profile (photo, bio, portfolio, etc.)
//
// Security:
//   - Requires authentication (any logged-in user can claim)
//   - NIM must match a student in the database
//   - Student must NOT be already claimed (ownerId must be NULL)
//   - If already claimed by same user → return success (idempotent)
//   - If already claimed by different user → return error
//
// Body: { nim: string }
// Response: { ok: true, student: {...} } or { error: string }
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-server'

export async function POST(req: NextRequest) {
  // === Auth check ===
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json(
      { error: 'Anda harus login untuk mengklaim profil mahasiswa.' },
      { status: 401 }
    )
  }

  // === Parse body ===
  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Body tidak valid.' }, { status: 400 })
  }

  const nim = String(body?.nim ?? '').trim().toUpperCase()

  if (!nim || nim.length < 3) {
    return NextResponse.json(
      { error: 'NIM wajib diisi (min 3 karakter).' },
      { status: 400 }
    )
  }

  // === Find student by NIM ===
  const student = await db.student.findUnique({
    where: { nim },
    select: {
      id: true,
      name: true,
      nim: true,
      kelas: true,
      ownerId: true,
      claimedAt: true,
    },
  })

  if (!student) {
    return NextResponse.json(
      {
        error: `NIM "${nim}" tidak ditemukan. Pastikan NIM benar atau hubungi admin.`,
        hint: 'Jika Anda yakin NIM benar, minta admin untuk menambahkan Anda ke direktori mahasiswa.',
      },
      { status: 404 }
    )
  }

  // === Check if already claimed ===
  if (student.ownerId) {
    if (student.ownerId === user.id) {
      // Already claimed by THIS user — idempotent success
      return NextResponse.json({
        ok: true,
        alreadyClaimed: true,
        message: 'Profil mahasiswa Anda sudah ter-link sebelumnya.',
        studentId: student.id,
      })
    }

    // Claimed by someone else — security: don't reveal who
    return NextResponse.json(
      {
        error: `Profil mahasiswa dengan NIM "${nim}" sudah diklaim oleh akun lain. Jika ini adalah NIM Anda, hubungi admin.`,
        hint: 'Admin dapat memeriksa dan mengubah kepemilikan profil di panel admin.',
      },
      { status: 409 }
    )
  }

  // === Link student to current user ===
  const updated = await db.student.update({
    where: { id: student.id },
    data: {
      ownerId: user.id,
      claimedAt: new Date(),
    },
    select: {
      id: true,
      name: true,
      nim: true,
      kelas: true,
      nickname: true,
    },
  })

  return NextResponse.json({
    ok: true,
    message: `Berhasil! Profil mahasiswa "${updated.name}" (${updated.nim}) telah ter-link ke akun Anda.`,
    student: updated,
  })
}

// GET endpoint for documentation
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/students/claim',
    method: 'POST',
    description: 'Claim a pre-listed student profile by entering your NIM',
    body: { nim: 'string (your NIM, e.g. "3336250001")' },
    authRequired: true,
    response: {
      success: { ok: true, student: { id, name, nim, kelas, nickname } },
      alreadyClaimed: { ok: true, alreadyClaimed: true, studentId: 'string' },
      notFound: { error: 'NIM tidak ditemukan' },
      conflict: { error: 'Sudah diklaim akun lain' },
    },
  })
}
