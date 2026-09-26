import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// GET /api/messages/conversation?partnerId=X — get full conversation with a specific user
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ messages: [] })

  const url = new URL(req.url)
  const partnerId = url.searchParams.get('partnerId')
  if (!partnerId) return NextResponse.json({ error: 'partnerId wajib diisi.' }, { status: 400 })

  const messages = await db.message.findMany({
    where: {
      OR: [
        { senderId: session.userId, recipientId: partnerId },
        { senderId: partnerId, recipientId: session.userId },
      ],
    },
    include: {
      sender: { select: { id: true, username: true, displayName: true, role: true } },
    },
    orderBy: { createdAt: 'asc' },
    take: 100, // last 100 messages
  })

  // Mark received messages as read
  await db.message.updateMany({
    where: {
      senderId: partnerId,
      recipientId: session.userId,
      read: false,
    },
    data: { read: true },
  })

  return NextResponse.json({ messages })
}

// POST /api/messages/conversation — same as /api/messages POST (send message)
// Kept for convenience
