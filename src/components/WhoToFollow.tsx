'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { PlaceholderImage } from '@/components/PlaceholderImage'
import { ScrollReveal } from '@/components/ScrollReveal'
import { UserPlus, Users } from 'lucide-react'

interface Suggestion {
  id: string
  username: string
  displayName: string | null
  role: string
  reason: string
}

export function WhoToFollow() {
  const setView = useAppStore((s) => s.setView)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/users/suggestions')
      .then((r) => r.json())
      .then((d) => setSuggestions(d.suggestions || []))
      .catch(() => setSuggestions([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <ScrollReveal delay={3} className="border border-[var(--brand-ink)] bg-[var(--brand-surface-2)] shadow-hard">
        <div className="bg-[var(--brand-ink)] text-[var(--brand-surface)] px-4 py-3">
          <h3 className="font-condensed text-sm uppercase tracking-widest font-bold flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[var(--brand-orange)]" /> Saran Mengikuti
          </h3>
        </div>
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
      </ScrollReveal>
    )
  }

  if (suggestions.length === 0) return null

  return (
    <ScrollReveal delay={3} className="border border-[var(--brand-ink)] bg-[var(--brand-surface-2)] shadow-hard">
      <div className="bg-[var(--brand-ink)] text-[var(--brand-surface)] px-4 py-3 flex items-center justify-between">
        <h3 className="font-condensed text-sm uppercase tracking-widest font-bold flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-[var(--brand-orange)]" /> Saran Mengikuti
        </h3>
        <span className="text-[10px] uppercase tracking-widest font-condensed text-[var(--brand-surface)]/60">
          {suggestions.length} anggota
        </span>
      </div>

      <div className="p-2 space-y-1">
        {suggestions.map((s, i) => (
          <ScrollReveal
            key={s.id}
            delay={((i % 3) + 1) as 1 | 2 | 3}
            as="button"
            onClick={() => setView('member-profile', s.id)}
            className="w-full text-left flex items-center gap-3 p-2 hover:bg-[var(--brand-surface-3)] transition-colors border-b border-[var(--brand-border)] last:border-0 group"
          >
            {/* Avatar */}
            <div className="w-10 h-10 flex-shrink-0 border border-[var(--brand-ink)] rounded-full overflow-hidden">
              <PlaceholderImage
                alt={`Foto ${s.displayName || s.username}`}
                src={undefined}
                grayscale
              />
            </div>

            {/* Info */}
            <div className="flex-grow min-w-0">
              <p className="font-serif font-bold text-sm leading-tight group-hover:text-[var(--brand-orange)] transition-colors truncate">
                {s.displayName || s.username}
              </p>
              <p className="text-[10px] uppercase tracking-widest font-condensed text-[var(--brand-ink-muted)] truncate">
                @{s.username}
              </p>
              <p className="text-[9px] italic text-[var(--brand-orange)] truncate mt-0.5">
                {s.reason}
              </p>
            </div>

            {/* Follow icon */}
            <UserPlus className="w-4 h-4 text-[var(--brand-ink-muted)] flex-shrink-0 group-hover:text-[var(--brand-orange)] transition-colors" />
          </ScrollReveal>
        ))}
      </div>
    </ScrollReveal>
  )
}
