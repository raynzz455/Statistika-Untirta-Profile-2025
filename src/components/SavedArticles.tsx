'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { PlaceholderImage } from '@/components/PlaceholderImage'
import { Bookmark, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface SavedArticle {
  id: string
  title: string
  excerpt: string
  date: string
  author: string
  category: string
  imageUrl: string | null
  published: boolean
}

export function SavedArticles() {
  const setView = useAppStore((s) => s.setView)
  const [articles, setArticles] = useState<SavedArticle[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    fetch('/api/bookmarks')
      .then((r) => r.json())
      .then((d) => setArticles(d.articles || []))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const remove = async (id: string) => {
    try {
      await fetch(`/api/articles/${id}/bookmark`, { method: 'POST' })
      setArticles((prev) => prev.filter((a) => a.id !== id))
      toast.success('Bookmark dihapus.')
    } catch {
      toast.error('Gagal menghapus bookmark.')
    }
  }

  return (
    <div className="mt-8 border-t-2 border-dashed border-[var(--brand-ink)] pt-8">
      <h2 className="font-condensed text-2xl uppercase tracking-tight flex items-center gap-2 mb-4">
        <Bookmark className="w-5 h-5 text-[var(--brand-orange)] fill-current" />
        Artikel Tersimpan
        <span className="text-sm text-[var(--brand-ink-muted)] font-normal ml-1">({articles.length})</span>
      </h2>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="border border-[var(--brand-border)] p-3 bg-[var(--brand-surface-2)] flex gap-3">
              <div className="w-16 h-16 bg-[var(--brand-orange)]/15/40 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[var(--brand-orange)]/15/40 animate-pulse w-2/3" />
                <div className="h-3 bg-[var(--brand-orange)]/15/40 animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-[var(--brand-ink)]/30 bg-[var(--brand-surface-2)]">
          <Bookmark className="w-10 h-10 mx-auto mb-3 text-[var(--brand-ink-muted)]/50" />
          <p className="font-serif italic text-lg text-[var(--brand-ink-muted)] mb-1">
            Belum ada artikel tersimpan
          </p>
          <p className="text-sm text-[var(--brand-ink-muted)] mb-4">
            Klik tombol "Simpan" di halaman artikel untuk menyimpannya di sini.
          </p>
          <button
            onClick={() => setView('articles')}
            className="inline-flex items-center gap-2 bg-[var(--brand-ink)] text-white px-4 py-2 font-condensed uppercase tracking-widest text-xs font-bold hover:bg-[var(--brand-maroon)]"
          >
            Jelajahi Artikel →
          </button>
        </div>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scroll">
          {articles.map((a) => (
            <div
              key={a.id}
              className="flex gap-3 border border-[var(--brand-ink)] p-3 bg-[var(--brand-surface-2)] hover:bg-[var(--brand-surface-3)] transition-colors group"
            >
              <button
                onClick={() => setView('article-detail', a.id)}
                className="w-16 h-16 flex-shrink-0 border border-[var(--brand-ink)]"
              >
                <PlaceholderImage alt={a.title} src={a.imageUrl || undefined} grayscale />
              </button>
              <div className="flex-grow min-w-0">
                <button
                  onClick={() => setView('article-detail', a.id)}
                  className="text-left w-full"
                >
                  <p className="font-serif font-bold text-sm leading-tight hover:text-[var(--brand-orange)] line-clamp-2 mb-1">
                    {a.title}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-[var(--brand-ink-muted)]">
                    {a.category} • {a.date} • {a.author}
                  </p>
                </button>
              </div>
              <button
                onClick={() => remove(a.id)}
                className="self-start p-1.5 text-[var(--brand-ink-muted)] hover:text-[var(--brand-maroon)] transition-colors"
                title="Hapus dari simpanan"
                aria-label="Hapus bookmark"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
