'use client'

import { ArrowUpRight, Plus, X, Edit2, Trash2, Heart } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { PlaceholderImage } from '@/components/PlaceholderImage'
import { ScrollReveal } from '@/components/ScrollReveal'
import { ImageUploader } from '@/components/ImageUploader'
import { RichTextEditor } from '@/components/RichTextEditor'
import { Pagination } from '@/components/Pagination'
import { TagInput } from '@/components/TagInput'
import { toast } from 'sonner'

// Small inline like count badge for article cards (fetches count on mount)
function LikeCountBadge({ articleId }: { articleId: string }) {
  const [count, setCount] = useState<number | null>(null)
  useEffect(() => {
    fetch(`/api/articles/${articleId}/like`)
      .then((r) => r.json())
      .then((d) => setCount(d.count || 0))
      .catch(() => setCount(0))
  }, [articleId])
  if (count === null || count === 0) return null
  return (
    <div className="absolute bottom-2 right-2 bg-[var(--brand-ink)]/90 text-[var(--brand-surface)] px-2 py-0.5 text-[10px] uppercase tracking-widest font-condensed flex items-center gap-1">
      <Heart className="w-2.5 h-2.5 fill-current" /> {count}
    </div>
  )
}

interface Article {
  id: string
  title: string
  excerpt: string
  date: string
  author: string
  category: string
  imageUrl: string | null
  authorId: string
  published?: boolean
  tags?: { id: string; name: string; color: string }[]
}

const CATEGORIES = ['Berita', 'Event', 'Pengumuman', 'Akademik']

export function ArticlesView() {
  const user = useAppStore((s) => s.user)
  const setView = useAppStore((s) => s.setView)
  const tagFilter = useAppStore((s) => s.tagFilter)
  const setTagFilter = useAppStore((s) => s.setTagFilter)
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('Semua')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 6
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<Article | null>(null)
  const [formTags, setFormTags] = useState<string[]>([])
  const [form, setForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'Berita',
    date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    author: '',
    imageUrl: '',
    published: true,
  })

  const load = () => {
    setLoading(true)
    fetch(`/api/articles${user ? '?includeDrafts=1' : ''}`)
      .then((r) => r.json())
      .then((d) => setArticles(d.articles || []))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = articles.filter((a) => {
    const matchCat = activeCategory === 'Semua' || a.category === activeCategory
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'published' && a.published !== false) ||
      (statusFilter === 'draft' && a.published === false)
    const matchTag = !tagFilter || (a.tags || []).some((t) => t.name === tagFilter)
    return matchCat && matchStatus && matchTag
  })
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  // Reset page when filter changes or filtered list shrinks
  useEffect(() => {
    if (page > totalPages) setPage(1)
  }, [totalPages, page])
  useEffect(() => setPage(1), [activeCategory, statusFilter, tagFilter])
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const openAdd = () => {
    setEditing(null)
    setFormTags([])
    setForm({
      title: '',
      excerpt: '',
      content: '',
      category: 'Berita',
      date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      author: user?.displayName || user?.username || '',
      imageUrl: '',
      published: true,
    })
    setShowAdd(true)
  }

  const openEdit = (a: Article) => {
    setEditing(a)
    setFormTags((a.tags || []).map((t) => t.name))
    setForm({
      title: a.title,
      excerpt: a.excerpt,
      content: '',
      category: a.category,
      date: a.date,
      author: a.author,
      imageUrl: a.imageUrl || '',
      published: a.published ?? true,
    })
    setShowAdd(true)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.excerpt) {
      toast.error('Judul dan ringkasan wajib diisi.')
      return
    }
    let articleId: string | null = null
    if (editing) {
      const res = await fetch(`/api/articles/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await res.json()
      if (d.error) return toast.error(d.error)
      articleId = editing.id
      toast.success('Artikel diperbarui!')
    } else {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await res.json()
      if (d.error) return toast.error(d.error)
      articleId = d.article?.id || null
      toast.success('Artikel dipublikasikan!')
    }

    // Save tags if any
    if (articleId && formTags.length > 0) {
      await fetch(`/api/articles/${articleId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: formTags }),
      }).catch(() => {/* ignore tag errors — article saved successfully */})
    }

    setShowAdd(false)
    setEditing(null)
    load()
  }

  const remove = async (id: string) => {
    if (!confirm('Hapus artikel ini?')) return
    const res = await fetch(`/api/articles/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Artikel dihapus.')
      load()
    } else {
      const d = await res.json().catch(() => ({}))
      toast.error(d.error || 'Gagal menghapus.')
    }
  }

  return (
    <div className="max-w-5xl mx-auto page-enter">
      <div className="mb-12 pb-6 border-b-2 border-[var(--brand-ink)]">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h1 className="text-5xl font-serif font-black uppercase mb-4 text-[var(--brand-ink)]">
              Artikel &amp; <span className="italic text-[var(--brand-navy)]">Event</span>
            </h1>
            <p className="uppercase tracking-widest text-sm font-bold text-[var(--brand-ink)]/70">
              Catatan perjalanan dan agenda angkatan
            </p>
          </div>
          {user && (
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 bg-[var(--brand-ink)] text-white px-4 py-2 font-condensed uppercase tracking-widest text-xs font-bold hover:bg-[var(--brand-maroon)] transition-colors flex-shrink-0"
            >
              <Plus className="w-4 h-4" /> Tulis Artikel
            </button>
          )}
        </div>
      </div>

      {showAdd && user && (
        <form
          onSubmit={submit}
          className="mb-8 border border-[var(--brand-ink)] p-6 bg-[var(--brand-surface-2)] shadow-hard"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-condensed text-xl uppercase">
              {editing ? 'Edit Artikel' : 'Tulis Artikel Baru'}
            </h3>
            <button
              type="button"
              onClick={() => {
                setShowAdd(false)
                setEditing(null)
              }}
              className="text-[var(--brand-ink-muted)] hover:text-[var(--brand-ink)]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-condensed uppercase font-bold mb-1">Judul</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-[var(--brand-ink)] p-2 text-sm bg-[var(--brand-surface)]"
                placeholder="Malam Keakraban Makrab 2025"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-condensed uppercase font-bold mb-1">Ringkasan</label>
              <textarea
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                rows={2}
                className="w-full border border-[var(--brand-ink)] p-2 text-sm bg-[var(--brand-surface)] resize-none"
                placeholder="Ringkasan singkat artikel..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-condensed uppercase font-bold mb-2">Konten Artikel (Rich Text)</label>
              <RichTextEditor
                value={form.content}
                onChange={(md) => setForm({ ...form, content: md })}
                placeholder="Tuliskan isi artikel di sini... (Mendukung Markdown: **bold**, *italic*, # heading, - list, > quote, [link](url), ![img](url), `code`)"
              />
            </div>
            <div>
              <label className="block text-xs font-condensed uppercase font-bold mb-1">Kategori</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-[var(--brand-ink)] p-2 text-sm bg-[var(--brand-surface)]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-condensed uppercase font-bold mb-1">Tanggal Tampil</label>
              <input
                type="text"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full border border-[var(--brand-ink)] p-2 text-sm bg-[var(--brand-surface)]"
              />
            </div>
            <div>
              <label className="block text-xs font-condensed uppercase font-bold mb-1">Penulis</label>
              <input
                type="text"
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                className="w-full border border-[var(--brand-ink)] p-2 text-sm bg-[var(--brand-surface)]"
              />
            </div>
            <div>
              <label className="block text-xs font-condensed uppercase font-bold mb-2">Status Publikasi</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, published: true })}
                  className={`flex-1 px-3 py-2 text-xs uppercase tracking-widest font-condensed border transition-all ${
                    form.published
                      ? 'bg-[var(--brand-ink)] text-[var(--brand-surface)] border-[var(--brand-ink)]'
                      : 'bg-transparent text-[var(--brand-ink)] border-[var(--brand-ink)]/40 hover:border-[var(--brand-ink)]'
                  }`}
                >
                  ✓ Publikasikan
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, published: false })}
                  className={`flex-1 px-3 py-2 text-xs uppercase tracking-widest font-condensed border transition-all ${
                    !form.published
                      ? 'bg-[var(--brand-maroon)] text-white border-[var(--brand-maroon)]'
                      : 'bg-transparent text-[var(--brand-ink)] border-[var(--brand-ink)]/40 hover:border-[var(--brand-ink)]'
                  }`}
                >
                  ✎ Draft
                </button>
              </div>
              <p className="text-[10px] text-[var(--brand-ink-muted)] mt-1">
                {form.published ? 'Terlihat oleh semua pengunjung.' : 'Hanya terlihat oleh Anda & admin.'}
              </p>
            </div>
            <div className="md:col-span-2">
              <ImageUploader
                value={form.imageUrl}
                onChange={(url) => setForm({ ...form, imageUrl: url })}
                label="Gambar Artikel (opsional)"
                hint="Upload file atau tempel URL gambar. Otomatis diresize ke 3 varian (sm/md/lg)."
                altText={form.title || 'Gambar artikel'}
                grayscale
              />
            </div>
            <div className="md:col-span-2">
              <TagInput
                value={formTags}
                onChange={setFormTags}
                label="Tag Artikel (opsional)"
                hint="Tekan Enter atau koma untuk menambah tag. Maksimal 10 tag per artikel. Tag yang sudah ada akan dipakai ulang."
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setShowAdd(false)
                setEditing(null)
              }}
              className="px-4 py-2 text-xs uppercase font-condensed text-[var(--brand-ink-muted)] hover:text-[var(--brand-ink)]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[var(--brand-ink)] text-white text-xs uppercase font-condensed hover:bg-black"
            >
              {editing ? 'Simpan Edit' : 'Publikasikan'}
            </button>
          </div>
        </form>
      )}

      {/* Category filter */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        {['Semua', ...CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 border border-[var(--brand-ink)] text-[11px] uppercase tracking-widest font-bold ${
              activeCategory === cat ? 'bg-[var(--brand-ink)] text-white' : 'bg-[var(--brand-surface)] hover:bg-[var(--brand-surface-3)]'
            }`}
          >
            {cat}
          </button>
        ))}

        {/* Status filter (only for logged-in users who can have drafts) */}
        {user && (
          <>
            <div className="w-px h-6 bg-[var(--brand-ink)] mx-2" />
            <span className="text-[10px] uppercase tracking-widest font-condensed text-[var(--brand-ink-muted)]">Status:</span>
            {([
              { v: 'all', label: 'Semua' },
              { v: 'published', label: 'Publik' },
              { v: 'draft', label: 'Draft' },
            ] as const).map((s) => (
              <button
                key={s.v}
                onClick={() => setStatusFilter(s.v)}
                className={`px-3 py-1.5 border text-[10px] uppercase tracking-widest font-condensed transition-colors ${
                  statusFilter === s.v
                    ? s.v === 'draft'
                      ? 'bg-[var(--brand-maroon)] text-white border-[var(--brand-maroon)]'
                      : 'bg-[var(--brand-orange)] text-[var(--brand-surface)] border-[var(--brand-orange)]'
                    : 'border-[var(--brand-ink)]/40 text-[var(--brand-ink)] hover:border-[var(--brand-ink)]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </>
        )}

        {/* Active tag filter (when navigating from tag cloud) */}
        {tagFilter && (
          <>
            <div className="w-px h-6 bg-[var(--brand-ink)] mx-2" />
            <span className="text-[10px] uppercase tracking-widest font-condensed text-[var(--brand-ink-muted)]">Tag:</span>
            <button
              onClick={() => setTagFilter(null)}
              className="px-3 py-1.5 border-2 text-[10px] uppercase tracking-widest font-condensed text-white transition-all hover:scale-105 flex items-center gap-1"
              style={{ backgroundColor: 'var(--brand-orange)', borderColor: 'var(--brand-orange)' }}
              title="Klik untuk hapus filter tag"
            >
              {tagFilter}
              <X className="w-3 h-3" />
            </button>
          </>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border border-[var(--brand-ink)] bg-[var(--brand-surface-2)]">
              <div className="aspect-[4/3] bg-[var(--brand-orange)]/15/40 animate-pulse" />
              <div className="p-5 space-y-3">
                <div className="h-5 bg-[var(--brand-orange)]/15/40 animate-pulse w-3/4" />
                <div className="h-3 bg-[var(--brand-orange)]/15/40 animate-pulse" />
                <div className="h-3 bg-[var(--brand-orange)]/15/40 animate-pulse w-5/6" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-[var(--brand-ink)]/30">
          <p className="font-serif italic text-2xl text-[var(--brand-ink)]/50 mb-2">Belum ada artikel</p>
          <p className="text-sm text-[var(--brand-ink-muted)]">Mulai tulis artikel pertama untuk angkatan!</p>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {paged.map((a, i) => (
            <ScrollReveal
              key={a.id}
              delay={((i % 3) + 1) as 1 | 2 | 3}
              className="flex flex-col border border-[var(--brand-ink)] bg-[var(--brand-surface-2)] shadow-hard group lift-on-hover"
            >
              <div className="p-3 border-b border-[var(--brand-ink)]">
                <div className="relative overflow-hidden border border-[var(--brand-ink)]">
                  <button
                    onClick={() => setView('article-detail', a.id)}
                    className="block w-full aspect-[4/3]"
                  >
                    <PlaceholderImage alt={a.title} src={a.imageUrl || undefined} grayscale />
                  </button>
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <div className="bg-[var(--brand-orange)]/15 border border-[var(--brand-ink)] px-2 py-0.5 text-[9px] uppercase tracking-widest font-bold ">
                      {a.category}
                    </div>
                    {a.published === false && (
                      <div className="bg-[var(--brand-maroon)] text-white border border-[var(--brand-ink)] px-2 py-0.5 text-[9px] uppercase tracking-widest font-bold ">
                        ✎ Draft
                      </div>
                    )}
                  </div>
                  <LikeCountBadge articleId={a.id} />
                </div>
              </div>
              <div className="p-5 flex flex-col flex-grow">
                <button
                  onClick={() => setView('article-detail', a.id)}
                  className="text-left"
                >
                  <h3 className="font-serif font-bold text-xl mb-3 leading-tight line-clamp-2 hover:text-[var(--brand-navy)] transition-colors">{a.title}</h3>
                </button>
                <p className="text-sm text-[var(--brand-ink)]/80 mb-3 flex-grow line-clamp-3">{a.excerpt}</p>

                {/* Tags */}
                {a.tags && a.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {a.tags.slice(0, 4).map((tag) => (
                      <button
                        key={tag.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          setTagFilter(tag.name)
                          setPage(1)
                        }}
                        className="tag-chip text-[9px] uppercase tracking-widest font-condensed px-1.5 py-0.5 border text-white cursor-pointer transition-transform hover:scale-110"
                        style={{ backgroundColor: tag.color, borderColor: tag.color }}
                        title={`Filter by ${tag.name}`}
                      >
                        {tag.name}
                      </button>
                    ))}
                    {a.tags.length > 4 && (
                      <span className="text-[9px] uppercase tracking-widest font-condensed text-[var(--brand-ink-muted)]">
                        +{a.tags.length - 4}
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-auto border-t border-dashed border-[var(--brand-ink)]/30 pt-4 flex justify-between items-end gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 flex-shrink-0">
                      <PlaceholderImage
                        alt={`Foto ${a.author}`}
                        src={undefined}
                        grayscale
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-condensed text-sm font-semibold tracking-wide truncate">{a.author}</p>
                      <p className="font-sans text-[11px] text-[var(--brand-ink-muted)]">{a.date}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {user && (user.role === 'admin' || user.id === a.authorId) && (
                      <>
                        <button
                          onClick={() => openEdit(a)}
                          className="w-8 h-8 flex items-center justify-center border border-[var(--brand-ink)] bg-[var(--brand-surface-3)] hover:bg-[var(--brand-ink)] hover:text-white transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => remove(a.id)}
                          className="w-8 h-8 flex items-center justify-center border border-[var(--brand-maroon)] bg-[var(--brand-surface-3)] text-[var(--brand-navy)] hover:bg-[var(--brand-maroon)] hover:text-white transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setView('article-detail', a.id)}
                      className="w-8 h-8 flex items-center justify-center border border-[var(--brand-ink)] bg-[var(--brand-surface-3)] hover:bg-[var(--brand-maroon)] hover:text-white transition-colors"
                      title="Baca"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
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
    </div>
  )
}
