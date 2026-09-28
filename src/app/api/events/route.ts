import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { withCache, CachePresets } from '@/lib/cache'

export async function GET() {
  const events = await db.event.findMany({ orderBy: { createdAt: 'desc' } })
  return withCache(NextResponse.json({ events }), CachePresets.publicList)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Anda harus login.' }, { status: 401 })

  const body = await req.json()
  const title = String(body?.title ?? '').trim()
  const description = String(body?.description ?? '').trim()
  const location = String(body?.location ?? '').trim()
  const startDate = String(body?.startDate ?? '').trim()
  const endDate = body?.endDate ? String(body.endDate).trim() : null
  const category = String(body?.category ?? 'Akademik').trim()
  const imageUrl = body?.imageUrl ? String(body.imageUrl).trim() : null
  // Recurrence fields
  const recurrence = ['none', 'daily', 'weekly', 'monthly'].includes(body?.recurrence) ? body.recurrence : 'none'
  const recurrenceEndDate = body?.recurrenceEndDate ? String(body.recurrenceEndDate).trim() : null

  if (!title || !startDate) {
    return NextResponse.json({ error: 'Judul dan tanggal mulai wajib diisi.' }, { status: 400 })
  }

  const event = await db.event.create({
    data: {
      title,
      description,
      location,
      startDate,
      endDate,
      category,
      imageUrl,
      organizerId: session.userId,
      recurrence,
      recurrenceEndDate,
    },
  })
  return NextResponse.json({ event })
}
