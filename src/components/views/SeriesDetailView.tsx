'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { PlaceholderImage } from '@/components/PlaceholderImage'
import { ScrollReveal } from '@/components/ScrollReveal'
import { ArrowLeft, ArrowRight, Layers, Calendar, User, Trash2, X, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface SeriesArticle {
  id: string
  title: string
  excerpt: string
  date: string
  author: string
  category: string
  imageUrl: string | null
  published: boolean
}

interface SeriesDetail {
  id: string
  title: string
  description: string | null
  imageUrl: string | null
  creator: { id: string; username: string; displayName: string | null; role: string }
  createdAt: string
  items: { id: string; order: number; article: SeriesArticle }[]
}

export function SeriesDetailView() {
  const selectedId = useAppStore((s) => s.selectedId)
  const user = useAppStore((s) => s.user)
  const setView = useAppStore((s) => s.setView)
  const [series, setSeries] = useState<SeriesDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showManage, setShowManage] = useState(false)
  const [availableArticles, setAvailableArticles] = useState<SeriesArticle[]>([])

  const load = () => {
    if (!selectedId) {
      setLoading(false)
      return
    }
    setLoading(true)
    fetch(`/api/series/${selectedId}`)
      .then((r) => r.json())
      .then((d) => setSeries(d.series || null))
      .catch(() => setSeries(null))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [selectedId])

  const loadAvailable = () => {
    fetch('/api/articles?limit=50')
      .then((r) => r.json())
      .then((d) => setAvailableArticles(d.articles || []))
      .catch(() => setAvailableArticles([]))
  }

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    } catch { return iso }
  }

  const removeArticle = async (articleId: string) => {
    if (!series) return
    const newArticleIds = series.items
      .filter((item) => item.article.id !== articleId)
      .map((item) => item.article.id)
    const res = await fetch(`/api/series/${series.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleIds: newArticleIds }),
    })
    if (res.ok) {
      toast.success('Artikel dihapus dari series.')
      load()
    }
  }

  const addArticle = async (articleId: string) => {
    if (!series) return
    const newArticleIds = [...series.items.map((i) => i.article.id), articleId]
    const res = await fetch(`/api/series/${series.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleIds: newArticleIds }),
    })
    if (res.ok) {
      toast.success('Artikel ditambahkan ke series.')
      load()
      loadAvailable()
    }
  }

  const deleteSeries = async () => {
    if (!series) return
    if (!confirm(`Hapus series "${series.title}"? Artikel di dalamnya tidak akan dihapus.`)) return
    const res = await fetch(`/api/series/${series.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Series dihapus.')
      setView('series')
    }
  }

  const canManage = user && series && (user.id === series.creator.id || user.role === 'admin')

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="h-8 skeleton-shimmer mb-4 w-1/3" />
        <div className="aspect-[16/9] skeleton-shimmer mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton-shimmer h-16" />
          ))}
        </div>
      </div>
    )
  }

  if (!series) {
    return (
      <div className="max-w-md mx-auto text-center py-20 border border-[var(--brand-ink)] bg-[var(--brand-surface-2)] p-8">
        <Layers className="w-12 h-12 mx-auto mb-4 text-[var(--brand-ink-muted)]" />
        <h2 className="font-serif text-3xl mb-2">Series tidak ditemukan</h2>
        <button onClick={() => setView('series')} className="text-[var(--brand-orange)] underline">
          Kembali ke Daftar Series
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto page-enter">
      <button
        onClick={() => setView('series')}
        className="inline-flex items-center text-xs uppercase tracking-widest font-bold mb-8 hover:text-[var(--brand-maroon)] transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Series
      </button>

      {/* Series header */}
      <ScrollReveal className="border-2 border-[var(--brand-ink)] bg-[var(--brand-surface-2)] shadow-hard-lg overflow-hidden mb-8">
        {series.imageUrl && (
          <div className="w-full aspect-[16/6] border-b border-[var(--brand-ink)]">
            <PlaceholderImage alt={series.title} src={series.imageUrl} grayscale />
          </div>
        )}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] uppercase tracking-widest font-condensed bg-[var(--brand-orange)]/15 border border-[var(--brand-ink)] px-2 py-0.5 flex items-center gap-1">
              <Layers className="w-3 h-3" /> Series
            </span>
            <span className="text-[10px] uppercase tracking-widest font-condensed bg-[var(--brand-ink)] text-[var(--brand-surface)] px-2 py-0.5">
              {series.items.length} artikel
            </span>
          </div>
          <h1 className="font-serif text-4xl font-bold mb-2 leading-tight">{series.title}</h1>
          {series.description && (
            <p className="font-serif italic text-lg text-[var(--brand-ink-muted)] mb-4">{series.description}</p>
          )}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4 text-xs text-[var(--brand-ink-muted)]">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" /> {series.creator.displayName || series.creator.username}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {formatDate(series.createdAt)}
              </span>
            </div>
            {canManage && (
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowManage(!showManage); if (!showManage) loadAvailable() }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] uppercase tracking-widest font-condensed border border-[var(--brand-ink)] bg-[var(--brand-surface)] hover:bg-[var(--brand-orange)]/15 transition-colors"
                >
                  {showManage ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  {showManage ? 'Tutup Kelola' : 'Kelola Artikel'}
                </button>
                <button
                  onClick={deleteSeries}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] uppercase tracking-widest font-condensed border border-[var(--brand-maroon)] text-[var(--brand-maroon)] hover:bg-[var(--brand-maroon)] hover:text-white transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> Hapus Series
                </button>
              </div>
            )}
          </div>
        </div>
      </ScrollReveal>

      {/* Manage articles section */}
      {showManage && canManage && (
        <ScrollReveal delay={1} className="mb-8 border border-[var(--brand-ink)] p-4 bg-[var(--brand-surface-2)] shadow-hard">
          <h3 className="font-condensed text-lg uppercase mb-3">Tambah Artikel ke Series</h3>
          {availableArticles.length === 0 ? (
            <p className="text-sm text-[var(--brand-ink-muted)] italic">Tidak ada artikel tersedia.</p>
          ) : (
            <div className="max-h-[300px] overflow-y-auto custom-scroll space-y-2">
              {availableArticles
                .filter((a) => !series.items.some((item) => item.article.id === a.id))
                .map((a) => (
                  <div key={a.id} className="flex items-center gap-3 border border-[var(--brand-border)] p-2 hover:bg-[var(--brand-surface-3)]">
                    <div className="w-12 h-12 flex-shrink-0 border border-[var(--brand-ink)]">
                      <PlaceholderImage alt={a.title} src={a.imageUrl || undefined} grayscale />
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="font-serif font-bold text-sm line-clamp-1">{a.title}</p>
                      <p className="text-[10px] text-[var(--brand-ink-muted)]">{a.category} • {a.date}</p>
                    </div>
                    <button
                      onClick={() => addArticle(a.id)}
                      className="px-2 py-1 text-[10px] uppercase tracking-widest font-condensed bg-[var(--brand-ink)] text-[var(--brand-surface)] hover:bg-[var(--brand-maroon)] flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Tambah
                    </button>
                  </div>
                ))}
            </div>
          )}
        </ScrollReveal>
      )}

      {/* Articles in series */}
      <div className="space-y-3">
        {series.items.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-[var(--brand-ink)]/30">
            <Layers className="w-10 h-10 mx-auto mb-3 text-[var(--brand-ink-muted)]/50" />
            <p className="font-serif italic text-[var(--brand-ink-muted)]">
              {canManage ? 'Belum ada artikel. Klik "Kelola Artikel" untuk menambah.' : 'Series ini belum berisi artikel.'}
            </p>
          </div>
        ) : (
          series.items.map((item, i) => (
            <ScrollReveal
              key={item.id}
              delay={((i % 4) + 1) as 1 | 2 | 3 | 4}
              as="button"
              onClick={() => setView('article-detail', item.article.id)}
              className="w-full text-left flex items-center gap-4 border border-[var(--brand-ink)] p-4 bg-[var(--brand-surface-2)] hover:shadow-hard transition-shadow group lift-on-hover"
            >
              {/* Order number */}
              <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center font-condensed text-2xl border-2 border-[var(--brand-ink)] bg-[var(--brand-orange)]/15">
                {i + 1}
              </div>

              {/* Thumbnail */}
              <div className="w-16 h-16 flex-shrink-0 border border-[var(--brand-ink)]">
                <PlaceholderImage alt={item.article.title} src={item.article.imageUrl || undefined} grayscale />
              </div>

              {/* Content */}
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] uppercase tracking-widest font-condensed bg-[var(--brand-orange)]/15 border border-[var(--brand-ink)] px-1.5 py-0.5">
                    {item.article.category}
                  </span>
                  <span className="text-[10px] text-[var(--brand-ink-muted)]">{item.article.date}</span>
                </div>
                <h3 className="font-serif font-bold text-base leading-tight line-clamp-1 group-hover:text-[var(--brand-orange)] transition-colors">
                  {item.article.title}
                </h3>
                <p className="text-xs text-[var(--brand-ink-muted)] line-clamp-1 mt-0.5">{item.article.excerpt}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {canManage && (
                  <button
                    onClick={(e) => { e.stopPropagation(); removeArticle(item.article.id) }}
                    className="p-1.5 text-[var(--brand-ink-muted)] hover:text-[var(--brand-maroon)] transition-colors"
                    title="Hapus dari series"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <ArrowRight className="w-4 h-4 text-[var(--brand-ink-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </ScrollReveal>
          ))
        )}
      </div>
    </div>
  )
}
