'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { PlaceholderImage } from '@/components/PlaceholderImage'
import { ScrollReveal } from '@/components/ScrollReveal'
import { ArrowLeft, Mail, BookOpen, Award, Edit2, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

interface Dosen {
  id: string
  name: string
  title: string | null
  role: string
  expertise: string | null
  bio: string | null
  email: string | null
  imageUrl: string | null
  courses: string | null
  order: number
}

export function DosenDetailView() {
  const selectedId = useAppStore((s) => s.selectedId)
  const setView = useAppStore((s) => s.setView)
  const user = useAppStore((s) => s.user)
  const [dosen, setDosen] = useState<Dosen | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Partial<Dosen>>({})

  useEffect(() => {
    if (!selectedId) { setLoading(false); return }
    fetch(`/api/dosen/${selectedId}`)
      .then((r) => r.json())
      .then((d) => {
        setDosen(d.dosen || null)
        setForm(d.dosen || {})
      })
      .catch(() => setDosen(null))
      .finally(() => setLoading(false))
  }, [selectedId])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch(`/api/dosen/${selectedId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const d = await res.json()
    if (d.error) { toast.error(d.error); return }
    setDosen(d.dosen)
    setEditing(false)
    toast.success('Data dosen diperbarui.')
  }

  const remove = async () => {
    if (!confirm('Hapus dosen ini?')) return
    await fetch(`/api/dosen/${selectedId}`, { method: 'DELETE' })
    toast.success('Dosen dihapus.')
    setView('about')
  }

  if (loading) {
    return <div className="max-w-3xl mx-auto"><div className="h-8 skeleton-shimmer w-1/3 mb-4" /><div className="aspect-[3/4] w-48 skeleton-shimmer" /></div>
  }

  if (!dosen) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <h2 className="font-serif text-3xl mb-4">Dosen tidak ditemukan</h2>
        <button onClick={() => setView('about')} className="text-[var(--brand-navy)] underline">Kembali</button>
      </div>
    )
  }

  const fullName = dosen.title ? `${dosen.title} ${dosen.name}` : dosen.name

  return (
    <div className="max-w-3xl mx-auto page-enter">
      <button
        onClick={() => setView('about')}
        className="inline-flex items-center text-xs uppercase tracking-widest mb-6 hover:text-[var(--brand-navy)]"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Tentang
      </button>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Photo */}
        <div className="md:col-span-4">
          <div className="border border-[var(--brand-border)] p-3 bg-[var(--brand-surface-2)] sticky top-20">
            <div className="aspect-[3/4] border border-[var(--brand-border)] overflow-hidden">
              <PlaceholderImage alt={`Foto ${dosen.name}`} src={dosen.imageUrl || undefined} grayscale />
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="md:col-span-8">
          <div className="flex items-start justify-between gap-2 mb-4">
            <div>
              <span className="inline-block bg-[var(--brand-navy)] text-[var(--brand-surface)] px-2 py-0.5 text-[10px] uppercase tracking-widest font-condensed mb-2">
                {dosen.role}
              </span>
              <h1 className="font-serif text-3xl md:text-4xl leading-tight break-words">{fullName}</h1>
            </div>
            {user?.role === 'admin' && !editing && (
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => setEditing(true)} className="p-1.5 border border-[var(--brand-border)] hover:border-[var(--brand-navy)]" title="Edit">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={remove} className="p-1.5 border border-[var(--brand-maroon)] text-[var(--brand-maroon)] hover:bg-[var(--brand-maroon)] hover:text-white" title="Hapus">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {editing ? (
            <form onSubmit={save} className="space-y-3 border border-[var(--brand-border)] p-4 bg-[var(--brand-surface-2)]">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-condensed text-sm uppercase tracking-widest text-[var(--brand-navy)]">Edit Dosen</h3>
                <button type="button" onClick={() => setEditing(false)}><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama" className="border border-[var(--brand-border)] p-2 text-sm bg-[var(--brand-surface)]" />
                <input value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Gelar (Dr., M.Si)" className="border border-[var(--brand-border)] p-2 text-sm bg-[var(--brand-surface)]" />
                <input value={form.role || ''} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Role (Kaprodi/Dosen)" className="border border-[var(--brand-border)] p-2 text-sm bg-[var(--brand-surface)]" />
                <input value={form.expertise || ''} onChange={(e) => setForm({ ...form, expertise: e.target.value })} placeholder="Bidang Keahlian" className="border border-[var(--brand-border)] p-2 text-sm bg-[var(--brand-surface)]" />
                <input value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="border border-[var(--brand-border)] p-2 text-sm bg-[var(--brand-surface)]" />
                <input value={form.imageUrl || ''} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="URL Foto" className="border border-[var(--brand-border)] p-2 text-sm bg-[var(--brand-surface)]" />
              </div>
              <textarea value={form.bio || ''} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Biografi" rows={3} className="w-full border border-[var(--brand-border)] p-2 text-sm bg-[var(--brand-surface)] resize-none" />
              <textarea value={form.courses || ''} onChange={(e) => setForm({ ...form, courses: e.target.value })} placeholder="Mata kuliah (pisah koma)" rows={2} className="w-full border border-[var(--brand-border)] p-2 text-sm bg-[var(--brand-surface)] resize-none" />
              <button type="submit" className="bg-[var(--brand-navy)] text-[var(--brand-surface)] px-4 py-2 text-xs uppercase font-condensed tracking-widest">Simpan</button>
            </form>
          ) : (
            <div className="space-y-4">
              {dosen.expertise && (
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-[var(--brand-orange)] flex-shrink-0" />
                  <span className="text-sm font-body text-[var(--brand-ink-muted)]">{dosen.expertise}</span>
                </div>
              )}
              {dosen.bio && (
                <div>
                  <h3 className="text-[10px] uppercase tracking-widest mb-2 border-b border-[var(--brand-border)] pb-1 text-[var(--brand-ink-muted)]">Biografi</h3>
                  <p className="text-sm leading-relaxed text-[var(--brand-ink)]/80">{dosen.bio}</p>
                </div>
              )}
              {dosen.courses && (
                <div>
                  <h3 className="text-[10px] uppercase tracking-widest mb-2 border-b border-[var(--brand-border)] pb-1 text-[var(--brand-ink-muted)]">Mata Kuliah</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {dosen.courses.split(',').map((c, i) => (
                      <span key={i} className="text-[10px] uppercase tracking-widest font-condensed border border-[var(--brand-border)] px-2 py-0.5 bg-[var(--brand-surface-2)]">{c.trim()}</span>
                    ))}
                  </div>
                </div>
              )}
              {dosen.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[var(--brand-navy)] flex-shrink-0" />
                  <span className="text-sm font-mono">{dosen.email}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
