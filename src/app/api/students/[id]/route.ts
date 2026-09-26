import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const student = await db.student.findUnique({ where: { id } })
  if (!student) return NextResponse.json({ error: 'Mahasiswa tidak ditemukan.' }, { status: 404 })
  return NextResponse.json({ student })
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Anda harus login.' }, { status: 401 })
  const { id } = await ctx.params

  const student = await db.student.findUnique({ where: { id } })
  if (!student) return NextResponse.json({ error: 'Mahasiswa tidak ditemukan.' }, { status: 404 })

  // Owner of profile OR admin can edit
  const isOwner = student.ownerId === session.userId
  const isAdmin = session.role === 'admin'
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: 'Tidak punya akses.' }, { status: 403 })
  }

  const body = await req.json()
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
  })
  return NextResponse.json({ student: updated })
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
