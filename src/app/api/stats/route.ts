import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const [students, articles, events, gallery] = await Promise.all([
    db.student.count(),
    db.article.count({ where: { published: true } }),
    db.event.count(),
    db.gallery.count(),
  ])

  const classA = await db.student.count({ where: { kelas: 'A' } })
  const classB = await db.student.count({ where: { kelas: 'B' } })

  return NextResponse.json({
    students,
    articles,
    events,
    gallery,
    classA,
    classB,
  })
}
