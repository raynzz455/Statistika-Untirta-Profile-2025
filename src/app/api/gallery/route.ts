import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET() {
  const items = await db.gallery.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Anda harus login.' }, { status: 401 })

  const body = await req.json()
  const caption = String(body?.caption ?? '').trim()
  const category = String(body?.category ?? 'Umum').trim()
  const imageUrl = body?.imageUrl ? String(body.imageUrl).trim() : ''

  if (!caption || !imageUrl) {
    return NextResponse.json({ error: 'Caption dan URL gambar wajib diisi.' }, { status: 400 })
  }

  const item = await db.gallery.create({
    data: { caption, category, imageUrl, uploaderId: session.userId },
  })
  return NextResponse.json({ item })
}
