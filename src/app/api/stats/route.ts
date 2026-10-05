import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/stats — dashboard counts (students, articles, events, gallery)
// Called on EVERY page load (Header fetches this for the stats bar).
// Must be fast + never crash (no 500 — return zeros on error).
export async function GET() {
  try {
    // Run all count queries in parallel for speed
    const [students, articles, events, gallery, classA, classB] = await Promise.all([
      db.student.count().catch(() => 0),
      db.article.count({ where: { published: true } }).catch(() => 0),
      db.event.count().catch(() => 0),
      db.gallery.count().catch(() => 0),
      db.student.count({ where: { kelas: 'A' } }).catch(() => 0),
      db.student.count({ where: { kelas: 'B' } }).catch(() => 0),
    ])

    return NextResponse.json({
      students,
      articles,
      events,
      gallery,
      classA,
      classB,
    })
  } catch (e: any) {
    // Return zeros instead of 500 — prevents Header crash on every page
    console.error('[api/stats] error:', e?.message?.slice(0, 100))
    return NextResponse.json({
      students: 0,
      articles: 0,
      events: 0,
      gallery: 0,
      classA: 0,
      classB: 0,
      dbError: true,
    })
  }
}
