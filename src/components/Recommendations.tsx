'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { PlaceholderImage } from '@/components/PlaceholderImage'
import { ScrollReveal } from '@/components/ScrollReveal'
import { Sparkles, TrendingUp, ArrowRight } from 'lucide-react'

interface Recommendation {
  id: string
  title: string
  excerpt: string
  date: string
  author: string
  category: string
  imageUrl: string | null
  tags: { id: string; name: string; color: string }[]
  score: number
  reason: string
}

export function Recommendations() {
  const setView = useAppStore((s) => s.setView)
  const [recs, setRecs] = useState<Recommendation[]>([])
  const [basedOnHistory, setBasedOnHistory] = useState(false)
  const [historySize, setHistorySize] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/recommendations')
      .then((r) => r.json())
      .then((d) => {
        setRecs(d.recommendations || [])
        setBasedOnHistory(d.basedOnHistory || false)
        setHistorySize(d.historySize || 0)
      })
      .catch(() => setRecs([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <ScrollReveal delay={2} className="border border-[var(--brand-ink)] bg-[var(--brand-surface-2)] shadow-hard">
      <div className="bg-[var(--brand-ink)] text-[var(--brand-surface)] px-4 py-3 flex items-center justify-between">
        <h3 className="font-condensed text-sm uppercase tracking-widest font-bold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--brand-orange)]" />
          {basedOnHistory ? 'Rekomendasi untuk Anda' : 'Artikel Pilihan'}
        </h3>
        <span className="text-[10px] uppercase tracking-widest font-condensed text-[var(--brand-surface)]/60">
          {basedOnHistory ? `${historySize} interaksi` : 'Populer'}
        </span>
      </div>

      {loading ? (
        <div className="p-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="skeleton-shimmer w-12 h-12 flex-shrink-0" />
              <div className="flex-grow space-y-2">
                <div className="skeleton-shimmer h-3 w-2/3" />
                <div className="skeleton-shimmer h-2 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : recs.length === 0 ? (
        <div className="p-6 text-center">
          <TrendingUp className="w-10 h-10 mx-auto mb-3 text-[var(--brand-ink-muted)]/50" />
          <p className="font-serif italic text-sm text-[var(--brand-ink-muted)]">
            Belum ada rekomendasi.
          </p>
        </div>
      ) : (
        <div className="p-2 space-y-1">
          {recs.map((rec, i) => (
            <ScrollReveal
              key={rec.id}
              delay={((i % 3) + 1) as 1 | 2 | 3}
              as="button"
              onClick={() => setView('article-detail', rec.id)}
              className="w-full text-left flex gap-3 items-start p-2 hover:bg-[var(--brand-surface-3)] transition-colors border-b border-[var(--brand-border)] last:border-0 group"
            >
              {/* Thumbnail */}
              <div className="w-14 h-14 flex-shrink-0 border border-[var(--brand-ink)]">
                <PlaceholderImage alt={rec.title} src={rec.imageUrl || undefined} grayscale />
              </div>

              {/* Content */}
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[8px] uppercase tracking-widest font-condensed bg-[var(--brand-orange)]/15 border border-[var(--brand-ink)] px-1 py-0.5">
                    {rec.category}
                  </span>
                  {basedOnHistory && rec.reason && (
                    <span className="text-[9px] text-[var(--brand-orange)] font-condensed italic truncate">
                      {rec.reason}
                    </span>
                  )}
                </div>
                <p className="text-sm font-serif font-bold leading-tight line-clamp-2 group-hover:text-[var(--brand-orange)] transition-colors mb-1">
                  {rec.title}
                </p>
                <p className="text-[10px] text-[var(--brand-ink-muted)]">
                  {rec.date} • {rec.author}
                </p>
              </div>

              <ArrowRight className="w-3 h-3 text-[var(--brand-ink-muted)] flex-shrink-0 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
            </ScrollReveal>
          ))}
        </div>
      )}
    </ScrollReveal>
  )
}
