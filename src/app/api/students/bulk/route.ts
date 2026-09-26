import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// POST /api/students/bulk — bulk assign class or delete (admin only)
// Body: { ids: string[], action: 'assign-class', kelas?: 'A' | 'B' } OR { ids, action: 'delete' }
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Hanya admin.' }, { status: 403 })
  }

  const body = await req.json()
  const ids: string[] = Array.isArray(body?.ids) ? body.ids.filter(Boolean) : []
  const action = body?.action

  if (ids.length === 0) {
    return NextResponse.json({ error: 'Pilih minimal 1 mahasiswa.' }, { status: 400 })
  }

  let result
  if (action === 'assign-class') {
    const kelas = body?.kelas === 'B' ? 'B' : 'A'
    result = await db.student.updateMany({
      where: { id: { in: ids } },
      data: { kelas },
    })
  } else if (action === 'delete') {
    result = await db.student.deleteMany({
      where: { id: { in: ids } },
    })
  } else {
    return NextResponse.json({ error: 'Aksi tidak valid.' }, { status: 400 })
  }

  return NextResponse.json({
    ok: true,
    action,
    affected: result?.count || 0,
  })
}
