import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  try {
    const event = await db.event.findUnique({ where: { id } })
    if (!event) return NextResponse.json({ error: 'Event tidak ditemukan.' }, { status: 404 })
    return NextResponse.json({ event })
  } catch (e: any) {
    console.error('[api/events/id GET] query error:', e?.message?.slice(0, 100))
    return NextResponse.json({ event: null, dbError: true })
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Anda harus login.' }, { status: 401 })
  const { id } = await ctx.params

  try {
    const event = await db.event.findUnique({ where: { id } })
    if (!event) return NextResponse.json({ error: 'Event tidak ditemukan.' }, { status: 404 })

    if (event.organizerId !== session.userId && session.role !== 'admin') {
      return NextResponse.json({ error: 'Tidak punya akses.' }, { status: 403 })
    }

    const body = await req.json()
    const updated = await db.event.update({
      where: { id },
      data: {
        ...(body.title !== undefined ? { title: String(body.title) } : {}),
        ...(body.description !== undefined ? { description: String(body.description) } : {}),
        ...(body.location !== undefined ? { location: String(body.location) } : {}),
        ...(body.startDate !== undefined ? { startDate: String(body.startDate) } : {}),
        ...(body.endDate !== undefined ? { endDate: body.endDate ? String(body.endDate) : null } : {}),
        ...(body.category !== undefined ? { category: String(body.category) } : {}),
        ...(body.imageUrl !== undefined ? { imageUrl: String(body.imageUrl) } : {}),
        ...(body.recurrence !== undefined && ['none', 'daily', 'weekly', 'monthly'].includes(body.recurrence) ? { recurrence: body.recurrence } : {}),
        ...(body.recurrenceEndDate !== undefined ? { recurrenceEndDate: body.recurrenceEndDate ? String(body.recurrenceEndDate) : null } : {}),
      },
    })
    return NextResponse.json({ event: updated })
  } catch (e: any) {
    console.error('[api/events/id PUT] error:', e?.message?.slice(0, 200))
    return NextResponse.json(
      { error: 'Gagal memperbarui event. Coba lagi atau hubungi admin.' },
      { status: 500 }
    )
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Anda harus login.' }, { status: 401 })
  const { id } = await ctx.params

  try {
    const event = await db.event.findUnique({ where: { id } })
    if (!event) return NextResponse.json({ error: 'Event tidak ditemukan.' }, { status: 404 })

    if (event.organizerId !== session.userId && session.role !== 'admin') {
      return NextResponse.json({ error: 'Tidak punya akses.' }, { status: 403 })
    }

    await db.event.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[api/events/id DELETE] error:', e?.message?.slice(0, 200))
    return NextResponse.json(
      { error: 'Gagal menghapus event. Coba lagi atau hubungi admin.' },
      { status: 500 }
    )
  }
}
