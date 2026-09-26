'use client'

import { useEffect, useState, useMemo } from 'react'
import { Send, Trash2, MessageSquareQuote, Quote, Filter, Sparkles, X, CheckCircle2, AlertCircle, Loader2, ChevronRight } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ---------- Types ----------

interface Aspirasi {
  id: string
  name: string
  content: string
  category: string
  createdAt: string
}

interface WordItem {
  text: string
  count: number
}

// ---------- Constants ----------

const CATEGORIES = ['Semua', 'Akademik', 'Fasilitas', 'Organisasi', 'Sosial', 'Umum'] as const
type Category = typeof CATEGORIES[number]

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  Akademik: { label: 'Akademik', color: 'navy' },
  Fasilitas: { label: 'Fasilitas', color: 'orange' },
  Organisasi: { label: 'Organisasi', color: 'silver' },
  Sosial: { label: 'Sosial', color: 'navy' },
  Umum: { label: 'Umum', color: 'orange' },
}

// Indonesian stopwords (common words to exclude from word cloud)
const STOPWORDS = new Set<string>([
  'yang', 'di', 'ke', 'dari', 'dan', 'atau', 'untuk', 'pada', 'dengan', 'ada', 'ini', 'itu',
  'saya', 'kami', 'kalian', 'mereka', 'akan', 'sudah', 'belum', 'juga', 'lebih', 'tidak',
  'bukan', 'jika', 'karena', 'sehingga', 'agar', 'dapat', 'bisa', 'harus', 'anda', 'kita',
  'tersebut', 'mana', 'jangan', 'lagi', 'masih', 'sedang', 'telah', 'tetapi', 'namun',
  'supaya', 'maka', 'oleh', 'tentang', 'sebagai', 'seperti', 'yaitu', 'yakni', 'misalnya',
  'contohnya', 'adalah', 'ialah', 'itu', 'ya', 'nya', 'nya,', 'sangat', 'agak', 'cukup',
  'sehingga', 'sampai', 'hingga', 'ketika', 'saat', 'kala', 'lagi', 'saja', 'juga', 'ada',
  'adanya', 'jadi', 'menjadi', 'tersebut', 'demikian', 'begitu', 'karna', 'nya.', 'an',
  'sangat', 'amat', 'sungguh', 'benar', 'memang', 'oleh', 'akan', 'telah', 'antar', 'antara',
  'bisa', 'dapat', 'boleh', 'mau', 'ingin', ' Hendak', 'maupun', 'dan', 'atau', 'tetapi',
  'the', 'and', 'or', 'but', 'for', 'with', 'is', 'are', 'was', 'were', 'be', 'been',
  'to', 'in', 'on', 'at', 'of', 'a', 'an', 'this', 'that', 'these', 'those',
  'i', 'we', 'you', 'they', 'he', 'she', 'it', 'me', 'him', 'her', 'us', 'them',
])

// ---------- Helpers ----------

/** Tokenize text into meaningful Indonesian words for the word cloud */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => {
      if (w.length < 3) return false
      if (STOPWORDS.has(w)) return false
      if (/^\d+$/.test(w)) return false
      return true
    })
}

/** Build a frequency map of words from a list of aspirations */
function buildWordCloud(items: Aspirasi[]): WordItem[] {
  const freq = new Map<string, number>()
  for (const a of items) {
    for (const w of tokenize(a.content)) {
      freq.set(w, (freq.get(w) || 0) + 1)
    }
  }
  return Array.from(freq.entries())
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 45)
}

/** Map word count to font size tier (1=smallest, 5=largest) */
function sizeTier(count: number, max: number): number {
  if (max <= 0) return 1
  const ratio = count / max
  if (ratio >= 0.8) return 5
  if (ratio >= 0.6) return 4
  if (ratio >= 0.4) return 3
  if (ratio >= 0.2) return 2
  return 1
}

const SIZE_CLASSES: Record<number, string> = {
  1: 'text-base',
  2: 'text-lg',
  3: 'text-2xl',
  4: 'text-3xl',
  5: 'text-4xl md:text-5xl',
}

const COLOR_CLASSES: Record<string, string> = {
  navy: 'text-[var(--brand-navy)]',
  orange: 'text-[var(--brand-orange)]',
  silver: 'text-[var(--brand-ink-muted)]',
  ink: 'text-[var(--brand-ink)]',
}

/** Color rotation: navy → orange → ink → ink-muted, deterministic by word text */
function colorForWord(text: string): string {
  const palette = ['navy', 'orange', 'ink', 'silver']
  let hash = 0
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) >>> 0
  return palette[hash % palette.length]
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
  } catch {
    return iso
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'baru saja'
  if (min < 60) return `${min} menit lalu`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} jam lalu`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day} hari lalu`
  return formatDate(iso)
}

// ---------- Component ----------

export function AspirasiView() {
  const user = useAppStore((s) => s.user)
  const [items, setItems] = useState<Aspirasi[]>([])
  const [stats, setStats] = useState<{ category: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<Category>('Semua')
  const [submitting, setSubmitting] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [highlightedWord, setHighlightedWord] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    content: '',
    category: 'Umum' as Category,
  })
  const [errors, setErrors] = useState<{ name?: string; content?: string }>({})
  const [visibleCount, setVisibleCount] = useState(10)

  const load = () => {
    setLoading(true)
    fetch('/api/aspirasi')
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items || [])
        setStats(d.stats || [])
      })
      .catch(() => {
        setItems([])
        setStats([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [refreshKey])

  const filtered = useMemo(
    () => (activeCategory === 'Semua' ? items : items.filter((a) => a.category === activeCategory)),
    [items, activeCategory]
  )

  const words = useMemo(() => buildWordCloud(filtered), [filtered])
  const maxCount = words.length > 0 ? words[0].count : 0

  // Reset visible count when category or highlighted word changes
  useEffect(() => {
    setVisibleCount(10)
  }, [activeCategory, highlightedWord])

  const validate = () => {
    const e: { name?: string; content?: string } = {}
    if (form.name.trim().length < 2) e.name = 'Nama minimal 2 karakter.'
    if (form.content.trim().length < 3) e.content = 'Aspirasi minimal 3 karakter.'
    if (form.content.trim().length > 500) e.content = 'Aspirasi maksimal 500 karakter.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/aspirasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          content: form.content.trim(),
          category: form.category,
        }),
      })
      const d = await res.json()
      if (!res.ok) {
        toast.error(d.error || 'Gagal mengirim aspirasi.')
      } else {
        toast.success('Aspirasi terkirim. Terima kasih sudah berbagi suara!')
        setForm({ name: '', content: '', category: 'Umum' })
        setRefreshKey((k) => k + 1)
      }
    } catch {
      toast.error('Gagal terhubung ke server. Coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus aspirasi ini? Tindakan tidak bisa dibatalkan.')) return
    try {
      const res = await fetch(`/api/aspirasi/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json()
        toast.error(d.error || 'Gagal menghapus.')
      } else {
        toast.success('Aspirasi dihapus.')
        setRefreshKey((k) => k + 1)
      }
    } catch {
      toast.error('Gagal terhubung ke server.')
    }
  }

  const totalCount = stats.reduce((sum, s) => sum + s.count, 0)

  return (
    <div className="space-y-8">
      {/* Masthead */}
      <header className="border-y-2 border-[var(--brand-ink)] py-5 px-4 md:px-6 text-center relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--brand-orange)] opacity-50" />
        <p className="font-mono text-[10px] md:text-xs uppercase tracking-[0.3em] text-[var(--brand-ink-muted)] mb-2">
          VOL. ASPIRASI • NO. {String(totalCount + 1).padStart(2, '0')} • EDISI BERJALAN
        </p>
        <h1 className="font-serif text-4xl md:text-6xl font-bold tracking-tight text-[var(--brand-navy)] leading-none">
          Aspirasi Mahasiswa
        </h1>
        <p className="font-serif italic text-sm md:text-base text-[var(--brand-ink-muted)] mt-2 max-w-2xl mx-auto">
          Suara kami, harapan bersama. Tutupkan unek-unek, kritik membangun, dan ide segar untuk angkatan Statistika &apos;25.
        </p>
        <div className="flex items-center justify-center gap-3 mt-3">
          <div className="h-px bg-[var(--brand-border)] flex-grow max-w-[120px]" />
          <Sparkles className="w-4 h-4 text-[var(--brand-orange)]" />
          <div className="h-px bg-[var(--brand-border)] flex-grow max-w-[120px]" />
        </div>
        <p className="font-condensed text-xs uppercase tracking-widest text-[var(--brand-ink-muted)] mt-2">
          Tanpa login • cukup nama • anonim untuk umum
        </p>
      </header>

      {/* Stats strip */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Aspirasi" value={String(totalCount).padStart(3, '0')} accent="navy" icon="✶" />
        <StatCard label="Kata Unik" value={String(words.length).padStart(3, '0')} accent="orange" icon="✎" />
        <StatCard
          label="Kategori Aktif"
          value={String(stats.length).padStart(2, '0')}
          accent="silver"
          icon="◇"
        />
        <StatCard
          label="Kontributor"
          value={String(new Set(items.map((a) => a.name.toLowerCase())).size).padStart(3, '0')}
          accent="navy"
          icon="★"
        />
      </section>

      {/* Category filter */}
      <section className="flex flex-wrap items-center gap-2 justify-center">
        <span className="font-condensed text-xs uppercase tracking-widest text-[var(--brand-ink-muted)] mr-2 flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5" /> Saring:
        </span>
        {CATEGORIES.map((c) => {
          const isActive = activeCategory === c
          const count = c === 'Semua' ? totalCount : stats.find((s) => s.category === c)?.count || 0
          return (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={cn(
                'font-condensed text-sm uppercase tracking-wider px-3 py-1.5 border transition-all',
                isActive
                  ? 'bg-[var(--brand-navy)] text-[var(--brand-surface)] border-[var(--brand-navy)]'
                  : 'bg-transparent text-[var(--brand-ink-muted)] border-[var(--brand-border)] hover:border-[var(--brand-navy)] hover:text-[var(--brand-navy)]'
              )}
            >
              {c} <span className="ml-1 text-[10px] opacity-70">{count}</span>
            </button>
          )
        })}
      </section>

      {/* Word cloud hero */}
      <section className="bg-[var(--brand-surface-2)] border-2 border-[var(--brand-ink)] p-6 md:p-10 relative overflow-hidden">
        {/* Decorative corner */}
        <div className="absolute top-2 left-2 font-mono text-[9px] uppercase tracking-widest text-[var(--brand-ink-muted)]">
          ☰ Wolken van Woorden
        </div>
        <div className="absolute top-2 right-2 font-mono text-[9px] uppercase tracking-widest text-[var(--brand-ink-muted)]">
          {filtered.length} sumber • {words.length} kata
        </div>

        <div className="text-center mt-4 mb-3">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-[var(--brand-ink)]">
            Awan Suara
          </h2>
          <p className="font-serif italic text-xs md:text-sm text-[var(--brand-ink-muted)]">
            Klik kata untuk menyorot aspirasi yang mengandungnya
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--brand-orange)]" />
            <span className="ml-2 font-condensed uppercase text-sm tracking-widest text-[var(--brand-ink-muted)]">
              Merangkai kata…
            </span>
          </div>
        ) : words.length === 0 ? (
          <div className="text-center py-12">
            <Quote className="w-10 h-10 mx-auto mb-3 text-[var(--brand-ink-muted)] opacity-40" />
            <p className="font-serif italic text-lg text-[var(--brand-ink-muted)]">
              Belum ada aspirasi pada kategori ini.
            </p>
            <p className="text-sm text-[var(--brand-ink-muted)] mt-1">
              Jadilah yang pertama memulai percakapan.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 max-w-4xl mx-auto break-words">
            {words.map((w) => {
              const tier = sizeTier(w.count, maxCount)
              const color = colorForWord(w.text)
              const isHighlighted = highlightedWord === w.text
              return (
                <button
                  key={w.text}
                  onClick={() => setHighlightedWord(isHighlighted ? null : w.text)}
                  className={cn(
                    'font-serif font-bold leading-none transition-all duration-200 hover:scale-110 hover:-rotate-2 cursor-pointer',
                    SIZE_CLASSES[tier],
                    COLOR_CLASSES[color],
                    tier >= 4 && 'italic',
                    isHighlighted && 'underline decoration-2 underline-offset-4 decoration-[var(--brand-orange)]'
                  )}
                  title={`${w.text} — muncul ${w.count}× dalam aspirasi`}
                  style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}
                >
                  {w.text}
                  <sup className="ml-0.5 text-[9px] font-mono opacity-60 not-italic">{w.count}</sup>
                </button>
              )
            })}
          </div>
        )}

        {highlightedWord && (
          <div className="mt-6 pt-4 border-t border-dashed border-[var(--brand-border)] text-center">
            <button
              onClick={() => setHighlightedWord(null)}
              className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-[var(--brand-orange)] hover:text-[var(--brand-ink)]"
            >
              <X className="w-3 h-3" /> Hapus filter kata &ldquo;{highlightedWord}&rdquo;
            </button>
          </div>
        )}
      </section>

      {/* Main: form + recent list */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        {/* Submit form (sidebar) */}
        <div className="lg:col-span-4">
          <AspirasiForm
            form={form}
            setForm={setForm}
            errors={errors}
            submitting={submitting}
            onSubmit={submit}
          />
        </div>

        {/* Recent aspirations (main) */}
        <div className="lg:col-span-8">
          <AspirasiList
            items={filtered}
            loading={loading}
            isAdmin={!!user && user.role === 'admin'}
            highlightedWord={highlightedWord}
            onDelete={handleDelete}
            visibleCount={visibleCount}
            setVisibleCount={setVisibleCount}
          />
        </div>
      </section>
    </div>
  )
}

// ---------- Sub-components ----------

function StatCard({
  label,
  value,
  accent,
  icon,
}: {
  label: string
  value: string
  accent: 'navy' | 'orange' | 'silver'
  icon: string
}) {
  const bg =
    accent === 'navy'
      ? 'bg-[var(--brand-navy)] text-[var(--brand-surface)]'
      : accent === 'orange'
      ? 'bg-[var(--brand-orange)] text-[var(--brand-surface)]'
      : 'bg-[var(--brand-surface-3)] text-[var(--brand-ink)]'
  return (
    <div className="border border-[var(--brand-border)] bg-[var(--brand-surface)] flex items-stretch overflow-hidden">
      <div className={cn('flex items-center justify-center w-10 md:w-12 text-xl', bg)}>
        {icon}
      </div>
      <div className="flex flex-col justify-center px-3 py-2 flex-grow">
        <span className="font-mono text-[9px] md:text-[10px] uppercase tracking-widest text-[var(--brand-ink-muted)]">
          {label}
        </span>
        <span className="font-condensed text-2xl md:text-3xl tracking-tight leading-none text-[var(--brand-ink)]">
          {value}
        </span>
      </div>
    </div>
  )
}

function AspirasiForm({
  form,
  setForm,
  errors,
  submitting,
  onSubmit,
}: {
  form: { name: string; content: string; category: Category }
  setForm: (f: { name: string; content: string; category: Category }) => void
  errors: { name?: string; content?: string }
  submitting: boolean
  onSubmit: (ev: React.FormEvent) => void
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="border border-[var(--brand-ink)] bg-[var(--brand-surface)] sticky top-20"
    >
      {/* Form header */}
      <div className="bg-[var(--brand-navy)] text-[var(--brand-surface)] px-4 py-3 flex items-center gap-2">
        <MessageSquareQuote className="w-4 h-4 text-[var(--brand-orange)]" />
        <h3 className="font-condensed text-sm uppercase tracking-widest">Kirim Aspirasi</h3>
      </div>

      <div className="p-4 md:p-5 space-y-4">
        {/* Privacy note */}
        <div className="flex items-start gap-2 text-xs text-[var(--brand-ink-muted)] font-serif italic border-b border-dashed border-[var(--brand-border)] pb-3">
          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[var(--brand-orange)]" />
          <span>
            Tidak perlu login. Cukup masukkan nama panggilan — untuk data kami, bukan untuk publik. Isi aspirasi akan tampil di kolom kanan.
          </span>
        </div>

        {/* Name input */}
        <div>
          <label className="block font-condensed text-xs uppercase tracking-widest text-[var(--brand-ink-muted)] mb-1.5">
            Nama Panggilan <span className="text-[var(--brand-orange)]">*</span>
          </label>
          <input
            id="aspirasi-name-input"
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            maxLength={60}
            placeholder="cth: Oji, Dian, Ekoy…"
            className={cn(
              'w-full px-3 py-2 bg-transparent border-b-2 font-mono text-sm focus:outline-none transition-colors placeholder:text-[var(--brand-ink-muted)] placeholder:opacity-70',
              errors.name
                ? 'border-[var(--brand-orange)]'
                : 'border-[var(--brand-border)] focus:border-[var(--brand-navy)]'
            )}
          />
          {errors.name && (
            <p className="text-xs text-[var(--brand-orange)] mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.name}
            </p>
          )}
        </div>

        {/* Category select */}
        <div>
          <label className="block font-condensed text-xs uppercase tracking-widest text-[var(--brand-ink-muted)] mb-1.5">
            Kategori
          </label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
            className="w-full px-3 py-2 bg-[var(--brand-surface)] border border-[var(--brand-border)] font-serif text-sm focus:outline-none focus:border-[var(--brand-navy)]"
          >
            {CATEGORIES.filter((c) => c !== 'Semua').map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Content textarea */}
        <div>
          <label className="block font-condensed text-xs uppercase tracking-widest text-[var(--brand-ink-muted)] mb-1.5">
            Aspirasi <span className="text-[var(--brand-orange)]">*</span>
          </label>
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            maxLength={500}
            rows={5}
            placeholder="Tulis kritik, ide, harapan, atau pertanyaanmu di sini…"
            className={cn(
              'w-full px-3 py-2 bg-[var(--brand-surface-2)] border font-serif text-sm leading-relaxed focus:outline-none transition-colors placeholder:text-[var(--brand-ink-muted)] placeholder:opacity-70 resize-none',
              errors.content
                ? 'border-[var(--brand-orange)]'
                : 'border-[var(--brand-border)] focus:border-[var(--brand-navy)]'
            )}
          />
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] font-mono text-[var(--brand-ink-muted)]">
              {errors.content ? (
                <span className="text-[var(--brand-orange)] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.content}
                </span>
              ) : (
                'Maks. 500 karakter'
              )}
            </span>
            <span
              className={cn(
                'text-[10px] font-mono',
                form.content.length > 480 ? 'text-[var(--brand-orange)]' : 'text-[var(--brand-ink-muted)]'
              )}
            >
              {form.content.length}/500
            </span>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={submitting}
          className={cn(
            'w-full flex items-center justify-center gap-2 bg-[var(--brand-navy)] text-[var(--brand-surface)] font-condensed uppercase tracking-widest text-sm py-2.5 hover:bg-[var(--brand-navy-light)] transition-colors disabled:opacity-50',
            submitting && 'cursor-wait'
          )}
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Mengirim…
            </>
          ) : (
            <>
              Kirim Aspirasi <Send className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>
    </form>
  )
}

function AspirasiList({
  items,
  loading,
  isAdmin,
  highlightedWord,
  onDelete,
  visibleCount,
  setVisibleCount,
}: {
  items: Aspirasi[]
  loading: boolean
  isAdmin: boolean
  highlightedWord: string | null
  onDelete: (id: string) => void
  visibleCount: number
  setVisibleCount: (n: number) => void
}) {
  // Filter by highlighted word (case-insensitive)
  const filteredItems = highlightedWord
    ? items.filter((a) => {
        const words = tokenize(a.content)
        return words.includes(highlightedWord)
      })
    : items

  const visibleItems = filteredItems.slice(0, visibleCount)
  const hasMore = filteredItems.length > visibleCount

  return (
    <div className="border border-[var(--brand-ink)] bg-[var(--brand-surface)]">
      {/* Header */}
      <div className="border-b border-[var(--brand-border)] px-4 md:px-5 py-3 flex items-center justify-between bg-[var(--brand-surface-2)]">
        <div className="flex items-center gap-2">
          <Quote className="w-4 h-4 text-[var(--brand-orange)]" />
          <h3 className="font-condensed text-sm uppercase tracking-widest text-[var(--brand-ink)]">
            Dinding Aspirasi
          </h3>
        </div>
        <span className="font-mono text-xs text-[var(--brand-ink-muted)]">
          {filteredItems.length} entri
        </span>
      </div>

      {/* List */}
      <div className="max-h-[800px] overflow-y-auto custom-scroll divide-y divide-[var(--brand-border)]">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--brand-orange)]" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquareQuote className="w-10 h-10 mx-auto mb-3 text-[var(--brand-ink-muted)] opacity-40" />
            <p className="font-serif italic text-base text-[var(--brand-ink-muted)]">
              {highlightedWord
                ? `Tidak ada aspirasi yang mengandung kata "${highlightedWord}".`
                : 'Belum ada aspirasi. Kirim yang pertama!'}
            </p>
          </div>
        ) : (
          <>
            {visibleItems.map((a, i) => {
              const meta = CATEGORY_META[a.category] || CATEGORY_META.Umum
              const colorClass = COLOR_CLASSES[meta.color] || COLOR_CLASSES.ink
              return (
                <article
                  key={a.id}
                  className="p-4 md:p-5 hover:bg-[var(--brand-surface-2)] transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    {/* Number badge */}
                    <div className="flex-shrink-0 w-7 h-7 border border-[var(--brand-ink)] flex items-center justify-center font-mono text-[10px] uppercase text-[var(--brand-ink)] bg-[var(--brand-surface)]">
                      {String(i + 1).padStart(2, '0')}
                    </div>

                    <div className="flex-grow min-w-0">
                      {/* Meta row */}
                      <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-condensed text-sm uppercase tracking-wider text-[var(--brand-ink)]">
                            {a.name}
                          </span>
                          <span
                            className={cn(
                              'text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 border',
                              colorClass,
                              'border-current opacity-80'
                            )}
                          >
                            {a.category}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-[var(--brand-ink-muted)]">
                          {timeAgo(a.createdAt)}
                        </span>
                      </div>

                      {/* Content */}
                      <p className="font-serif text-sm md:text-[15px] leading-relaxed text-[var(--brand-ink)]">
                        {highlightedWord ? (
                          <HighlightText text={a.content} word={highlightedWord} />
                        ) : (
                          a.content
                        )}
                      </p>
                    </div>

                    {/* Admin delete */}
                    {isAdmin && (
                      <button
                        onClick={() => onDelete(a.id)}
                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-[var(--brand-orange)]/15 text-[var(--brand-ink-muted)] hover:text-[var(--brand-orange)]"
                        title="Hapus (admin)"
                        aria-label="Hapus aspirasi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </article>
              )
            })}
            {/* Load more button */}
            {hasMore && (
              <div className="p-4 text-center bg-[var(--brand-surface-2)] border-t border-[var(--brand-border)]">
                <button
                  onClick={() => setVisibleCount(visibleCount + 10)}
                  className="font-condensed text-sm uppercase tracking-widest text-[var(--brand-navy)] hover:text-[var(--brand-orange)] border border-[var(--brand-navy)] hover:border-[var(--brand-orange)] px-4 py-2 transition-colors"
                >
                  Tampilkan {Math.min(10, filteredItems.length - visibleCount)} entri lainnya
                  <span className="ml-2 opacity-60">({visibleCount}/{filteredItems.length})</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      {!loading && filteredItems.length > 0 && (
        <div className="border-t border-[var(--brand-border)] px-4 md:px-5 py-3 bg-[var(--brand-surface-2)] flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--brand-ink-muted)]">
            ✦ Akhir daftar
          </span>
          <button
            onClick={() => {
              const form = document.getElementById('aspirasi-name-input')
              ;(form as HTMLInputElement | null)?.focus()
            }}
            className="font-condensed text-xs uppercase tracking-widest text-[var(--brand-navy)] hover:text-[var(--brand-orange)] flex items-center gap-1"
          >
            Kirim Aspirasi <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  )
}

/** Highlights a word inside text with a yellow background */
function HighlightText({ text, word }: { text: string; word: string }) {
  const regex = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === word.toLowerCase() ? (
          <mark key={i} className="bg-[var(--brand-orange)]/30 text-[var(--brand-ink)] px-0.5 rounded-sm">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  )
}
