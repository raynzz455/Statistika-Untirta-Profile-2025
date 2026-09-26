'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Tag as TagIcon, TrendingUp } from 'lucide-react'
import { ScrollReveal } from '@/components/ScrollReveal'

interface TagItem {
  id: string
  name: string
  color: string
  count: number
}

export function TagCloud() {
  const setView = useAppStore((s) => s.setView)
  const setTagFilter = useAppStore((s) => s.setTagFilter)
  const [tags, setTags] = useState<TagItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tags')
      .then((r) => r.json())
      .then((d) => setTags(d.tags || []))
      .catch(() => setTags([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex flex-wrap gap-2 items-center justify-center min-h-[120px]">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="skeleton-shimmer h-8 rounded"
            style={{ width: `${60 + Math.random() * 80}px` }}
          />
        ))}
      </div>
    )
  }

  if (tags.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-[var(--brand-ink)]/30 bg-[var(--brand-surface-2)]">
        <TagIcon className="w-10 h-10 mx-auto mb-3 text-[var(--brand-ink-muted)]/50" />
        <p className="font-serif italic text-[var(--brand-ink-muted)]">
          Belum ada tag. Tambahkan tag ke artikel untuk membangun awan tag.
        </p>
      </div>
    )
  }

  // Filter to tags with at least 1 article, sort by count desc
  const usedTags = tags.filter((t) => t.count > 0).sort((a, b) => b.count - a.count)

  if (usedTags.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-[var(--brand-ink)]/30 bg-[var(--brand-surface-2)]">
        <TrendingUp className="w-10 h-10 mx-auto mb-3 text-[var(--brand-ink-muted)]/50" />
        <p className="font-serif italic text-[var(--brand-ink-muted)]">
          Tag belum dipakai di artikel manapun.
        </p>
      </div>
    )
  }

  // Calculate font size based on count (min 12px, max 28px)
  const maxCount = Math.max(...usedTags.map((t) => t.count))
  const minCount = Math.min(...usedTags.map((t) => t.count))
  const range = Math.max(1, maxCount - minCount)

  const getFontSize = (count: number): number => {
    if (range === 0) return 18 // all same count
    const normalized = (count - minCount) / range
    return Math.round(12 + normalized * 16) // 12px to 28px
  }

  // Shuffle for visual interest (weighted by count — bigger tags stay prominent)
  const shuffled = [...usedTags].sort(() => Math.random() - 0.5)

  return (
    <ScrollReveal className="flex flex-wrap gap-2 items-center justify-center py-4">
      {shuffled.map((tag, i) => (
        <button
          key={tag.id}
          onClick={() => {
            setTagFilter(tag.name)
            setView('articles')
          }}
          className="tag-chip inline-flex items-center gap-1.5 px-3 py-1 border-2 font-condensed uppercase tracking-wider text-white transition-all hover:scale-110"
          style={{
            backgroundColor: tag.color,
            borderColor: tag.color,
            fontSize: `${getFontSize(tag.count)}px`,
            lineHeight: 1.2,
            animation: `tag-pop-in 0.4s ease-out ${i * 0.05}s backwards`,
          }}
          title={`${tag.name} — ${tag.count} artikel`}
        >
          {tag.name}
          <span
            className="text-[10px] bg-white/30 px-1 rounded-full"
            style={{ fontSize: '10px' }}
          >
            {tag.count}
          </span>
        </button>
      ))}
      <style>{`
        @keyframes tag-pop-in {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </ScrollReveal>
  )
}
