import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// GET /api/export?format=csv|json&type=articles|events|students|users|all
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Hanya admin.' }, { status: 403 })
  }

  const url = new URL(req.url)
  const format = url.searchParams.get('format') === 'csv' ? 'csv' : 'json'
  const type = url.searchParams.get('type') || 'all'

  // Fetch all data based on type
  const data: Record<string, any[]> = {}

  if (type === 'all' || type === 'articles') {
    data.articles = await db.article.findMany({
      select: {
        id: true, title: true, excerpt: true, category: true, date: true,
        author: true, published: true, imageUrl: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  if (type === 'all' || type === 'events') {
    data.events = await db.event.findMany({
      select: {
        id: true, title: true, description: true, location: true,
        startDate: true, endDate: true, category: true, recurrence: true,
        recurrenceEndDate: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  if (type === 'all' || type === 'students') {
    data.students = await db.student.findMany({
      select: {
        id: true, name: true, nim: true, kelas: true, tagline: true,
        bio: true, instagram: true, asalDaerah: true, createdAt: true,
      },
      orderBy: { nim: 'asc' },
    })
  }

  if (type === 'all' || type === 'users') {
    data.users = await db.user.findMany({
      select: {
        id: true, username: true, role: true, displayName: true,
        theme: true, createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })
  }

  if (type === 'all' || type === 'gallery') {
    data.gallery = await db.gallery.findMany({
      select: {
        id: true, caption: true, category: true, imageUrl: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  if (type === 'all' || type === 'comments') {
    data.comments = await db.comment.findMany({
      select: {
        id: true, content: true, createdAt: true,
        article: { select: { id: true, title: true } },
        user: { select: { id: true, username: true, displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  if (type === 'all' || type === 'likes') {
    data.likes = await db.like.findMany({
      select: {
        id: true, createdAt: true,
        article: { select: { id: true, title: true } },
        user: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  if (type === 'all' || type === 'rsvps') {
    data.rsvps = await db.rsvp.findMany({
      select: {
        id: true, status: true, createdAt: true,
        event: { select: { id: true, title: true } },
        user: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  if (format === 'json') {
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="statistika25-export-${type}-${Date.now()}.json"`,
      },
    })
  }

  // CSV format — flatten and escape
  const escapeCSV = (val: any): string => {
    if (val === null || val === undefined) return ''
    const str = typeof val === 'object' ? JSON.stringify(val) : String(val)
    // Escape quotes and wrap in quotes if contains comma/quote/newline
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const csvSections: string[] = []
  for (const [key, rows] of Object.entries(data)) {
    if (rows.length === 0) continue
    csvSections.push(`\n=== ${key.toUpperCase()} (${rows.length} rows) ===`)
    // Get all unique keys from all rows
    const allKeys = new Set<string>()
    rows.forEach((row) => Object.keys(row).forEach((k) => allKeys.add(k)))
    const keys = Array.from(allKeys)
    csvSections.push(keys.join(','))
    for (const row of rows) {
      csvSections.push(keys.map((k) => escapeCSV((row as any)[k])).join(','))
    }
  }

  const csv = csvSections.join('\n')
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="statistika25-export-${type}-${Date.now()}.csv"`,
    },
  })
}
