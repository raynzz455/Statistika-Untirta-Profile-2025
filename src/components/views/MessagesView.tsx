'use client'

import { useEffect, useState, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { PlaceholderImage } from '@/components/PlaceholderImage'
import { ArrowLeft, Send, MessageSquare, Mail, MailOpen, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Conversation {
  partnerId: string
  partner: { id: string; username: string; displayName: string | null; role: string }
  lastMessage: {
    id: string
    content: string
    createdAt: string
    senderId: string
    read: boolean
  }
  unreadCount: number
  messageCount: number
}

interface Message {
  id: string
  content: string
  createdAt: string
  read: boolean
  sender: { id: string; username: string; displayName: string | null; role: string }
}

export function MessagesView() {
  const user = useAppStore((s) => s.user)
  const setView = useAppStore((s) => s.setView)
  const selectedId = useAppStore((s) => s.selectedId)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activePartner, setActivePartner] = useState<string | null>(selectedId)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  // Load conversations
  const loadConversations = () => {
    fetch('/api/messages')
      .then((r) => r.json())
      .then((d) => setConversations(d.conversations || []))
      .catch(() => setConversations([]))
      .finally(() => setLoadingConvs(false))
  }

  // Load messages for active conversation
  const loadMessages = (partnerId: string) => {
    setLoadingMsgs(true)
    fetch(`/api/messages/conversation?partnerId=${partnerId}`)
      .then((r) => r.json())
      .then((d) => setMessages(d.messages || []))
      .catch(() => setMessages([]))
      .finally(() => setLoadingMsgs(false))
  }

  useEffect(() => {
    if (!user) {
      setLoadingConvs(false)
      return
    }
    loadConversations()
  }, [user])

  useEffect(() => {
    if (activePartner) {
      loadMessages(activePartner)
    } else {
      setMessages([])
    }
  }, [activePartner])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activePartner || !newMessage.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: activePartner, content: newMessage.trim() }),
      })
      const d = await res.json()
      if (d.error) {
        toast.error(d.error)
        return
      }
      setMessages((prev) => [...prev, d.message])
      setNewMessage('')
      loadConversations() // refresh conversation list
    } catch {
      toast.error('Gagal mengirim pesan.')
    } finally {
      setSending(false)
    }
  }

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('id-ID', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
      })
    } catch { return iso }
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-20 border border-[var(--brand-ink)] bg-[var(--brand-surface-2)] p-8">
        <Mail className="w-12 h-12 mx-auto mb-4 text-[var(--brand-ink-muted)]" />
        <h2 className="font-serif text-3xl mb-2">Login Diperlukan</h2>
        <p className="text-sm text-[var(--brand-ink-muted)] mb-6">Login untuk mengirim dan menerima pesan.</p>
        <button
          onClick={() => setView('login')}
          className="inline-flex items-center gap-2 bg-[var(--brand-ink)] text-white px-6 py-3 font-condensed uppercase tracking-widest text-xs font-bold hover:bg-[var(--brand-maroon)]"
        >
          Ke Halaman Login
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto page-enter">
      <div className="mb-8 pb-6 border-b-2 border-[var(--brand-ink)]">
        <h1 className="text-5xl font-serif font-black uppercase mb-4 text-[var(--brand-ink)]">
          Pesan <span className="italic text-[var(--brand-maroon)]">Member</span>
        </h1>
        <p className="uppercase tracking-widest text-sm font-bold text-[var(--brand-ink)]/70">
          Kirim pesan langsung ke anggota lain
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 border border-[var(--brand-ink)] shadow-hard bg-[var(--brand-surface)] min-h-[500px]">
        {/* Conversation list */}
        <div className={cn(
          'border-r border-[var(--brand-ink)] flex flex-col',
          activePartner && 'hidden md:flex'
        )}>
          <div className="bg-[var(--brand-ink)] text-[var(--brand-surface)] px-4 py-3">
            <h3 className="font-condensed text-sm uppercase tracking-widest font-bold flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[var(--brand-orange)]" /> Percakapan
            </h3>
          </div>
          <div className="flex-grow overflow-y-auto custom-scroll max-h-[500px]">
            {loadingConvs ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-3 items-center">
                    <div className="skeleton-shimmer w-10 h-10 rounded-full flex-shrink-0" />
                    <div className="flex-grow space-y-2">
                      <div className="skeleton-shimmer h-3 w-2/3" />
                      <div className="skeleton-shimmer h-2 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center">
                <Mail className="w-10 h-10 mx-auto mb-3 text-[var(--brand-ink-muted)]/50" />
                <p className="font-serif italic text-sm text-[var(--brand-ink-muted)]">
                  Belum ada percakapan
                </p>
                <p className="text-xs text-[var(--brand-ink-muted)] mt-1">
                  Kunjungi profil member untuk mulai mengirim pesan.
                </p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.partnerId}
                  onClick={() => setActivePartner(conv.partnerId)}
                  className={cn(
                    'w-full text-left flex items-center gap-3 p-3 border-b border-[var(--brand-border)] last:border-0 hover:bg-[var(--brand-surface-2)] transition-colors',
                    activePartner === conv.partnerId && 'bg-[var(--brand-orange)]/15/30'
                  )}
                >
                  <div className="w-10 h-10 flex-shrink-0 border border-[var(--brand-ink)] rounded-full overflow-hidden">
                    <PlaceholderImage alt={`Foto ${conv.partner.displayName || conv.partner.username}`} src={undefined} grayscale />
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-serif font-bold text-sm truncate">
                        {conv.partner.displayName || conv.partner.username}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="bg-[var(--brand-maroon)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--brand-ink-muted)] line-clamp-1 mt-0.5">
                      {conv.lastMessage.senderId === user.id ? 'Anda: ' : ''}
                      {conv.lastMessage.content}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Message thread */}
        <div className={cn(
          'md:col-span-2 flex flex-col',
          !activePartner && 'hidden md:flex'
        )}>
          {activePartner ? (
            <>
              {/* Thread header */}
              <div className="bg-[var(--brand-surface-2)] border-b border-[var(--brand-ink)] px-4 py-3 flex items-center gap-3">
                <button
                  onClick={() => setActivePartner(null)}
                  className="md:hidden p-1 hover:bg-[var(--brand-orange)]/15 rounded"
                  aria-label="Kembali"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="w-10 h-10 border border-[var(--brand-ink)] rounded-full overflow-hidden flex-shrink-0">
                  <PlaceholderImage alt="Foto" src={undefined} grayscale />
                </div>
                <div className="flex-grow min-w-0">
                  <button
                    onClick={() => setView('member-profile', activePartner)}
                    className="font-serif font-bold text-sm hover:text-[var(--brand-orange)] transition-colors truncate block"
                  >
                    {conversations.find((c) => c.partnerId === activePartner)?.partner.displayName || 'Member'}
                  </button>
                  <p className="text-[10px] uppercase tracking-widest font-condensed text-[var(--brand-ink-muted)]">
                    @{conversations.find((c) => c.partnerId === activePartner)?.partner.username || 'unknown'}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-grow overflow-y-auto custom-scroll p-4 space-y-3 max-h-[400px] min-h-[300px]">
                {loadingMsgs ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className={cn('flex', i % 2 === 0 ? 'justify-start' : 'justify-end')}>
                        <div className="skeleton-shimmer h-12 w-48" />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-10 h-10 mx-auto mb-3 text-[var(--brand-ink-muted)]/50" />
                    <p className="font-serif italic text-sm text-[var(--brand-ink-muted)]">
                      Mulai percakapan baru
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.sender.id === user.id
                    return (
                      <div
                        key={msg.id}
                        className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}
                      >
                        <div
                          className={cn(
                            'max-w-[75%] px-3 py-2 border',
                            isOwn
                              ? 'bg-[var(--brand-ink)] text-[var(--brand-surface)] border-[var(--brand-ink)]'
                              : 'bg-[var(--brand-surface-2)] text-[var(--brand-ink)] border-[var(--brand-border)]'
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                          <div className={cn(
                            'flex items-center gap-1 mt-1',
                            isOwn ? 'justify-end text-[var(--brand-surface)]/60' : 'text-[var(--brand-ink-muted)]'
                          )}>
                            <span className="text-[9px] font-condensed uppercase tracking-widest">
                              {formatTime(msg.createdAt)}
                            </span>
                            {isOwn && (
                              msg.read ? <MailOpen className="w-3 h-3" /> : <Mail className="w-3 h-3" />
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <form onSubmit={sendMessage} className="border-t border-[var(--brand-ink)] p-3 flex gap-2 bg-[var(--brand-surface)]">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Ketik pesan..."
                  maxLength={2000}
                  className="flex-grow border border-[var(--brand-ink)] p-2 text-sm bg-[var(--brand-surface)] focus:outline-none focus:border-[var(--brand-maroon)]"
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="bg-[var(--brand-ink)] text-[var(--brand-surface)] px-4 font-condensed uppercase tracking-widest text-xs font-bold hover:bg-[var(--brand-maroon)] transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <Send className="w-3 h-3" /> {sending ? '...' : 'Kirim'}
                </button>
              </form>
            </>
          ) : (
            <div className="flex items-center justify-center flex-grow">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-[var(--brand-ink-muted)]/30" />
                <p className="font-serif italic text-lg text-[var(--brand-ink-muted)]">
                  Pilih percakapan untuk mulai
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
