import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// GET /api/messages — list all conversations for current user
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ conversations: [] })

  // Get all messages where user is sender or recipient
  const messages = await db.message.findMany({
    where: {
      OR: [
        { senderId: session.userId },
        { recipientId: session.userId },
      ],
    },
    include: {
      sender: { select: { id: true, username: true, displayName: true, role: true } },
      recipient: { select: { id: true, username: true, displayName: true, role: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Group by conversation partner (the other user)
  const conversationsMap = new Map<string, {
    partnerId: string
    partner: { id: string; username: string; displayName: string | null; role: string }
    lastMessage: any
    unreadCount: number
    messageCount: number
  }>()

  for (const msg of messages) {
    const partnerId = msg.senderId === session.userId ? msg.recipientId : msg.senderId
    const partner = msg.senderId === session.userId ? msg.recipient : msg.sender

    const existing = conversationsMap.get(partnerId)
    if (!existing) {
      conversationsMap.set(partnerId, {
        partnerId,
        partner,
        lastMessage: msg,
        unreadCount: msg.recipientId === session.userId && !msg.read ? 1 : 0,
        messageCount: 1,
      })
    } else {
      existing.messageCount++
      if (msg.recipientId === session.userId && !msg.read) {
        existing.unreadCount++
      }
      // Keep the most recent message as lastMessage (messages are sorted desc)
      // First in loop is already the most recent
    }
  }

  const conversations = Array.from(conversationsMap.values())
    .sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime())

  return NextResponse.json({ conversations })
}

// POST /api/messages — send a message to another user
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Anda harus login untuk mengirim pesan.' }, { status: 401 })

  const body = await req.json()
  const recipientId = String(body?.recipientId ?? '').trim()
  const content = String(body?.content ?? '').trim()

  if (!recipientId) return NextResponse.json({ error: 'Penerima wajib diisi.' }, { status: 400 })
  if (!content) return NextResponse.json({ error: 'Isi pesan wajib diisi.' }, { status: 400 })
  if (content.length > 2000) return NextResponse.json({ error: 'Pesan maksimal 2000 karakter.' }, { status: 400 })
  if (recipientId === session.userId) return NextResponse.json({ error: 'Tidak dapat mengirim pesan ke diri sendiri.' }, { status: 400 })

  const recipient = await db.user.findUnique({ where: { id: recipientId } })
  if (!recipient) return NextResponse.json({ error: 'Penerima tidak ditemukan.' }, { status: 404 })

  const message = await db.message.create({
    data: {
      content,
      senderId: session.userId,
      recipientId,
    },
    include: {
      sender: { select: { id: true, username: true, displayName: true, role: true } },
      recipient: { select: { id: true, username: true, displayName: true, role: true } },
    },
  })

  // Create notification for recipient
  try {
    await db.notification.create({
      data: {
        type: 'message',
        recipientId,
        actorId: session.userId,
        content: content.slice(0, 100),
      },
    })
  } catch { /* ignore */ }

  return NextResponse.json({ message })
}
