import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, hashPassword } from '@/lib/session'

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Hanya admin.' }, { status: 403 })
  }
  const { id } = await ctx.params
  const body = await req.json()

  const target = await db.user.findUnique({ where: { id } })
  if (!target) return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 })

  // Prevent admin demoting themselves (lock-out protection)
  if (target.id === session.userId && body?.role && body.role !== 'admin') {
    return NextResponse.json({ error: 'Tidak dapat menurunkan role diri sendiri.' }, { status: 400 })
  }

  // Prevent deleting the last admin
  if (target.role === 'admin' && body?.role === 'user') {
    const adminCount = await db.user.count({ where: { role: 'admin' } })
    if (adminCount <= 1) {
      return NextResponse.json({ error: 'Tidak dapat menurunkan admin terakhir.' }, { status: 400 })
    }
  }

  const data: any = {}
  if (body?.role === 'admin' || body?.role === 'user') data.role = body.role
  if (body?.displayName !== undefined) data.displayName = String(body.displayName).trim() || null
  if (body?.password && String(body.password).length >= 4) {
    data.passwordHash = hashPassword(String(body.password))
  }

  const updated = await db.user.update({
    where: { id },
    data,
    select: { id: true, username: true, role: true, displayName: true, updatedAt: true },
  })
  return NextResponse.json({ user: updated })
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Hanya admin.' }, { status: 403 })
  }
  const { id } = await ctx.params

  if (id === session.userId) {
    return NextResponse.json({ error: 'Tidak dapat menghapus diri sendiri.' }, { status: 400 })
  }

  const target = await db.user.findUnique({ where: { id } })
  if (!target) return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 })

  if (target.role === 'admin') {
    const adminCount = await db.user.count({ where: { role: 'admin' } })
    if (adminCount <= 1) {
      return NextResponse.json({ error: 'Tidak dapat menghapus admin terakhir.' }, { status: 400 })
    }
  }

  // Detach owned students first (so they survive as orphan records)
  await db.student.updateMany({ where: { ownerId: id }, data: { ownerId: null } })

  await db.user.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
