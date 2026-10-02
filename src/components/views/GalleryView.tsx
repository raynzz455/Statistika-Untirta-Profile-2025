'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { PlaceholderImage } from '@/components/PlaceholderImage'
import { ImageUploader } from '@/components/ImageUploader'
import { Pagination } from '@/components/Pagination'
import { Lightbox, type LightboxItem } from '@/components/Lightbox'
import { Trash2, Plus, X, Maximize2, Calendar, User } from 'lucide-react'
import { toast } from 'sonner'

interface GalleryItem {
  id: string
  caption: string
  category: string
  imageUrl: string
  createdAt?: string
  uploaderId?: string
}

const TABS = ['Semua', 'Makrab 2025', 'Kuliah', 'Kampus', 'Ospek', 'Random']

export function GalleryView() {
  const user = useAppStore((s) => s.user)
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Semua')
  const [showAdd, setShowAdd] = useState(false)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 9
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [detailItem, setDetailItem] = useState<GalleryItem | null>(null)
  const [form, setForm] = useState({ caption: '', category: 'Umum', imageUrl: '' })

  const load = () => {
    setLoading(true)
    // cache: 'no-store' — bypass browser cache so gallery always shows
    // fresh photos after a user uploads new ones.
    fetch('/api/gallery', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d.items) ? d.items : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = activeTab === 'Semua' ? items : items.filter((i) => i.category === activeTab)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  useEffect(() => {
    if (page > totalPages) setPage(1)
  }, [totalPages, page])
  useEffect(() => setPage(1), [activeTab])
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.caption || !form.imageUrl) {
      toast.error('Caption dan URL gambar wajib diisi.')
      return
    }
    const res = await fetch('/api/gallery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const d = await res.json()
    if (d.error) {
      toast.error(d.error)
      return
    }
    toast.success('Foto galeri ditambahkan!')
    setForm({ caption: '', category: 'Umum', imageUrl: '' })
    setShowAdd(false)
    load()
  }

  const remove = async (id: string) => {
    if (!confirm('Hapus foto ini dari galeri?')) return
    const res = await fetch(`/api/gallery/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Foto dihapus.')
      load()
    }
  }

  return (
    <div className="max-w-6xl mx-auto page-enter">
      <div className="flex flex-col items-center mb-12 text-center">
        <h1 className="text-5xl font-serif font-black uppercase mb-4 text-[var(--brand-ink)]">
          Galeri <span className="italic text-[var(--brand-navy)]">Momen</span>
        </h1>
        <p className="uppercase tracking-widest text-sm font-bold text-[var(--brand-ink)]/70">
          Kumpulan memori hitam-putih Statistika '25
        </p>
        {user && (
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="mt-4 inline-flex items-center gap-2 bg-[var(--brand-ink)] text-white px-4 py-2 font-condensed uppercase tracking-widest text-xs font-bold hover:bg-[var(--brand-maroon)] transition-colors"
          >
            {showAdd ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAdd ? 'Tutup Form' : 'Tambah Foto'}
          </button>
        )}
      </div>

      {showAdd && user && (
        <form
          onSubmit={submit}
          className="mb-8 max-w-2xl mx-auto border border-[var(--brand-ink)] p-6 bg-[var(--brand-surface-2)] shadow-hard"
        >
          <h3 className="font-condensed text-xl uppercase mb-4">Tambah Foto Galeri</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-condensed uppercase font-bold mb-1">Caption</label>
              <input
                type="text"
                value={form.caption}
                onChange={(e) => setForm({ ...form, caption: e.target.value })}
                className="w-full border border-[var(--brand-ink)] p-2 text-sm bg-[var(--brand-surface)]"
                placeholder="Ospek Jurusan 2025"
              />
            </div>
            <div>
              <label className="block text-xs font-condensed uppercase font-bold mb-1">Kategori</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-[var(--brand-ink)] p-2 text-sm bg-[var(--brand-surface)]"
              >
                <option value="Umum">Umum</option>
                <option value="Makrab 2025">Makrab 2025</option>
                <option value="Kuliah">Kuliah</option>
                <option value="Kampus">Kampus</option>
                <option value="Ospek">Ospek</option>
                <option value="Random">Random</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <ImageUploader
                value={form.imageUrl}
                onChange={(url) => setForm({ ...form, imageUrl: url })}
                label="Foto Galeri (wajib untuk hasil terbaik)"
                hint="Upload file (drag & drop juga bisa) atau tempel URL gambar. Otomatis diresize."
                altText={form.caption || 'Foto galeri'}
                grayscale
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 text-xs uppercase font-condensed text-[var(--brand-ink-muted)] hover:text-[var(--brand-ink)]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[var(--brand-ink)] text-white text-xs uppercase font-condensed hover:bg-black"
            >
              Tambah Foto
            </button>
          </div>
        </form>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {TABS.map((tab, idx) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 border border-[var(--brand-ink)] text-xs uppercase tracking-widest font-bold ${
              activeTab === tab ? 'bg-[var(--brand-ink)] text-white' : 'bg-[var(--brand-surface)] text-[var(--brand-ink)] hover:bg-[var(--brand-surface-3)]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="break-inside-avoid border border-[var(--brand-ink)] p-2 bg-[var(--brand-surface-2)]">
              <div className="aspect-[4/3] bg-[var(--brand-orange)]/15/40 animate-pulse mb-2" />
              <div className="h-3 bg-[var(--brand-orange)]/15/40 animate-pulse" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-[var(--brand-ink)]/30">
          <p className="font-serif italic text-2xl text-[var(--brand-ink)]/50 mb-2">Belum ada foto di kategori ini</p>
          <p className="text-sm text-[var(--brand-ink-muted)]">Pilih kategori lain atau tambah foto baru.</p>
        </div>
      ) : (
        <>
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {paged.map((img, i) => {
            // Vary aspect ratios for masonry-style visual interest
            const aspects = ['aspect-[4/3]', 'aspect-[3/4]', 'aspect-[1/1]', 'aspect-[4/5]', 'aspect-[5/4]', 'aspect-[3/4]']
            const aspect = aspects[i % aspects.length]
            return (
              <div
                key={img.id}
                className="break-inside-avoid border border-[var(--brand-ink)] p-2 bg-[var(--brand-surface-2)] shadow-hard group relative lift-on-hover"
              >
                <div
                  className={`relative overflow-hidden border border-[var(--brand-border)] mb-2 ${aspect} cursor-pointer`}
                  onClick={() => setDetailItem(img)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDetailItem(img) }
                  }}
                >
                  <PlaceholderImage alt={img.caption} src={img.imageUrl} grayscale />
                  <div className="absolute top-2 left-2 bg-[var(--brand-surface-3)] border border-[var(--brand-ink)] px-2 py-0.5 text-[9px] uppercase tracking-widest font-bold ">
                    {img.category}
                  </div>
                  {img.imageUrl && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--brand-surface)] text-[var(--brand-ink)] px-3 py-1.5 text-[10px] uppercase tracking-widest font-condensed flex items-center gap-1 border border-[var(--brand-ink)] shadow-hard">
                        <Maximize2 className="w-3 h-3" /> Lihat
                      </div>
                    </div>
                  )}
                  {user && user.role === 'admin' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        remove(img.id)
                      }}
                      className="absolute top-2 right-2 bg-[var(--brand-maroon)] text-white p-1.5 hover:bg-red-700 transition-colors z-10"
                      aria-label="Hapus"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <p className="font-serif italic text-sm text-center py-1">{img.caption}</p>
              </div>
            )
          })}
        </div>
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          total={filtered.length}
          pageSize={PAGE_SIZE}
        />
        </>
      )}

      {/* Gallery detail modal — pop-up per item */}
      {detailItem && (
        <div
          className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4"
          onClick={() => setDetailItem(null)}
        >
          <div
            className="bg-[var(--brand-surface)] border border-[var(--brand-ink)] max-w-3xl w-full max-h-[90vh] overflow-y-auto custom-scroll"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image area */}
            <div className="relative border-b border-[var(--brand-border)]">
              <div className="aspect-[16/10] overflow-hidden">
                <PlaceholderImage alt={detailItem.caption} src={detailItem.imageUrl} grayscale />
              </div>
              <button
                onClick={() => setDetailItem(null)}
                className="absolute top-3 right-3 bg-[var(--brand-surface)] border border-[var(--brand-ink)] p-1.5 hover:bg-[var(--brand-surface-2)]"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
              {detailItem.imageUrl && (
                <button
                  onClick={() => {
                    const fullIdx = filtered.findIndex((f) => f.id === detailItem.id)
                    setLightboxIndex(fullIdx >= 0 ? fullIdx : 0)
                    setDetailItem(null)
                  }}
                  className="absolute top-3 left-3 bg-[var(--brand-surface)] border border-[var(--brand-ink)] px-3 py-1.5 text-[10px] uppercase tracking-widest font-condensed hover:bg-[var(--brand-surface-2)] flex items-center gap-1"
                >
                  <Maximize2 className="w-3 h-3" /> Perbesar
                </button>
              )}
            </div>

            {/* Details */}
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-[var(--brand-navy)]/10 border border-[var(--brand-navy)]/30 px-2 py-0.5 text-[10px] uppercase tracking-widest font-condensed text-[var(--brand-navy)]">
                  {detailItem.category}
                </span>
                {detailItem.createdAt && (
                  <span className="text-[10px] font-mono text-[var(--brand-ink-muted)] flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(detailItem.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                )}
              </div>

              <h2 className="font-serif text-2xl leading-tight">{detailItem.caption}</h2>

              {user && user.role === 'admin' && (
                <button
                  onClick={() => { remove(detailItem.id); setDetailItem(null) }}
                  className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-condensed border border-[var(--brand-maroon)] text-[var(--brand-maroon)] px-3 py-1.5 hover:bg-[var(--brand-maroon)] hover:text-white transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> Hapus Foto
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox (fullscreen zoom) */}
      <Lightbox
        items={filtered
          .filter((img) => img.imageUrl)
          .map((img) => ({ id: img.id, src: img.imageUrl, alt: img.caption, caption: img.caption, category: img.category }))}
        index={(() => {
          if (lightboxIndex === null) return null
          const withImages = filtered.filter((img) => img.imageUrl)
          const target = filtered[lightboxIndex]
          if (!target || !target.imageUrl) return null
          const idx = withImages.findIndex((img) => img.id === target.id)
          return idx >= 0 ? idx : null
        })()}
        onClose={() => setLightboxIndex(null)}
        onNavigate={(i) => {
          const withImages = filtered.filter((img) => img.imageUrl)
          const target = withImages[i]
          if (target) {
            const fullIdx = filtered.findIndex((img) => img.id === target.id)
            setLightboxIndex(fullIdx >= 0 ? fullIdx : null)
          }
        }}
      />
    </div>
  )
}
