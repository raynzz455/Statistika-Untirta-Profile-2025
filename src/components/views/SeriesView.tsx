'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { PlaceholderImage } from '@/components/PlaceholderImage'
import { ScrollReveal } from '@/components/ScrollReveal'
import { ImageUploader } from '@/components/ImageUploader'
import { BookOpen, Plus, X, Layers, Calendar, User } from 'lucide-react'
import { toast } from 'sonner'

interface SeriesItem {
  id: string
  title: string
  description: string | null
  imageUrl: string | null
  creator: { id: string; username: string; displayName: string | null }
  count: number
  createdAt: string
}

export function SeriesView() {
  const user = useAppStore((s) => s.user)
  const setView = useAppStore((s) => s.setView)
  const [series, setSeries] = useState<SeriesItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', imageUrl: '' })

  const load = () => {
    setLoading(true)
    // cache: 'no-store' — bypass browser cache so series list always
    // shows fresh data after create/edit.
    fetch('/api/series', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setSeries(Array.isArray(d.series) ? d.series : []))
      .catch(() => setSeries([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error('Judul series wajib diisi.')
      return
    }
    const res = await fetch('/api/series', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const d = await res.json()
    if (d.error) {
      toast.error(d.error)
      return
    }
    toast.success('Series dibuat! Tambahkan artikel ke series ini.')
    setForm({ title: '', description: '', imageUrl: '' })
    setShowAdd(false)
    load()
  }

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    } catch { return iso }
  }

  return (
    <div className="max-w-5xl mx-auto page-enter">
      <div className="mb-12 pb-6 border-b-2 border-[var(--brand-ink)]">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h1 className="text-5xl font-serif font-black uppercase mb-4 text-[var(--brand-ink)]">
              Series <span className="italic text-[var(--brand-maroon)]">Artikel</span>
            </h1>
            <p className="uppercase tracking-widest text-sm font-bold text-[var(--brand-ink)]/70">
              Kumpulan artikel terkait dalam satu seri
            </p>
          </div>
          {user && (
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="inline-flex items-center gap-2 bg-[var(--brand-ink)] text-white px-4 py-2 font-condensed uppercase tracking-widest text-xs font-bold hover:bg-[var(--brand-maroon)] transition-colors flex-shrink-0"
            >
              {showAdd ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showAdd ? 'Tutup' : 'Buat Series'}
            </button>
          )}
        </div>
      </div>

      {/* Add series form */}
      {showAdd && user && (
        <form onSubmit={submit} className="mb-8 border border-[var(--brand-ink)] p-6 bg-[var(--brand-surface-2)] shadow-hard">
          <h3 className="font-condensed text-xl uppercase mb-4">Buat Series Baru</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-condensed uppercase font-bold mb-1">Judul Series</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-[var(--brand-ink)] p-2 text-sm bg-[var(--brand-surface)]"
                placeholder="cth: Persiapan Ujian Semester Ganjil"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-condensed uppercase font-bold mb-1">Deskripsi (opsional)</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full border border-[var(--brand-ink)] p-2 text-sm bg-[var(--brand-surface)] resize-none"
                placeholder="Deskripsi singkat tentang series ini..."
              />
            </div>
            <div className="md:col-span-2">
              <ImageUploader
                value={form.imageUrl}
                onChange={(url) => setForm({ ...form, imageUrl: url })}
                label="Gambar Cover (opsional)"
                hint="Upload file (drag & drop juga bisa) atau tempel URL gambar. Otomatis diresize + convert ke WebP."
                altText={form.title || 'Cover series'}
                grayscale
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => { setShowAdd(false); setForm({ title: '', description: '', imageUrl: '' }) }}
              className="px-4 py-2 text-xs uppercase font-condensed text-[var(--brand-ink-muted)] hover:text-[var(--brand-ink)]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[var(--brand-ink)] text-white text-xs uppercase font-condensed hover:bg-[var(--brand-maroon)]"
            >
              Buat Series
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border border-[var(--brand-ink)] bg-[var(--brand-surface-2)]">
              <div className="aspect-[4/3] skeleton-shimmer" />
              <div className="p-5 space-y-3">
                <div className="skeleton-shimmer h-5 w-3/4" />
                <div className="skeleton-shimmer h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : series.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-[var(--brand-ink)]/30">
          <Layers className="w-12 h-12 mx-auto mb-4 text-[var(--brand-ink-muted)]/50" />
          <p className="font-serif italic text-2xl text-[var(--brand-ink)]/50 mb-2">Belum ada series</p>
          <p className="text-sm text-[var(--brand-ink-muted)]">
            {user ? 'Buat series pertama untuk mengelompokkan artikel terkait!' : 'Login untuk membuat series.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {series.map((s, i) => (
            <ScrollReveal
              key={s.id}
              delay={((i % 3) + 1) as 1 | 2 | 3}
              as="button"
              onClick={() => setView('series-detail', s.id)}
              className="flex flex-col border border-[var(--brand-ink)] bg-[var(--brand-surface-2)] shadow-hard group lift-on-hover text-left"
            >
              <div className="p-3 border-b border-[var(--brand-ink)]">
                <div className="relative overflow-hidden border border-[var(--brand-ink)] aspect-[4/3]">
                  <PlaceholderImage alt={s.title} src={s.imageUrl || undefined} grayscale />
                  <div className="absolute top-2 left-2 bg-[var(--brand-orange)]/15 border border-[var(--brand-ink)] px-2 py-0.5 text-[9px] uppercase tracking-widest font-bold  flex items-center gap-1">
                    <Layers className="w-2.5 h-2.5" /> Series
                  </div>
                  <div className="absolute bottom-2 right-2 bg-[var(--brand-ink)] text-[var(--brand-surface)] px-2 py-0.5 text-[10px] uppercase tracking-widest font-condensed">
                    {s.count} artikel
                  </div>
                </div>
              </div>
              <div className="p-5 flex flex-col flex-grow">
                <h3 className="font-serif font-bold text-xl mb-2 leading-tight line-clamp-2 group-hover:text-[var(--brand-orange)] transition-colors">{s.title}</h3>
                {s.description && (
                  <p className="text-sm text-[var(--brand-ink)]/80 mb-4 flex-grow line-clamp-2">{s.description}</p>
                )}
                <div className="mt-auto border-t border-dashed border-[var(--brand-ink)]/30 pt-3 flex items-center justify-between text-[11px] text-[var(--brand-ink-muted)]">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" /> {s.creator?.displayName || s.creator?.username || 'Unknown'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {formatDate(s.createdAt)}
                  </span>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      )}
    </div>
  )
}
