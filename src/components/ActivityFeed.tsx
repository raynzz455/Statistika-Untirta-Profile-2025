'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { PlaceholderImage } from '@/components/PlaceholderImage'
import { ScrollReveal } from '@/components/ScrollReveal'
import { FileText, Calendar, Image, MessageSquare, Heart, Activity as ActivityIcon, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ActivityItem {
  id: string
  type: 'article' | 'event' | 'gallery' | 'comment' | 'like'
  timestamp: string
  timeAgo: string
  user: { id: string; username: string; displayName: string | null; role: string } | null
  title: string
  subtitle?: string
  excerpt?: string
  imageUrl?: string | null
  category?: string
  targetId?: string
  targetTitle?: string
}

const TYPE_CONFIG = {
  article: { icon: FileText, label: 'Artikel Baru', color: 'var(--brand-orange)', bg: 'bg-[var(--brand-orange)]/15', view: 'article-detail' as const },
  event: { icon: Calendar, label: 'Event Baru', color: '#5d8fb5', bg: 'bg-[var(--brand-navy)]/15', view: 'events' as const },
  gallery: { icon: Image, label: 'Foto Baru', color: 'var(--brand-navy)', bg: 'bg-[var(--brand-surface-3)]', view: 'gallery' as const },
  comment: { icon: MessageSquare, label: 'Komentar', color: '#b58200', bg: 'bg-[#fff3cc]', view: 'article-detail' as const },
  like: { icon: Heart, label: 'Like', color: 'var(--brand-navy)', bg: 'bg-[var(--brand-orange)]', view: 'article-detail' as const },
}

export function ActivityFeed() {
  const setView = useAppStore((s) => s.setView)
  const [items, setItems] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // cache: 'no-store' + Array.isArray defensive check
    fetch('/api/activity', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d.activity) ? d.activity : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  const goTo = (item: ActivityItem) => {
    const cfg = TYPE_CONFIG[item.type]
    if (item.targetId && (item.type === 'article' || item.type === 'comment' || item.type === 'like')) {
      setView('article-detail', item.targetId)
    } else if (item.type === 'event') {
      setView('events')
    } else if (item.type === 'gallery') {
      setView('gallery')
    } else {
      setView(cfg.view)
    }
  }

  return (
    <ScrollReveal delay={2} className="border border-[var(--brand-ink)] bg-[var(--brand-surface-2)] shadow-hard">
      <div className="bg-[var(--brand-ink)] text-[var(--brand-surface)] px-4 py-3 flex items-center justify-between">
        <h3 className="font-condensed text-sm uppercase tracking-widest font-bold flex items-center gap-2">
          <ActivityIcon className="w-4 h-4 text-[var(--brand-orange)]" /> Aktivitas Terkini
        </h3>
        <span className="text-[10px] uppercase tracking-widest font-condensed text-[var(--brand-surface)]/60">
          {items.length} aktivitas
        </span>
      </div>

      {loading ? (
        <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto custom-scroll">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="skeleton-shimmer w-8 h-8 rounded-full flex-shrink-0" />
              <div className="flex-grow space-y-2">
                <div className="skeleton-shimmer h-3 w-2/3" />
                <div className="skeleton-shimmer h-2 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center">
          <ActivityIcon className="w-10 h-10 mx-auto mb-3 text-[var(--brand-ink-muted)]/50" />
          <p className="font-serif italic text-sm text-[var(--brand-ink-muted)]">
            Belum ada aktivitas terkini.
          </p>
        </div>
      ) : (
        <div className="p-2 space-y-1 max-h-[500px] overflow-y-auto custom-scroll">
          {items.map((item, i) => {
            const cfg = TYPE_CONFIG[item.type]
            const Icon = cfg.icon
            const displayName = item.user?.displayName || item.user?.username || 'Anggota'
            return (
              <ScrollReveal
                key={item.id}
                delay={((i % 4) + 1) as 1 | 2 | 3 | 4}
                as="button"
                onClick={() => goTo(item)}
                className="w-full text-left flex gap-3 items-start p-2 hover:bg-[var(--brand-surface-3)] transition-colors border-b border-[var(--brand-border)] last:border-0 group"
              >
                {/* Type icon */}
                <div
                  className={cn('w-8 h-8 flex-shrink-0 flex items-center justify-center border border-[var(--brand-ink)]', cfg.bg)}
                >
                  <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                </div>

                {/* Content */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span
                      className="text-[8px] uppercase tracking-widest font-condensed px-1 py-0.5 text-white"
                      style={{ backgroundColor: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                    {item.user && (
                      <span className="text-[10px] text-[var(--brand-ink-muted)] font-condensed uppercase tracking-wider truncate">
                        oleh {displayName}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-serif font-bold leading-tight line-clamp-1 group-hover:text-[var(--brand-orange)] transition-colors">
                    {item.title}
                  </p>
                  {item.subtitle && (
                    <p className="text-[11px] text-[var(--brand-ink-muted)] line-clamp-1 mt-0.5">{item.subtitle}</p>
                  )}
                  {item.targetTitle && item.type !== 'article' && (
                    <p className="text-[11px] text-[var(--brand-ink-muted)] italic line-clamp-1 mt-0.5">
                      pada "{item.targetTitle}"
                    </p>
                  )}
                  <p className="text-[9px] uppercase tracking-widest font-condensed text-[var(--brand-ink-muted)] mt-1">
                    {item.timeAgo}
                  </p>
                </div>

                {/* Thumbnail for articles/gallery/events */}
                {item.imageUrl !== undefined && item.imageUrl !== null && item.imageUrl !== '' && (
                  <div className="w-12 h-12 flex-shrink-0 border border-[var(--brand-ink)]">
                    <PlaceholderImage alt={item.title} src={item.imageUrl} grayscale />
                  </div>
                )}

                {/* Arrow indicator */}
                <ArrowRight className="w-3 h-3 text-[var(--brand-ink-muted)] flex-shrink-0 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </ScrollReveal>
            )
          })}
        </div>
      )}
    </ScrollReveal>
  )
}
