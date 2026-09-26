'use client'

import { useEffect, useState } from 'react'
import { Trophy, FileText, Heart, Calendar, Image, MessageSquare, Crown, Medal, Award } from 'lucide-react'
import { ScrollReveal } from '@/components/ScrollReveal'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

interface LeaderboardEntry {
  id: string
  username: string
  displayName: string | null
  role: string
  stats: {
    articles: number
    events: number
    gallery: number
    comments: number
    likes: number
  }
  score: number
}

const RANK_ICONS = [
  { icon: Crown, color: 'text-[#ffd700]', bg: 'bg-[#fff8dc]', label: 'Juara 1' },
  { icon: Medal, color: 'text-[#c0c0c0]', bg: 'bg-[#f0f0f0]', label: 'Juara 2' },
  { icon: Award, color: 'text-[#cd7f32]', bg: 'bg-[#f4e4d4]', label: 'Juara 3' },
]

export function Leaderboard() {
  const setView = useAppStore((s) => s.setView)
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [totalContributors, setTotalContributors] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((r) => r.json())
      .then((d) => {
        setEntries(d.leaderboard || [])
        setTotalContributors(d.totalContributors || 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border border-[var(--brand-ink)] p-4 bg-[var(--brand-surface-2)] animate-pulse h-32" />
        ))}
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-[var(--brand-ink)]/30">
        <Trophy className="w-10 h-10 mx-auto mb-3 text-[var(--brand-ink-muted)]/50" />
        <p className="font-serif italic text-lg text-[var(--brand-ink-muted)] mb-1">
          Belum ada kontributor
        </p>
        <p className="text-sm text-[var(--brand-ink-muted)]">
          Jadilah yang pertama berkontribusi artikel, event, atau foto!
        </p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-xs uppercase tracking-widest font-condensed text-[var(--brand-ink-muted)] mb-4">
        {totalContributors} kontributor aktif • Top {entries.length}
      </p>

      {/* Top 3 podium (on desktop) */}
      {entries.length >= 3 && (
        <div className="hidden md:grid grid-cols-3 gap-4 mb-6">
          {[1, 0, 2].map((podiumIdx) => {
            const entry = entries[podiumIdx]
            if (!entry) return null
            const rank = podiumIdx + 1
            const cfg = RANK_ICONS[podiumIdx]
            const Icon = cfg.icon
            const heightClass = podiumIdx === 0 ? 'md:translate-y-0' : 'md:translate-y-4'
            return (
              <ScrollReveal
                key={entry.id}
                delay={(podiumIdx + 1) as 1 | 2 | 3}
                as="button"
                onClick={() => setView('member-profile', entry.id)}
                className={cn(
                  'border-2 border-[var(--brand-ink)] p-4 text-center bg-[var(--brand-surface-2)] shadow-hard relative cursor-pointer hover:-translate-y-1 transition-transform',
                  heightClass,
                  podiumIdx === 0 && 'shadow-hard-lg md:scale-105'
                )}
              >
                <div className={cn('inline-flex w-12 h-12 rounded-full items-center justify-center mb-2 border-2 border-[var(--brand-ink)]', cfg.bg)}>
                  <Icon className={cn('w-6 h-6', cfg.color)} />
                </div>
                <p className="text-[10px] uppercase tracking-widest font-condensed text-[var(--brand-ink-muted)] mb-1">
                  {cfg.label}
                </p>
                <p className="font-serif font-bold text-lg truncate">
                  {entry.displayName || entry.username}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-[var(--brand-ink-muted)] mb-2">
                  @{entry.username}
                </p>
                <div className="text-2xl font-condensed text-[var(--brand-orange)]">
                  {entry.score}
                </div>
                <p className="text-[9px] uppercase tracking-widest font-condensed text-[var(--brand-ink-muted)]">poin</p>
              </ScrollReveal>
            )
          })}
        </div>
      )}

      {/* Full list */}
      <div className="space-y-2">
        {entries.map((entry, i) => {
          const rank = i + 1
          const cfg = RANK_ICONS[i]
          const Icon = cfg?.icon
          return (
            <ScrollReveal
              key={entry.id}
              delay={((i % 5) + 1) as 1 | 2 | 3 | 4 | 5}
              as="button"
              onClick={() => setView('member-profile', entry.id)}
              className="flex items-center gap-3 border border-[var(--brand-ink)] p-3 bg-[var(--brand-surface-2)] hover:bg-[var(--brand-surface-3)] transition-colors lift-on-hover w-full text-left"
            >
              {/* Rank */}
              <div className={cn(
                'w-10 h-10 flex-shrink-0 flex items-center justify-center font-condensed border border-[var(--brand-ink)]',
                rank === 1 && 'bg-[#fff8dc] text-[#b8860b]',
                rank === 2 && 'bg-[#f0f0f0] text-[#808080]',
                rank === 3 && 'bg-[#f4e4d4] text-[#8b4513]',
                rank > 3 && 'bg-[var(--brand-surface)] text-[var(--brand-ink)]'
              )}>
                {Icon && rank <= 3 ? <Icon className={cn('w-5 h-5', cfg.color)} /> : rank}
              </div>

              {/* User info */}
              <div className="min-w-0 flex-grow">
                <div className="flex items-center gap-2">
                  <p className="font-serif font-bold text-base truncate">
                    {entry.displayName || entry.username}
                  </p>
                  {entry.role === 'admin' && (
                    <span className="text-[8px] uppercase tracking-widest font-condensed bg-[var(--brand-maroon)] text-white px-1 py-0.5">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-[10px] uppercase tracking-widest text-[var(--brand-ink-muted)]">
                  @{entry.username}
                </p>
              </div>

              {/* Stats badges */}
              <div className="hidden sm:flex items-center gap-1.5 text-xs">
                {entry.stats.articles > 0 && (
                  <span className="flex items-center gap-0.5 bg-[var(--brand-orange)]/15 border border-[var(--brand-orange)] px-1.5 py-0.5" title="Artikel">
                    <FileText className="w-3 h-3" /> {entry.stats.articles}
                  </span>
                )}
                {entry.stats.likes > 0 && (
                  <span className="flex items-center gap-0.5 bg-[var(--brand-orange)] text-[var(--brand-surface)] border border-[var(--brand-orange)] px-1.5 py-0.5" title="Likes diterima">
                    <Heart className="w-3 h-3 fill-current" /> {entry.stats.likes}
                  </span>
                )}
                {entry.stats.events > 0 && (
                  <span className="flex items-center gap-0.5 bg-[var(--brand-navy)]/15 border border-[var(--brand-navy)] px-1.5 py-0.5" title="Event">
                    <Calendar className="w-3 h-3" /> {entry.stats.events}
                  </span>
                )}
                {entry.stats.gallery > 0 && (
                  <span className="flex items-center gap-0.5 bg-[var(--brand-surface-3)] border border-[var(--brand-ink)] px-1.5 py-0.5" title="Galeri">
                    <Image className="w-3 h-3" /> {entry.stats.gallery}
                  </span>
                )}
                {entry.stats.comments > 0 && (
                  <span className="flex items-center gap-0.5 bg-[var(--brand-surface-2)] border border-[var(--brand-ink)] px-1.5 py-0.5" title="Komentar">
                    <MessageSquare className="w-3 h-3" /> {entry.stats.comments}
                  </span>
                )}
              </div>

              {/* Score */}
              <div className="text-right flex-shrink-0">
                <p className="font-condensed text-xl text-[var(--brand-orange)] leading-none">
                  {entry.score}
                </p>
                <p className="text-[9px] uppercase tracking-widest font-condensed text-[var(--brand-ink-muted)]">poin</p>
              </div>
            </ScrollReveal>
          )
        })}
      </div>

      {/* Scoring info */}
      <div className="mt-6 border-t border-dashed border-[var(--brand-border)] pt-4">
        <p className="text-[10px] uppercase tracking-widest font-condensed text-[var(--brand-ink-muted)] mb-2">
          Sistem Poin
        </p>
        <div className="flex flex-wrap gap-3 text-xs">
          <span className="flex items-center gap-1"><FileText className="w-3 h-3 text-[var(--brand-orange)]" /> Artikel × 5</span>
          <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-[var(--brand-orange)]" /> Like × 2</span>
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-[var(--brand-orange)]" /> Event × 3</span>
          <span className="flex items-center gap-1"><Image className="w-3 h-3 text-[var(--brand-orange)]" /> Galeri × 2</span>
          <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3 text-[var(--brand-orange)]" /> Komentar × 1</span>
        </div>
      </div>
    </div>
  )
}
