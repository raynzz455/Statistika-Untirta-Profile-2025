'use client'

import { ArrowLeft, Instagram, MapPin, Globe, Briefcase, Award, Plus, Pencil, Trash2, X, ExternalLink, Calendar } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { PlaceholderImage } from '@/components/PlaceholderImage'
import { MusicPlayer } from '@/components/MusicPlayer'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface PortfolioItem {
  id: string
  type: 'website' | 'project' | 'certificate'
  title: string
  description: string | null
  url: string | null
  imageUrl: string | null
  issuer: string | null
  date: string | null
  order: number
}

interface Student {
  id: string
  name: string
  nickname: string | null
  nim: string
  kelas: string
  tagline: string | null
  bio: string | null
  instagram: string | null
  asalDaerah: string | null
  imageUrl: string | null
  lagu: string | null
  laguArtis: string | null
  laguUrl: string | null
  portfolios?: PortfolioItem[]
}

const TYPE_META: Record<PortfolioItem['type'], { label: string; icon: typeof Globe; color: string }> = {
  website: { label: 'Website', icon: Globe, color: 'text-[var(--brand-navy)]' },
  project: { label: 'Program Kerja', icon: Briefcase, color: 'text-[var(--brand-orange)]' },
  certificate: { label: 'Sertifikat', icon: Award, color: 'text-[var(--brand-navy)]' },
}

export function ProfileView() {
  const selectedId = useAppStore((s) => s.selectedId)
  const setView = useAppStore((s) => s.setView)
  const user = useAppStore((s) => s.user)
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showPortfolioForm, setShowPortfolioForm] = useState(false)
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null)

  const load = () => {
    if (!selectedId) { setLoading(false); return }
    fetch(`/api/students/${selectedId}`)
      .then((r) => r.json())
      .then((d) => setStudent(d.student || null))
      .catch(() => setStudent(null))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [selectedId, refreshKey]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-4"><div className="aspect-[3/4] skeleton-shimmer border border-[var(--brand-border)]" /></div>
          <div className="md:col-span-8 space-y-3">
            <div className="h-12 skeleton-shimmer w-full" />
            <div className="h-4 skeleton-shimmer w-3/4" />
            <div className="h-4 skeleton-shimmer w-2/3" />
          </div>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <h2 className="font-serif text-3xl mb-4">Mahasiswa tidak ditemukan</h2>
        <button onClick={() => setView('directory')} className="text-[var(--brand-navy)] underline">Kembali ke Direktori</button>
      </div>
    )
  }

  const canEdit = !!(user && (user.role === 'admin' || user.id === student.id))
  const portfolios = student.portfolios || []
  const byType = (type: PortfolioItem['type']) => portfolios.filter((p) => p.type === type)

  const refresh = () => {
    setRefreshKey((k) => k + 1)
    setShowPortfolioForm(false)
    setEditingItem(null)
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm('Hapus item portofolio ini?')) return
    try {
      const res = await fetch(`/api/students/${selectedId}/portfolio/${itemId}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json()
        toast.error(d.error || 'Gagal menghapus')
      } else {
        toast.success('Item portofolio dihapus.')
        refresh()
      }
    } catch {
      toast.error('Gagal terhubung ke server.')
    }
  }

  return (
    <div className="max-w-5xl mx-auto page-enter">
      <button
        onClick={() => setView('directory')}
        className="inline-flex items-center text-xs uppercase tracking-widest mb-6 hover:text-[var(--brand-navy)] transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Direktori
      </button>

      {/* Layout: photo sidebar (left) + info (right, wider) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
        {/* Photo sidebar */}
        <div className="md:col-span-4">
          <div className="border border-[var(--brand-border)] bg-[var(--brand-surface-2)] p-3 sticky top-20">
            <div className="aspect-[3/4] border border-[var(--brand-border)] overflow-hidden">
              <PlaceholderImage alt={`Foto ${student.name}`} src={student.imageUrl || undefined} grayscale />
            </div>
            <div className="mt-3 text-center space-y-1">
              <p className="font-serif italic text-lg">{student.name}</p>
              {student.nickname && <p className="font-condensed text-[10px] uppercase tracking-widest text-[var(--brand-orange)]">&ldquo;{student.nickname}&rdquo;</p>}
              <p className="font-mono text-[10px] text-[var(--brand-ink-muted)]">NIM. {student.nim}</p>
              <div className="inline-flex items-center gap-1.5 mt-2 border border-[var(--brand-border)] px-2 py-0.5">
                <span className="bg-[var(--brand-navy)] text-[var(--brand-surface)] w-4 h-4 text-[10px] flex items-center justify-center font-bold">{student.kelas}</span>
                <span className="text-[9px] uppercase tracking-widest font-condensed text-[var(--brand-ink-muted)]">Kelas</span>
              </div>
            </div>
            {canEdit && (
              <button
                onClick={() => setView('settings')}
                className="w-full mt-3 bg-[var(--brand-navy)] text-[var(--brand-surface)] text-[10px] font-condensed uppercase tracking-widest py-2 hover:bg-[var(--brand-navy-light)] transition-colors"
              >
                Edit Profil
              </button>
            )}
          </div>
        </div>

        {/* Info area — wider, name flows horizontally */}
        <div className="md:col-span-8">
          {/* Name */}
          <h1 className="font-serif text-3xl md:text-5xl font-bold leading-tight mb-2 break-words">
            {student.name}
          </h1>
          {student.nickname && (
            <p className="font-serif italic text-lg text-[var(--brand-orange)] mb-4">&ldquo;{student.nickname}&rdquo;</p>
          )}

          {/* Tagline */}
          <div className="mb-6">
            <h3 className="text-[10px] uppercase tracking-widest mb-2 border-b border-[var(--brand-border)] pb-1 text-[var(--brand-ink-muted)]">
              Tagline
            </h3>
            <p className="text-lg font-serif italic border-l-4 border-[var(--brand-navy)] pl-3">
              {student.tagline || 'Mahasiswa Statistika yang sedang belajar.'}
            </p>
          </div>

          {/* Lagu Tema */}
          {(student.lagu || student.laguUrl) && (
            <div className="mb-6">
              <h3 className="text-[10px] uppercase tracking-widest mb-2 border-b border-[var(--brand-border)] pb-1 text-[var(--brand-ink-muted)]">
                Lagu Tema
              </h3>
              <MusicPlayer songTitle={student.lagu} artist={student.laguArtis} audioUrl={student.laguUrl} variant="full" />
            </div>
          )}

          {/* Biografi / Autobiografi */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2 border-b border-[var(--brand-border)] pb-1">
              <h3 className="text-[10px] uppercase tracking-widest text-[var(--brand-ink-muted)]">
                Biografi
              </h3>
              {portfolios.length > 0 && (
                <span className="font-mono text-[9px] text-[var(--brand-ink-muted)]">
                  {portfolios.length} portofolio
                </span>
              )}
            </div>
            {student.bio ? (
              <div className="text-sm leading-relaxed text-[var(--brand-ink)]/80 space-y-2">
                {student.bio.split('\n').map((para, i) => (
                  <p key={i} className={i === 0 ? 'first-letter:font-serif first-letter:text-4xl first-letter:font-bold first-letter:mr-1 first-letter:float-left first-letter:leading-none first-letter:text-[var(--brand-navy)]' : ''}>
                    {para}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-sm italic text-[var(--brand-ink-muted)]">
                Biografi belum diisi. {canEdit && 'Klik "Edit Profil" untuk menambahkan.'}
              </p>
            )}
          </div>

          {/* === PORTFOLIO SECTIONS === */}
          <PortfolioSection
            type="website"
            items={byType('website')}
            canEdit={canEdit}
            onAdd={() => { setEditingItem(null); setShowPortfolioForm(true) }}
            onEdit={(item) => { setEditingItem(item); setShowPortfolioForm(true) }}
            onDelete={handleDelete}
          />
          <PortfolioSection
            type="project"
            items={byType('project')}
            canEdit={canEdit}
            onAdd={() => { setEditingItem(null); setShowPortfolioForm(true) }}
            onEdit={(item) => { setEditingItem(item); setShowPortfolioForm(true) }}
            onDelete={handleDelete}
          />
          <PortfolioSection
            type="certificate"
            items={byType('certificate')}
            canEdit={canEdit}
            onAdd={() => { setEditingItem(null); setShowPortfolioForm(true) }}
            onEdit={(item) => { setEditingItem(item); setShowPortfolioForm(true) }}
            onDelete={handleDelete}
          />

          {/* Contact info */}
          <div className="flex flex-wrap gap-3 mt-6">
            {student.instagram && (
              <span className="inline-flex items-center gap-1.5 text-xs border border-[var(--brand-border)] px-3 py-1.5 bg-[var(--brand-surface-2)]">
                <Instagram className="w-3.5 h-3.5 text-[var(--brand-navy)]" /> {student.instagram}
              </span>
            )}
            {student.asalDaerah && (
              <span className="inline-flex items-center gap-1.5 text-xs border border-[var(--brand-border)] px-3 py-1.5 bg-[var(--brand-surface-2)]">
                <MapPin className="w-3.5 h-3.5 text-[var(--brand-navy)]" /> {student.asalDaerah}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Portfolio add/edit form (modal) */}
      {showPortfolioForm && canEdit && (
        <PortfolioForm
          studentId={selectedId!}
          item={editingItem}
          onClose={refresh}
        />
      )}
    </div>
  )
}

// ============================================================================
// PortfolioSection — displays items grouped by type
// ============================================================================

function PortfolioSection({
  type,
  items,
  canEdit,
  onAdd,
  onEdit,
  onDelete,
}: {
  type: PortfolioItem['type']
  items: PortfolioItem[]
  canEdit: boolean
  onAdd: () => void
  onEdit: (item: PortfolioItem) => void
  onDelete: (id: string) => void
}) {
  const meta = TYPE_META[type]
  const Icon = meta.icon

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3 border-b border-[var(--brand-border)] pb-1">
        <h3 className="text-[10px] uppercase tracking-widest text-[var(--brand-ink-muted)] flex items-center gap-2">
          <Icon className={cn('w-3.5 h-3.5', meta.color)} />
          {meta.label}
          {items.length > 0 && (
            <span className="font-mono text-[9px] text-[var(--brand-ink-muted)]">({items.length})</span>
          )}
        </h3>
        {canEdit && (
          <button
            onClick={onAdd}
            className="text-[10px] uppercase tracking-widest font-condensed text-[var(--brand-navy)] hover:text-[var(--brand-orange)] flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Tambah
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-sm italic text-[var(--brand-ink-muted)] py-2">
          Belum ada {meta.label.toLowerCase()}.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((item) => (
            <PortfolioCard
              key={item.id}
              item={item}
              canEdit={canEdit}
              onEdit={() => onEdit(item)}
              onDelete={() => onDelete(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// PortfolioCard — single portfolio item
// ============================================================================

function PortfolioCard({
  item,
  canEdit,
  onEdit,
  onDelete,
}: {
  item: PortfolioItem
  canEdit: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const meta = TYPE_META[item.type]
  const Icon = meta.icon

  return (
    <div className="group border border-[var(--brand-border)] bg-[var(--brand-surface-2)] hover:border-[var(--brand-navy)] transition-all overflow-hidden flex flex-col">
      {/* Image (if exists) */}
      {item.imageUrl && (
        <a
          href={item.url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="block aspect-[16/9] border-b border-[var(--brand-border)] overflow-hidden bg-[var(--brand-surface-3)]"
        >
          <PlaceholderImage alt={item.title} src={item.imageUrl} />
        </a>
      )}

      <div className="p-3 flex-grow flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-1">
          <Icon className={cn('w-4 h-4 flex-shrink-0 mt-0.5', meta.color)} />
          {canEdit && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={onEdit}
                className="p-1 hover:bg-[var(--brand-orange)]/15 text-[var(--brand-ink-muted)] hover:text-[var(--brand-navy)]"
                aria-label="Edit"
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button
                onClick={onDelete}
                className="p-1 hover:bg-[var(--brand-orange)]/15 text-[var(--brand-ink-muted)] hover:text-[var(--brand-orange)]"
                aria-label="Hapus"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        <h4 className="font-serif font-bold text-sm leading-tight mb-1 group-hover:text-[var(--brand-navy)]">
          {item.title}
        </h4>

        {item.description && (
          <p className="text-xs text-[var(--brand-ink-muted)] leading-relaxed line-clamp-2 mb-2">
            {item.description}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 text-[10px] text-[var(--brand-ink-muted)]">
          <div className="flex items-center gap-2 flex-wrap">
            {item.issuer && (
              <span className="font-mono uppercase tracking-wider">{item.issuer}</span>
            )}
            {item.date && (
              <span className="inline-flex items-center gap-1 font-mono">
                <Calendar className="w-2.5 h-2.5" />
                {formatDate(item.date)}
              </span>
            )}
          </div>
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[var(--brand-navy)] hover:text-[var(--brand-orange)] font-condensed uppercase tracking-widest"
            >
              Buka <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// PortfolioForm — add/edit modal form
// ============================================================================

function PortfolioForm({
  studentId,
  item,
  onClose,
}: {
  studentId: string
  item: PortfolioItem | null
  onClose: () => void
}) {
  const isEdit = !!item
  const [form, setForm] = useState({
    type: item?.type ?? 'website',
    title: item?.title ?? '',
    description: item?.description ?? '',
    url: item?.url ?? '',
    imageUrl: item?.imageUrl ?? '',
    issuer: item?.issuer ?? '',
    date: item?.date ?? '',
    order: item?.order ?? 0,
  })
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ title?: string; url?: string }>({})

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: { title?: string; url?: string } = {}
    if (form.title.trim().length < 3) errs.title = 'Judul minimal 3 karakter.'
    if (form.url && !form.url.startsWith('http://') && !form.url.startsWith('https://')) {
      errs.url = 'URL harus diawali http:// atau https://'
    }
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSubmitting(true)
    try {
      const url = isEdit
        ? `/api/students/${studentId}/portfolio/${item!.id}`
        : `/api/students/${studentId}/portfolio`
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await res.json()
      if (!res.ok) {
        toast.error(d.error || 'Gagal menyimpan.')
      } else {
        toast.success(isEdit ? 'Item diperbarui.' : 'Item ditambahkan.')
        onClose()
      }
    } catch {
      toast.error('Gagal terhubung ke server.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[var(--brand-surface)] w-full max-w-lg border border-[var(--brand-ink)] max-h-[90vh] overflow-y-auto custom-scroll"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[var(--brand-navy)] text-[var(--brand-surface)] px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <h3 className="font-condensed text-sm uppercase tracking-widest">
            {isEdit ? 'Edit Portofolio' : 'Tambah Portofolio'}
          </h3>
          <button onClick={onClose} aria-label="Tutup" className="hover:text-[var(--brand-orange)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="p-4 space-y-4">
          {/* Type selector */}
          <div>
            <label className="block font-condensed text-xs uppercase tracking-widest text-[var(--brand-ink-muted)] mb-1.5">
              Tipe <span className="text-[var(--brand-orange)]">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['website', 'project', 'certificate'] as const).map((t) => {
                const m = TYPE_META[t]
                const Icon = m.icon
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, type: t })}
                    className={cn(
                      'border p-2 flex flex-col items-center gap-1 transition-colors',
                      form.type === t
                        ? 'bg-[var(--brand-navy)] text-[var(--brand-surface)] border-[var(--brand-navy)]'
                        : 'border-[var(--brand-border)] hover:border-[var(--brand-navy)]'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[9px] uppercase tracking-widest font-condensed">{m.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block font-condensed text-xs uppercase tracking-widest text-[var(--brand-ink-muted)] mb-1.5">
              Judul <span className="text-[var(--brand-orange)]">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              maxLength={120}
              placeholder={form.type === 'website' ? 'cth: Portfolio Website' : form.type === 'project' ? 'cth: HIMASTA Research 2024' : 'cth: Sertifikat Data Analyst Google'}
              className={cn(
                'w-full px-3 py-2 border-b-2 bg-transparent text-sm focus:outline-none transition-colors',
                errors.title ? 'border-[var(--brand-orange)]' : 'border-[var(--brand-border)] focus:border-[var(--brand-navy)]'
              )}
            />
            {errors.title && (
              <p className="text-xs text-[var(--brand-orange)] mt-1">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block font-condensed text-xs uppercase tracking-widest text-[var(--brand-ink-muted)] mb-1.5">
              Deskripsi Singkat
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              maxLength={500}
              rows={3}
              placeholder="Deskripsikan singkat..."
              className="w-full px-3 py-2 border border-[var(--brand-border)] bg-[var(--brand-surface-2)] text-sm focus:outline-none focus:border-[var(--brand-navy)] resize-none"
            />
          </div>

          {/* URL */}
          <div>
            <label className="block font-condensed text-xs uppercase tracking-widest text-[var(--brand-ink-muted)] mb-1.5">
              URL {form.type === 'website' ? '(website)' : form.type === 'project' ? '(repo/demo)' : '(verify link)'}
            </label>
            <input
              type="url"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://..."
              className={cn(
                'w-full px-3 py-2 border-b-2 bg-transparent text-sm font-mono focus:outline-none transition-colors',
                errors.url ? 'border-[var(--brand-orange)]' : 'border-[var(--brand-border)] focus:border-[var(--brand-navy)]'
              )}
            />
            {errors.url && (
              <p className="text-xs text-[var(--brand-orange)] mt-1">{errors.url}</p>
            )}
          </div>

          {/* Image URL */}
          <div>
            <label className="block font-condensed text-xs uppercase tracking-widest text-[var(--brand-ink-muted)] mb-1.5">
              URL Gambar {form.type === 'certificate' ? '(foto sertifikat)' : '(thumbnail/screenshot)'}
            </label>
            <input
              type="url"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-2 border-b-2 bg-transparent text-sm font-mono focus:outline-none border-[var(--brand-border)] focus:border-[var(--brand-navy)]"
            />
          </div>

          {/* Issuer (for certificates) */}
          {form.type === 'certificate' && (
            <div>
              <label className="block font-condensed text-xs uppercase tracking-widest text-[var(--brand-ink-muted)] mb-1.5">
                Penerbit Sertifikat
              </label>
              <input
                type="text"
                value={form.issuer}
                onChange={(e) => setForm({ ...form, issuer: e.target.value })}
                placeholder="cth: Google, BNSP, Cisco, dll"
                className="w-full px-3 py-2 border-b-2 bg-transparent text-sm focus:outline-none border-[var(--brand-border)] focus:border-[var(--brand-navy)]"
              />
            </div>
          )}

          {/* Date + Order */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-condensed text-xs uppercase tracking-widest text-[var(--brand-ink-muted)] mb-1.5">
                Tanggal
              </label>
              <input
                type="month"
                value={form.date?.slice(0, 7) ?? ''}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 border-b-2 bg-transparent text-sm font-mono focus:outline-none border-[var(--brand-border)] focus:border-[var(--brand-navy)]"
              />
            </div>
            <div>
              <label className="block font-condensed text-xs uppercase tracking-widest text-[var(--brand-ink-muted)] mb-1.5">
                Urutan
              </label>
              <input
                type="number"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                min={0}
                max={999}
                className="w-full px-3 py-2 border-b-2 bg-transparent text-sm font-mono focus:outline-none border-[var(--brand-border)] focus:border-[var(--brand-navy)]"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--brand-border)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs uppercase tracking-widest font-condensed text-[var(--brand-ink-muted)] hover:text-[var(--brand-ink)]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[var(--brand-navy)] text-[var(--brand-surface)] text-xs uppercase tracking-widest font-condensed hover:bg-[var(--brand-navy-light)] disabled:opacity-50"
            >
              {submitting ? 'Menyimpan…' : isEdit ? 'Simpan Perubahan' : 'Tambah'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ============================================================================
// Helpers
// ============================================================================

function formatDate(iso: string): string {
  try {
    const d = new Date(iso + (iso.length === 7 ? '-01' : ''))
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    return `${months[d.getMonth()]} ${d.getFullYear()}`
  } catch {
    return iso
  }
}
