import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// GET /api/notifications — list current user's notifications
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ notifications: [], unreadCount: 0 })

  const url = new URL(req.url)
  const unreadOnly = url.searchParams.get('unreadOnly') === '1'
  const limit = Math.min(Number(url.searchParams.get('limit') ?? '20'), 50)

  const notifications = await db.notification.findMany({
    where: {
      recipientId: session.userId,
      ...(unreadOnly ? { read: false } : {}),
    },
    include: {
      actor: {
        select: { id: true, username: true, displayName: true, role: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  const unreadCount = await db.notification.count({
    where: { recipientId: session.userId, read: false },
  })

  return NextResponse.json({
    notifications: notifications.map((n) => ({
      id: n.id,
      type: n.type,
      actor: n.actor,
      articleId: n.articleId,
      eventId: n.eventId,
      content: n.content,
      read: n.read,
      createdAt: n.createdAt,
      timeAgo: getTimeAgo(n.createdAt),
    })),
    unreadCount,
  })
}

// POST /api/notifications — mark all as read
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Anda harus login.' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  
  if (body?.action === 'markAllRead') {
    await db.notification.updateMany({
      where: { recipientId: session.userId, read: false },
      data: { read: true },
    })
    return NextResponse.json({ ok: true, marked: 'all' })
  }

  return NextResponse.json({ error: 'Aksi tidak valid.' }, { status: 400 })
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'baru saja'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} menit lalu`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} hari lalu`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `${weeks} minggu lalu`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} bulan lalu`
  return `${Math.floor(months / 12)} tahun lalu`
}
