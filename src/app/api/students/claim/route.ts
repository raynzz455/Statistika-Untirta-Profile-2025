// ============================================================================
// POST /api/students/claim — NIM-based student profile claim
// ============================================================================
// Uses getSession() directly (not getCurrentUser) for reliability.
// getSession() now works for BOTH custom session AND Google OAuth users
// (the stat_session cookie is set by /auth/callback for both auth methods).
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  // === Auth check — use getSession() directly (works for both auth methods) ===
  const session = await getSession()
  if (!session) {
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
  let student
  try {
    student = await db.student.findUnique({
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
  } catch (e: any) {
    console.error('[claim] db.student.findUnique error:', e.message?.slice(0, 100))
    return NextResponse.json(
      { error: 'Gagal mengakses database. Pastikan database sudah di-setup dengan benar.' },
      { status: 500 }
    )
  }

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
    if (student.ownerId === session.userId) {
      return NextResponse.json({
        ok: true,
        alreadyClaimed: true,
        message: 'Profil mahasiswa Anda sudah ter-link sebelumnya.',
        studentId: student.id,
      })
    }

    return NextResponse.json(
      {
        error: `Profil mahasiswa dengan NIM "${nim}" sudah diklaim oleh akun lain. Jika ini adalah NIM Anda, hubungi admin.`,
        hint: 'Admin dapat memeriksa dan mengubah kepemilikan profil di panel admin.',
      },
      { status: 409 }
    )
  }

  // === Link student to current user ===
  try {
    const updated = await db.student.update({
      where: { id: student.id },
      data: {
        ownerId: session.userId,
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
  } catch (e: any) {
    console.error('[claim] db.student.update error:', e.message?.slice(0, 100))
    return NextResponse.json(
      { error: 'Gagal meng-update profil. Coba lagi atau hubungi admin.' },
      { status: 500 }
    )
  }
}

// GET endpoint for documentation
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/students/claim',
    method: 'POST',
    description: 'Claim a pre-listed student profile by entering your NIM',
    body: { nim: 'string (your NIM, e.g. "3338250031")' },
    authRequired: true,
  })
}
