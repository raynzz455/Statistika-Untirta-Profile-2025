'use client'

import { Plus, X, Calendar, MapPin, Clock, Edit2, Trash2, CalendarPlus, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { PlaceholderImage } from '@/components/PlaceholderImage'
import { EventRSVP } from '@/components/EventRSVP'
import { ScrollReveal } from '@/components/ScrollReveal'
import { ImageUploader } from '@/components/ImageUploader'
import { toast } from 'sonner'

interface Event {
  id: string
  title: string
  description: string | null
  location: string | null
  startDate: string
  endDate: string | null
  category: string
  imageUrl: string | null
  organizerId: string
  recurrence?: string
  recurrenceEndDate?: string | null
}

// ============================================================================
// Date formatting helpers
// ============================================================================
// The schema stores startDate/endDate as String (ISO format from
// datetime-local input: "2025-10-28T08:00"). We format to a friendly
// Indonesian display: "28 Okt 2025, 08:00 WIB".
// Falls back gracefully if the string is already a display format
// (legacy data: "28 Okt 2025, 08:00") — just shows it as-is.

function formatEventDate(raw: string | null | undefined): string {
  if (!raw) return ''
  // Try parsing as ISO (from datetime-local input)
  const d = new Date(raw)
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) + ' WIB'
  }
  // Fallback: show the raw string (legacy data or user-typed)
  return raw
}

const CATEGORIES = ['Akademik', 'Sosial', 'Olahraga', 'Lomba', 'Workshop']

export function EventsView() {
  const user = useAppStore((s) => s.user)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('Semua')
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<Event | null>(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
    category: 'Akademik',
    imageUrl: '',
    recurrence: 'none' as 'none' | 'daily' | 'weekly' | 'monthly',
    recurrenceEndDate: '',
  })

  const load = () => {
    setLoading(true)
    // cache: 'no-store' — bypass browser cache so events list always
    // shows fresh data after a user creates/edits an event.
    fetch('/api/events', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setEvents(Array.isArray(d.events) ? d.events : []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = activeCategory === 'Semua' ? events : events.filter((e) => e.category === activeCategory)

  const openAdd = () => {
    setEditing(null)
    setForm({
      title: '',
      description: '',
      location: '',
      startDate: '',
      endDate: '',
      category: 'Akademik',
      imageUrl: '',
      recurrence: 'none',
      recurrenceEndDate: '',
    })
    setShowAdd(true)
  }

  const openEdit = (e: Event) => {
    setEditing(e)
    setForm({
      title: e.title,
      description: e.description || '',
      location: e.location || '',
      startDate: e.startDate,
      endDate: e.endDate || '',
      category: e.category,
      imageUrl: e.imageUrl || '',
      recurrence: (e.recurrence || 'none') as 'none' | 'daily' | 'weekly' | 'monthly',
      recurrenceEndDate: e.recurrenceEndDate || '',
    })
    setShowAdd(true)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.startDate) {
      toast.error('Judul dan tanggal mulai wajib diisi.')
      return
    }
    if (editing) {
      const res = await fetch(`/api/events/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await res.json()
      if (d.error) return toast.error(d.error)
      toast.success('Event diperbarui!')
    } else {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await res.json()
      if (d.error) return toast.error(d.error)
      toast.success('Event dibuat!')
    }
    setShowAdd(false)
    setEditing(null)
    load()
  }

  const remove = async (id: string) => {
    if (!confirm('Hapus event ini?')) return
    const res = await fetch(`/api/events/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Event dihapus.')
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
              Agenda <span className="italic text-[var(--brand-navy)]">Event</span>
            </h1>
            <p className="uppercase tracking-widest text-sm font-bold text-[var(--brand-ink)]/70">
              Jadwal kegiatan angkatan Statistika '25
            </p>
          </div>
          {user && (
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 bg-[var(--brand-ink)] text-white px-4 py-2 font-condensed uppercase tracking-widest text-xs font-bold hover:bg-[var(--brand-maroon)] transition-colors flex-shrink-0"
            >
              <Plus className="w-4 h-4" /> Buat Event
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
              {editing ? 'Edit Event' : 'Buat Event Baru'}
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
              <label className="block text-xs font-condensed uppercase font-bold mb-1">Judul Event</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-[var(--brand-ink)] p-2 text-sm bg-[var(--brand-surface)]"
                placeholder="Workshop R untuk Analisis Data"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-condensed uppercase font-bold mb-1">Deskripsi</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full border border-[var(--brand-ink)] p-2 text-sm bg-[var(--brand-surface)] resize-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-condensed uppercase font-bold mb-1">Lokasi</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full border border-[var(--brand-ink)] p-2 text-sm bg-[var(--brand-surface)]"
                placeholder="Auditorium Gedung C, Kampus Cilegon"
              />
            </div>
            <div>
              <label className="block text-xs font-condensed uppercase font-bold mb-1">Mulai</label>
              <input
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full border border-[var(--brand-ink)] p-2 text-sm bg-[var(--brand-surface)]"
              />
            </div>
            <div>
              <label className="block text-xs font-condensed uppercase font-bold mb-1">Selesai (opsional)</label>
              <input
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full border border-[var(--brand-ink)] p-2 text-sm bg-[var(--brand-surface)]"
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
              <label className="block text-xs font-condensed uppercase font-bold mb-1">Pengulangan</label>
              <select
                value={form.recurrence}
                onChange={(e) => setForm({ ...form, recurrence: e.target.value })}
                className="w-full border border-[var(--brand-ink)] p-2 text-sm bg-[var(--brand-surface)]"
              >
                <option value="none">Tidak berulang</option>
                <option value="daily">Harian</option>
                <option value="weekly">Mingguan</option>
                <option value="monthly">Bulanan</option>
              </select>
            </div>
            {form.recurrence !== 'none' && (
              <div>
                <label className="block text-xs font-condensed uppercase font-bold mb-1">Berakhir sampai (opsional)</label>
                <input
                  type="text"
                  value={form.recurrenceEndDate}
                  onChange={(e) => setForm({ ...form, recurrenceEndDate: e.target.value })}
                  className="w-full border border-[var(--brand-ink)] p-2 text-sm bg-[var(--brand-surface)]"
                  placeholder="cth: 31 Des 2025"
                />
              </div>
            )}
            <div className="md:col-span-2">
              <ImageUploader
                value={form.imageUrl}
                onChange={(url) => setForm({ ...form, imageUrl: url })}
                label="Gambar Event (opsional)"
                hint="Upload file atau tempel URL gambar. Otomatis diresize ke 3 varian (sm/md/lg)."
                altText={form.title || 'Gambar event'}
                grayscale
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
              {editing ? 'Simpan' : 'Buat Event'}
            </button>
          </div>
        </form>
      )}

      {/* Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
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
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border border-[var(--brand-ink)] p-4 bg-[var(--brand-surface-2)] flex gap-4">
              <div className="w-24 h-24 bg-[var(--brand-orange)]/15/40 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-[var(--brand-orange)]/15/40 animate-pulse w-2/3" />
                <div className="h-3 bg-[var(--brand-orange)]/15/40 animate-pulse" />
                <div className="h-3 bg-[var(--brand-orange)]/15/40 animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-[var(--brand-ink)]/30">
          <p className="font-serif italic text-2xl text-[var(--brand-ink)]/50 mb-2">Belum ada event</p>
          <p className="text-sm text-[var(--brand-ink-muted)]">Buat event pertama untuk angkatan!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((e, i) => (
            <ScrollReveal
              key={e.id}
              delay={((i % 4) + 1) as 1 | 2 | 3 | 4}
              className="border border-[var(--brand-ink)] p-4 bg-[var(--brand-surface-2)] flex flex-col md:flex-row gap-4 hover:shadow-hard transition-shadow group lift-on-hover"
            >
              <div className="md:w-48 flex-shrink-0">
                <div className="aspect-[4/3] border border-[var(--brand-ink)]">
                  <PlaceholderImage alt={e.title} src={e.imageUrl || undefined} grayscale />
                </div>
              </div>
              <div className="flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-[var(--brand-navy)]/15 border border-[var(--brand-ink)] px-2 py-0.5 text-[9px] uppercase tracking-widest font-bold">
                        {e.category}
                      </span>
                    </div>
                    <h3 className="font-serif font-bold text-xl leading-tight">{e.title}</h3>
                  </div>
                  {user && (user.role === 'admin' || user.id === e.organizerId) && (
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => openEdit(e)}
                        className="w-7 h-7 flex items-center justify-center border border-[var(--brand-ink)] hover:bg-[var(--brand-ink)] hover:text-white transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => remove(e.id)}
                        className="w-7 h-7 flex items-center justify-center border border-[var(--brand-maroon)] text-[var(--brand-navy)] hover:bg-[var(--brand-maroon)] hover:text-white transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
                {e.description && (
                  <p className="text-sm text-[var(--brand-ink)]/80 mb-3 line-clamp-2">{e.description}</p>
                )}
                <div className="flex flex-wrap gap-4 text-xs text-[var(--brand-ink-muted)] mt-auto">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {formatEventDate(e.startDate)}
                    {e.endDate && ` – ${formatEventDate(e.endDate)}`}
                  </span>
                  {e.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {e.location}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Upcoming
                  </span>
                  {e.recurrence && e.recurrence !== 'none' && (
                    <span className="inline-flex items-center gap-1 text-[var(--brand-orange)] font-bold">
                      <RefreshCw className="w-3 h-3" /> {e.recurrence === 'daily' ? 'Harian' : e.recurrence === 'weekly' ? 'Mingguan' : 'Bulanan'}
                      {e.recurrenceEndDate && ` sampai ${e.recurrenceEndDate}`}
                    </span>
                  )}
                </div>

                {/* RSVP + Calendar export section */}
                <div className="mt-4 pt-3 border-t border-dashed border-[var(--brand-border)] flex flex-col gap-3">
                  <EventRSVP eventId={e.id} />
                  <a
                    href={`/api/events/${e.id}/ical`}
                    download
                    className="inline-flex items-center gap-1.5 self-start px-3 py-1.5 text-[10px] uppercase tracking-widest font-condensed border border-[var(--brand-ink)] bg-[var(--brand-surface-2)] hover:bg-[var(--brand-orange)]/15 hover:border-[var(--brand-orange)] transition-colors"
                    title="Tambahkan ke kalender (.ics)"
                  >
                    <CalendarPlus className="w-3 h-3" /> Tambah ke Kalender (.ics)
                  </a>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      )}
    </div>
  )
}
