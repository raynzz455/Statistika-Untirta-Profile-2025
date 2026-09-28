'use client'

import { ArrowRight, ArrowUpRight, TrendingUp, Calendar } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { PlaceholderImage } from '@/components/PlaceholderImage'
import { ScrollReveal } from '@/components/ScrollReveal'
import { ActivityFeed } from '@/components/ActivityFeed'
import { Recommendations } from '@/components/Recommendations'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface Article {
  id: string
  title: string
  excerpt: string
  date: string
  author: string
  category: string
  imageUrl: string | null
}

export function HomeView() {
  const setView = useAppStore((s) => s.setView)
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/articles?limit=6')
      .then((r) => r.json())
      .then((d) => setArticles(d.articles || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const [spotlight, ...rest] = articles

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success('Terima kasih! Email Anda terdaftar untuk update.')
  }

  return (
    <div className="page-enter">
      {/* 3-column newspaper layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-6 items-start">

        {/* LEFT COLUMN — narrow (col-span-3) */}
        <div className="lg:col-span-3 flex flex-col gap-6 lg:border-r border-[var(--brand-border)] lg:pr-4">
          {rest[0] && (
            <div className="pb-4 border-b border-[var(--brand-border)]">
              <p className="font-condensed text-[9px] uppercase tracking-widest text-[var(--brand-orange)] mb-1">{rest[0].category}</p>
              <button onClick={() => setView('article-detail', rest[0].id)} className="text-left w-full">
                <h3 className="font-condensed text-lg font-semibold leading-tight mb-2 hover:text-[var(--brand-navy)] transition-colors">
                  {rest[0].title}
                </h3>
              </button>
              <p className="font-body text-[12px] text-[var(--brand-ink-muted)] leading-relaxed mb-3 line-clamp-3">{rest[0].excerpt}</p>
              <button onClick={() => setView('article-detail', rest[0].id)} className="font-condensed text-[10px] uppercase tracking-widest text-[var(--brand-navy)] hover:text-[var(--brand-orange)] flex items-center gap-1">
                BACA <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Secondary article 2 with thumbnail */}
          {rest[1] && (
            <div className="pb-4 border-b border-[var(--brand-border)]">
              <div className="flex gap-3 mb-2">
                <div className="flex-1">
                  <button onClick={() => setView('article-detail', rest[1].id)} className="text-left w-full">
                    <h3 className="font-condensed text-base font-semibold leading-tight mb-1 hover:text-[var(--brand-navy)]">{rest[1].title}</h3>
                  </button>
                  <p className="font-mono text-[10px] text-[var(--brand-ink-muted)] mb-1">{rest[1].date}</p>
                </div>
                <button onClick={() => setView('article-detail', rest[1].id)} className="w-16 h-16 flex-shrink-0 border border-[var(--brand-border)] overflow-hidden">
                  <PlaceholderImage alt={rest[1].title} src={rest[1].imageUrl || undefined} grayscale />
                </button>
              </div>
              <p className="font-body text-[11px] text-[var(--brand-ink-muted)] leading-relaxed line-clamp-2">{rest[1].excerpt}</p>
            </div>
          )}

          {/* Direktori CTA */}
          <button
            onClick={() => setView('directory')}
            className="bg-[var(--brand-ink)] text-[var(--brand-surface)] p-4 flex flex-col items-start hover:bg-[var(--brand-navy)] transition-colors group w-full"
          >
            <h4 className="font-serif italic text-xl leading-none mb-2 group-hover:text-[var(--brand-orange)] transition-colors">Direktori</h4>
            <div className="w-full border-t border-[var(--brand-surface)]/20 pt-1.5 flex justify-between items-center">
              <span className="font-condensed text-[10px] uppercase tracking-widest text-[var(--brand-surface)]/70">Angkatan '25</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </button>

          {/* Aspirasi CTA */}
          <button
            onClick={() => setView('aspirasi')}
            className="bg-[var(--brand-orange)] text-[var(--brand-surface)] p-4 flex flex-col items-start hover:brightness-95 transition-all group w-full border border-[var(--brand-navy)]"
          >
            <h4 className="font-serif italic text-xl leading-none mb-2 group-hover:text-[var(--brand-navy)] transition-colors">Aspirasi</h4>
            <p className="font-body text-[11px] leading-snug text-[var(--brand-surface)]/85 mb-2">
              Sampaikan suara, kritik, dan ide untuk angkatan. Tanpa login — cukup nama.
            </p>
            <div className="w-full border-t border-[var(--brand-surface)]/30 pt-1.5 flex justify-between items-center">
              <span className="font-condensed text-[10px] uppercase tracking-widest text-[var(--brand-surface)]/85">Awan Suara</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </button>
        </div>

        {/* CENTER COLUMN — wide (col-span-6) */}
        <div className="lg:col-span-6 flex flex-col">
          {/* Spotlight */}
          {spotlight ? (
            <div className="mb-6">
              <button onClick={() => setView('article-detail', spotlight.id)} className="block w-full mb-3">
                <div className="w-full aspect-[16/9] border border-[var(--brand-border)] overflow-hidden">
                  <PlaceholderImage alt={spotlight.title} src={spotlight.imageUrl || undefined} grayscale />
                </div>
              </button>
              <p className="font-mono text-[9px] text-right text-[var(--brand-ink-muted)] uppercase tracking-widest mb-2">Dokumentasi Tim Humas</p>
              <p className="font-condensed text-[10px] uppercase tracking-widest text-[var(--brand-orange)] mb-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> SPOTLIGHT
              </p>
              <button onClick={() => setView('article-detail', spotlight.id)} className="text-left w-full">
                <h2 className="font-serif text-2xl md:text-3xl leading-tight mb-3 hover:text-[var(--brand-navy)] transition-colors">
                  {spotlight.title}
                </h2>
              </button>
              <p className="font-body text-sm text-[var(--brand-ink-muted)] leading-relaxed mb-4">{spotlight.excerpt}</p>
              <div className="flex items-center justify-between border-t border-[var(--brand-border)] pt-2">
                <p className="font-mono text-[10px] text-[var(--brand-ink-muted)]">{spotlight.author} • {spotlight.date}</p>
                <button onClick={() => setView('article-detail', spotlight.id)} className="font-condensed text-[10px] uppercase tracking-widest text-[var(--brand-navy)] hover:text-[var(--brand-orange)] flex items-center gap-1">
                  BACA <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : loading ? (
            <div className="space-y-3 mb-6">
              <div className="aspect-[16/9] skeleton-shimmer" />
              <div className="h-8 skeleton-shimmer w-2/3" />
              <div className="h-4 skeleton-shimmer" />
            </div>
          ) : null}

          {/* Divider */}
          <div className="border-t-2 border-[var(--brand-ink)] mb-4" />

          {/* Secondary article cards — 2-column grid for filler */}
          {rest.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rest.slice(0, 4).map((a) => (
                <button
                  key={a.id}
                  onClick={() => setView('article-detail', a.id)}
                  className="text-left border border-[var(--brand-border)] p-3 hover:border-[var(--brand-navy)] hover:bg-[var(--brand-surface-2)] transition-all group"
                >
                  <p className="font-condensed text-[9px] uppercase tracking-widest text-[var(--brand-orange)] mb-1">{a.category}</p>
                  <h4 className="font-serif text-sm font-semibold leading-tight mb-1 group-hover:text-[var(--brand-navy)] line-clamp-2">
                    {a.title}
                  </h4>
                  <p className="font-mono text-[9px] text-[var(--brand-ink-muted)]">{a.date}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN — narrow (col-span-3) */}
        <div className="lg:col-span-3 flex flex-col gap-4 lg:border-l border-[var(--brand-border)] lg:pl-4">
          {/* Agenda box */}
          <button
            onClick={() => setView('events')}
            className="bg-[var(--brand-navy)] text-[var(--brand-surface)] p-4 text-left hover:bg-[var(--brand-navy-light)] transition-colors block w-full"
          >
            <p className="font-condensed text-[9px] uppercase tracking-widest text-[var(--brand-orange)] mb-1 flex items-center gap-1">
              <Calendar className="w-2.5 h-2.5" /> AGENDA TERBARU
            </p>
            <h4 className="font-condensed text-base uppercase tracking-wide leading-tight mb-1">Jadwal UTS Telah Rilis!</h4>
            <p className="font-body text-[11px] text-[var(--brand-surface)]/70 mb-2">Dimulai Senin, 28 Oktober</p>
            <span className="inline-block border border-[var(--brand-surface)]/30 px-2.5 py-1 font-condensed text-[9px] uppercase tracking-widest">
              LIHAT JADWAL →
            </span>
          </button>

          {/* Kilas Balik */}
          {rest.length > 2 && (
            <div className="mb-4">
              <p className="font-condensed text-[9px] uppercase tracking-widest text-[var(--brand-ink-muted)] mb-2 border-b border-[var(--brand-border)] pb-1">
                KILAS BALIK
              </p>
              {rest.slice(2, 5).map((a) => (
                <button
                  key={a.id}
                  onClick={() => setView('article-detail', a.id)}
                  className="block w-full text-left py-2 border-b border-[var(--brand-border)] last:border-0 hover:bg-[var(--brand-surface-2)] -mx-1 px-1 transition-colors"
                >
                  <h5 className="font-body text-[12px] leading-tight hover:text-[var(--brand-navy)] transition-colors line-clamp-2 mb-0.5">{a.title}</h5>
                  <p className="font-mono text-[9px] text-[var(--brand-ink-muted)]">{a.date}</p>
                </button>
              ))}
            </div>
          )}

          {/* Newsletter */}
          <form onSubmit={subscribe} className="bg-[var(--brand-surface-2)] border border-[var(--brand-border)] p-3">
            <h4 className="font-condensed text-xs uppercase tracking-widest mb-0.5 text-[var(--brand-navy)]">Berlangganan</h4>
            <p className="font-body text-[10px] text-[var(--brand-ink-muted)] mb-2">Update via email.</p>
            <input
              type="email"
              required
              placeholder="email@anda.com"
              className="w-full border border-[var(--brand-border)] p-1.5 text-xs font-body mb-2 focus:outline-none focus:border-[var(--brand-navy)] bg-[var(--brand-surface)]"
            />
            <button
              type="submit"
              className="w-full bg-[var(--brand-navy)] text-[var(--brand-surface)] font-condensed uppercase tracking-widest text-[10px] py-2 hover:bg-[var(--brand-navy-light)] flex items-center justify-center gap-1"
            >
              <ArrowUpRight className="w-2.5 h-2.5" /> DAFTAR
            </button>
          </form>
        </div>
      </div>

      {/* === FULL-WIDTH ACTIVITY + RECOMMENDATIONS === */}
      {/* Moved out of 3-column grid to give them more horizontal space */}
      <div className="mt-10">
        {/* Section header */}
        <div className="border-t-2 border-b border-[var(--brand-ink)] py-3 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-2xl md:text-3xl text-[var(--brand-ink)]">
              Aktivitas <span className="italic text-[var(--brand-navy)]">&amp; Rekomendasi</span>
            </h2>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--brand-ink-muted)] hidden md:block">
            EDISI BERJALAN
          </p>
        </div>

        {/* Activity Feed + Recommendations — side by side, full width */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ActivityFeed />
          <Recommendations />
        </div>
      </div>
    </div>
  )
}
