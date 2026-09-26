'use client'

import { useEffect, useState, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { Bell, Check, Trash2, UserPlus, Heart, MessageSquare, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NotifActor {
  id: string
  username: string
  displayName: string | null
  role: string
}

interface Notification {
  id: string
  type: string
  actor: NotifActor | null
  articleId: string | null
  eventId: string | null
  content: string | null
  read: boolean
  createdAt: string
  timeAgo: string
}

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string; label: (actor: string) => string }> = {
  follow: {
    icon: UserPlus,
    color: 'text-[var(--brand-navy)]',
    bg: 'bg-[var(--brand-navy)]/15',
    label: (actor) => `${actor} mulai mengikuti Anda`,
  },
  like: {
    icon: Heart,
    color: 'text-[var(--brand-maroon)]',
    bg: 'bg-[var(--brand-orange)]/15',
    label: (actor) => `${actor} menyukai artikel Anda`,
  },
  comment: {
    icon: MessageSquare,
    color: 'text-[var(--brand-ink)]',
    bg: 'bg-[var(--brand-surface-3)]',
    label: (actor) => `${actor} mengomentari artikel Anda`,
  },
}

export function NotificationBell() {
  const user = useAppStore((s) => s.user)
  const setView = useAppStore((s) => s.setView)
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  const load = () => {
    if (!user) return
    setLoading(true)
    fetch('/api/notifications?limit=20')
      .then((r) => r.json())
      .then((d) => {
        setNotifications(d.notifications || [])
        setUnreadCount(d.unreadCount || 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  // Load on mount + when dropdown opens
  useEffect(() => {
    if (user) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  useEffect(() => {
    if (open && user) load()
  }, [open, user])

  // Close on click outside
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'markAllRead' }),
    })
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' })
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
    setUnreadCount((c) => Math.max(0, c - 1))
  }

  const remove = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: 'DELETE' })
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    setUnreadCount((c) => Math.max(0, c - 1))
  }

  const handleClick = (n: Notification) => {
    if (!n.read) markRead(n.id)
    if (n.type === 'follow' && n.actor) {
      setView('member-profile', n.actor.id)
    } else if (n.articleId) {
      setView('article-detail', n.articleId)
    } else if (n.eventId) {
      setView('events')
    }
    setOpen(false)
  }

  if (!user) return null

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 rounded-full border border-[var(--brand-ink)] bg-[var(--brand-ivory)] hover:bg-[var(--brand-orange)]/15 transition-colors flex items-center justify-center group"
        aria-label={`Notifikasi${unreadCount > 0 ? ` (${unreadCount} belum dibaca)` : ''}`}
        title="Notifikasi"
      >
        <Bell className="w-4 h-4 text-[var(--brand-ink)]" />
        {unreadCount > 0 && (
          <span className="notif-bounce absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[var(--brand-maroon)] text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-[var(--brand-surface)]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        <span className="absolute inset-0 rounded-full border border-[var(--brand-ink)]/0 group-hover:border-[var(--brand-ink)]/30 transition-all" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-[var(--brand-surface)] border border-[var(--brand-ink)] shadow-hard-lg z-50">
          {/* Header */}
          <div className="bg-[var(--brand-ink)] text-[var(--brand-surface)] px-4 py-3 flex items-center justify-between">
            <span className="font-condensed text-sm uppercase tracking-widest font-bold flex items-center gap-2">
              <Bell className="w-4 h-4 text-[var(--brand-orange)]" /> Notifikasi
              {unreadCount > 0 && (
                <span className="bg-[var(--brand-maroon)] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {unreadCount}
                </span>
              )}
            </span>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[10px] uppercase tracking-widest font-condensed text-[var(--brand-orange)] hover:text-[var(--brand-surface)] flex items-center gap-1"
                  title="Tandai semua dibaca"
                >
                  <Check className="w-3 h-3" /> Baca semua
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-[var(--brand-surface)]/60 hover:text-[var(--brand-surface)]"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications list */}
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="skeleton-shimmer w-8 h-8 rounded-full flex-shrink-0" />
                  <div className="flex-grow space-y-2">
                    <div className="skeleton-shimmer h-3 w-2/3" />
                    <div className="skeleton-shimmer h-2 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-10 h-10 mx-auto mb-3 text-[var(--brand-ink-muted)]/50" />
              <p className="font-serif italic text-sm text-[var(--brand-ink-muted)]">
                Belum ada notifikasi
              </p>
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto custom-scroll">
              {notifications.map((n) => {
                const cfg = TYPE_CONFIG[n.type]
                const Icon = cfg?.icon || Bell
                const actorName = n.actor?.displayName || n.actor?.username || 'Seseorang'
                return (
                  <div
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={cn(
                      'flex gap-3 items-start p-3 border-b border-[var(--brand-border)] last:border-0 cursor-pointer hover:bg-[var(--brand-surface-2)] transition-colors group',
                      !n.read && 'bg-[var(--brand-orange)]/15/30'
                    )}
                  >
                    {/* Icon */}
                    <div className={cn('w-8 h-8 flex-shrink-0 flex items-center justify-center border border-[var(--brand-ink)]', cfg?.bg || 'bg-[var(--brand-surface-2)]')}>
                      <Icon className={cn('w-4 h-4', cfg?.color)} />
                    </div>

                    {/* Content */}
                    <div className="flex-grow min-w-0">
                      <p className="text-xs leading-relaxed text-[var(--brand-ink)]">
                        {cfg?.label(actorName) || 'Notifikasi baru'}
                      </p>
                      {n.content && (
                        <p className="text-[11px] text-[var(--brand-ink-muted)] italic mt-0.5 line-clamp-2">
                          "{n.content}"
                        </p>
                      )}
                      <p className="text-[9px] uppercase tracking-widest font-condensed text-[var(--brand-ink-muted)] mt-1">
                        {n.timeAgo}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      {!n.read && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markRead(n.id) }}
                          className="text-[var(--brand-ink-muted)] hover:text-[var(--brand-ink)] p-1"
                          title="Tandai dibaca"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); remove(n.id) }}
                        className="text-[var(--brand-ink-muted)] hover:text-[var(--brand-maroon)] p-1"
                        title="Hapus"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Unread dot */}
                    {!n.read && (
                      <span className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[var(--brand-orange)] rounded-full" />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
