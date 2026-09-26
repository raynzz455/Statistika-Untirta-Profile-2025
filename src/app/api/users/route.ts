import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, hashPassword } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Hanya admin yang dapat melihat daftar user.' }, { status: 403 })
  }

  const users = await db.user.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      username: true,
      role: true,
      displayName: true,
      createdAt: true,
      _count: {
        select: {
          articles: true,
          events: true,
          galleryItems: true,
          students: true,
        },
      },
    },
  })

  return NextResponse.json({ users })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Hanya admin yang dapat menambah user.' }, { status: 403 })
  }

  const body = await req.json()
  const username = String(body?.username ?? '').trim().toLowerCase()
  const password = String(body?.password ?? '').trim()
  const role = (body?.role === 'admin' ? 'admin' : 'user') as 'admin' | 'user'
  const displayName = body?.displayName ? String(body.displayName).trim() : null

  if (!username || !password) {
    return NextResponse.json({ error: 'Username dan password wajib diisi.' }, { status: 400 })
  }
  if (password.length < 4) {
    return NextResponse.json({ error: 'Password minimal 4 karakter.' }, { status: 400 })
  }

  const dup = await db.user.findUnique({ where: { username } })
  if (dup) {
    return NextResponse.json({ error: 'Username sudah dipakai.' }, { status: 409 })
  }

  const user = await db.user.create({
    data: { username, passwordHash: hashPassword(password), role, displayName },
    select: { id: true, username: true, role: true, displayName: true, createdAt: true },
  })
  return NextResponse.json({ user })
}
