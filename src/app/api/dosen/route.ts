import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// GET /api/dosen — list all dosen
export async function GET() {
  const dosen = await db.dosen.findMany({
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
  })
  return NextResponse.json({ dosen })
}

// POST /api/dosen — create new dosen (admin only)
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Hanya admin.' }, { status: 403 })
  }
  const body = await req.json()
  const name = String(body?.name ?? '').trim()
  if (!name) return NextResponse.json({ error: 'Nama wajib diisi.' }, { status: 400 })

  const dosen = await db.dosen.create({
    data: {
      name,
      title: body?.title ? String(body.title).trim() : null,
      role: body?.role ? String(body.role) : 'Dosen',
      expertise: body?.expertise ? String(body.expertise).trim() : null,
      bio: body?.bio ? String(body.bio).trim() : null,
      email: body?.email ? String(body.email).trim() : null,
      imageUrl: body?.imageUrl ? String(body.imageUrl).trim() : null,
      courses: body?.courses ? String(body.courses).trim() : null,
      order: body?.order ? Number(body.order) : 0,
    },
  })
  return NextResponse.json({ dosen })
}
