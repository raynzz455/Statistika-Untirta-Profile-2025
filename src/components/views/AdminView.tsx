'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Plus, Edit2, Trash2, Users, FileText, Calendar, Image, BarChart3, CheckSquare, Square, Layers, Download } from 'lucide-react'
import { PlaceholderImage } from '@/components/PlaceholderImage'
import { ImageUploader } from '@/components/ImageUploader'
import { UserManagement } from '@/components/views/UserManagement'
import { AdminAnalytics } from '@/components/AdminAnalytics'
import { toast } from 'sonner'

interface Student {
  id: string
  name: string
  nim: string
  kelas: string
  imageUrl: string | null
  ownerId: string | null
}

interface Stats {
  students: number
  articles: number
  events: number
  gallery: number
  classA: number
  classB: number
}

const emptyForm = { id: '', name: '', nim: '', kelas: 'A', tagline: '', bio: '', instagram: '', asalDaerah: '', imageUrl: '' }

export function AdminView() {
  const user = useAppStore((s) => s.user)
  const setView = useAppStore((s) => s.setView)
  const [stats, setStats] = useState<Stats>({ students: 0, articles: 0, events: 0, gallery: 0, classA: 0, classB: 0 })
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/students').then((r) => r.json()),
      fetch('/api/stats').then((r) => r.json()),
    ])
      .then(([sData, stData]) => {
        setStudents(sData.students || [])
        setStats(stData)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto text-center py-20 border border-[var(--brand-ink)] bg-[var(--brand-surface-2)] p-8">
        <h2 className="font-serif text-3xl mb-2">Akses Ditolak</h2>
        <p className="text-sm text-[var(--brand-ink-muted)] mb-6">
          Halaman ini hanya untuk admin. Silakan login sebagai admin.
        </p>
        <button
          onClick={() => setView('login')}
          className="inline-flex items-center gap-2 bg-[var(--brand-ink)] text-white px-6 py-3 font-condensed uppercase tracking-widest text-xs font-bold hover:bg-[var(--brand-maroon)]"
        >
          Ke Halaman Login
        </button>
      </div>
    )
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.nim) {
      toast.error('Nama dan NIM wajib diisi.')
      return
    }

    const payload = {
      name: form.name,
      nim: form.nim,
      kelas: form.kelas,
      tagline: form.tagline || undefined,
      bio: form.bio || undefined,
      instagram: form.instagram || undefined,
      asalDaerah: form.asalDaerah || undefined,
      imageUrl: form.imageUrl || undefined,
    }

    if (editing && form.id) {
      const res = await fetch(`/api/students/${form.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const d = await res.json()
      if (d.error) return toast.error(d.error)
      toast.success('Data mahasiswa diperbarui.')
    } else {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const d = await res.json()
      if (d.error) return toast.error(d.error)
      toast.success('Mahasiswa baru ditambahkan.')
    }
    setForm(emptyForm)
    setEditing(false)
    setShowForm(false)
    load()
  }

  const handleEdit = (s: Student) => {
    setForm({
      id: s.id,
      name: s.name,
      nim: s.nim,
      kelas: s.kelas,
      tagline: '',
      bio: '',
      instagram: '',
      asalDaerah: '',
      imageUrl: s.imageUrl || '',
    })
    setEditing(true)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus data mahasiswa ini? Tindakan tidak dapat dibatalkan.')) return
    const res = await fetch(`/api/students/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Mahasiswa dihapus.')
      load()
    } else {
      const d = await res.json().catch(() => ({}))
      toast.error(d.error || 'Gagal menghapus.')
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  const toggleSelectAll = () => {
    setSelectedIds((prev) => prev.length === students.length ? [] : students.map((s) => s.id))
  }

  const bulkAction = async (action: 'assign-class' | 'delete', kelas?: 'A' | 'B') => {
    if (selectedIds.length === 0) {
      toast.error('Pilih minimal 1 mahasiswa dulu.')
      return
    }
    const msg = action === 'delete'
      ? `Hapus ${selectedIds.length} mahasiswa terpilih?`
      : `Pindahkan ${selectedIds.length} mahasiswa ke Kelas ${kelas}?`
    if (!confirm(msg)) return

    const res = await fetch('/api/students/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds, action, kelas }),
    })
    const d = await res.json()
    if (d.error) {
      toast.error(d.error)
      return
    }
    toast.success(`${d.affected} mahasiswa ${action === 'delete' ? 'dihapus' : `dipindah ke Kelas ${kelas}`}.`)
    setSelectedIds([])
    load()
  }

  const STAT_CARDS = [
    { label: 'Total Mahasiswa', value: stats.students, icon: Users, color: 'bg-[var(--brand-orange)]/15' },
    { label: 'Artikel', value: stats.articles, icon: FileText, color: 'bg-[var(--brand-navy)]/15' },
    { label: 'Event', value: stats.events, icon: Calendar, color: 'bg-[var(--brand-surface-3)]' },
    { label: 'Galeri Foto', value: stats.gallery, icon: Image, color: 'bg-[var(--brand-orange)]/15' },
  ]

  return (
    <div className="max-w-6xl mx-auto my-8 page-enter">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 pb-4 border-b border-[var(--brand-ink)] gap-4">
        <div>
          <h1 className="font-condensed text-4xl uppercase tracking-tight">Admin Dashboard</h1>
          <p className="font-sans text-sm text-[var(--brand-ink-muted)] mt-1">
            Kelola direktori mahasiswa, artikel, event, dan pengaturan website.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-[var(--brand-orange)]/15 text-[var(--brand-ink)] px-4 py-2 font-condensed uppercase tracking-widest text-xs font-bold border border-[var(--brand-orange)] flex items-center gap-1">
            <BarChart3 className="w-3 h-3" /> Role: Admin
          </span>
          <button
            onClick={() => setView('settings')}
            className="bg-[var(--brand-ink)] text-white px-4 py-2 font-condensed uppercase tracking-widest text-xs font-bold hover:bg-[var(--brand-maroon)]"
          >
            Set Profil
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map((s, i) => (
          <div key={i} className={`border border-[var(--brand-ink)] p-4 ${s.color} shadow-hard`}>
            <s.icon className="w-5 h-5 mb-2 text-[var(--brand-navy)]" />
            <p className="font-condensed text-3xl uppercase leading-none">{s.value}</p>
            <p className="font-condensed text-[10px] uppercase tracking-widest text-[var(--brand-ink)]/70 mt-1 font-bold">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Class breakdown */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="border border-[var(--brand-ink)] p-4 bg-[var(--brand-surface-2)]">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-[var(--brand-ink)] text-white w-10 h-10 flex items-center justify-center font-black text-lg">A</div>
            <div>
              <p className="font-condensed text-xs uppercase tracking-widest text-[var(--brand-ink-muted)]">Kelas A</p>
              <p className="font-condensed text-2xl">{stats.classA} Anggota</p>
            </div>
          </div>
          <button
            onClick={() => setView('classes')}
            className="text-[10px] font-condensed uppercase tracking-widest text-[var(--brand-navy)] font-bold hover:underline"
          >
            Kelola Kelas A →
          </button>
        </div>
        <div className="border border-[var(--brand-ink)] p-4 bg-[var(--brand-surface-2)]">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-[var(--brand-maroon)] text-white w-10 h-10 flex items-center justify-center font-black text-lg">B</div>
            <div>
              <p className="font-condensed text-xs uppercase tracking-widest text-[var(--brand-ink-muted)]">Kelas B</p>
              <p className="font-condensed text-2xl">{stats.classB} Anggota</p>
            </div>
          </div>
          <button
            onClick={() => setView('classes')}
            className="text-[10px] font-condensed uppercase tracking-widest text-[var(--brand-navy)] font-bold hover:underline"
          >
            Kelola Kelas B →
          </button>
        </div>
      </div>

      {/* Quick management links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8">
        {[
          { label: 'Kelola Artikel', view: 'articles' as const },
          { label: 'Kelola Event', view: 'events' as const },
          { label: 'Kelola Galeri', view: 'gallery' as const },
          { label: 'Lihat Direktori', view: 'directory' as const },
        ].map((q) => (
          <button
            key={q.view}
            onClick={() => setView(q.view)}
            className="border border-[var(--brand-ink)] p-3 bg-[var(--brand-surface)] hover:bg-[var(--brand-orange)]/15 hover:shadow-hard transition-all font-condensed uppercase tracking-widest text-[11px] font-bold"
          >
            {q.label} →
          </button>
        ))}
      </div>

      {/* Export data section */}
      <div className="mb-8 border border-[var(--brand-ink)] bg-[var(--brand-surface-2)] p-4">
        <h3 className="font-condensed text-sm uppercase tracking-widest font-bold mb-3 flex items-center gap-2">
          <Download className="w-4 h-4 text-[var(--brand-orange)]" /> Export Data
        </h3>
        <div className="flex flex-wrap gap-2">
          <a
            href="/api/export?format=csv&type=all"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] uppercase tracking-widest font-condensed border border-[var(--brand-ink)] bg-[var(--brand-surface)] hover:bg-[var(--brand-orange)]/15 transition-colors"
          >
            <Download className="w-3 h-3" /> Semua (CSV)
          </a>
          <a
            href="/api/export?format=json&type=all"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] uppercase tracking-widest font-condensed border border-[var(--brand-ink)] bg-[var(--brand-surface)] hover:bg-[var(--brand-orange)]/15 transition-colors"
          >
            <Download className="w-3 h-3" /> Semua (JSON)
          </a>
          <a
            href="/api/export?format=csv&type=articles"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] uppercase tracking-widest font-condensed border border-[var(--brand-ink)] bg-[var(--brand-surface)] hover:bg-[var(--brand-orange)]/15 transition-colors"
          >
            Artikel (CSV)
          </a>
          <a
            href="/api/export?format=csv&type=students"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] uppercase tracking-widest font-condensed border border-[var(--brand-ink)] bg-[var(--brand-surface)] hover:bg-[var(--brand-orange)]/15 transition-colors"
          >
            Mahasiswa (CSV)
          </a>
          <a
            href="/api/export?format=csv&type=events"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] uppercase tracking-widest font-condensed border border-[var(--brand-ink)] bg-[var(--brand-surface)] hover:bg-[var(--brand-orange)]/15 transition-colors"
          >
            Event (CSV)
          </a>
          <a
            href="/api/export?format=csv&type=users"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] uppercase tracking-widest font-condensed border border-[var(--brand-ink)] bg-[var(--brand-surface)] hover:bg-[var(--brand-orange)]/15 transition-colors"
          >
            Users (CSV)
          </a>
        </div>
        <p className="text-[10px] text-[var(--brand-ink-muted)] mt-2">
          Unduh semua data website dalam format CSV atau JSON untuk backup atau analisis eksternal.
        </p>
      </div>

      {/* Student manager */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Form */}
        <div className="md:col-span-1 bg-[var(--brand-surface-2)] border border-[var(--brand-ink)] p-6 h-fit shadow-hard">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-condensed text-xl uppercase tracking-wide">
              {editing ? 'Edit Data' : 'Tambah Mahasiswa'}
            </h3>
            {showForm ? (
              <button
                onClick={() => {
                  setForm(emptyForm)
                  setEditing(false)
                  setShowForm(false)
                }}
                className="text-[10px] uppercase font-condensed text-[var(--brand-ink-muted)] hover:text-[var(--brand-ink)]"
              >
                Tutup
              </button>
            ) : (
              <button
                onClick={() => setShowForm(true)}
                className="text-[10px] uppercase font-condensed bg-[var(--brand-ink)] text-white px-3 py-1 hover:bg-[var(--brand-maroon)]"
              >
                + Baru
              </button>
            )}
          </div>

          {showForm ? (
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-condensed uppercase font-bold mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-[var(--brand-ink)] p-2 text-sm bg-[var(--brand-surface)]"
                />
              </div>
              <div>
                <label className="block text-xs font-condensed uppercase font-bold mb-1">NIM</label>
                <input
                  type="text"
                  value={form.nim}
                  onChange={(e) => setForm({ ...form, nim: e.target.value })}
                  className="w-full border border-[var(--brand-ink)] p-2 text-sm bg-[var(--brand-surface)]"
                />
              </div>
              <div>
                <label className="block text-xs font-condensed uppercase font-bold mb-1">Kelas</label>
                <select
                  value={form.kelas}
                  onChange={(e) => setForm({ ...form, kelas: e.target.value })}
                  className="w-full border border-[var(--brand-ink)] p-2 text-sm bg-[var(--brand-surface)]"
                >
                  <option value="A">Kelas A</option>
                  <option value="B">Kelas B</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-condensed uppercase font-bold mb-1">Tagline (opsional)</label>
                <input
                  type="text"
                  value={form.tagline}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                  className="w-full border border-[var(--brand-ink)] p-2 text-sm bg-[var(--brand-surface)]"
                />
              </div>
              <div>
                <label className="block text-xs font-condensed uppercase font-bold mb-1">Biografi (opsional)</label>
                <textarea
                  rows={3}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  className="w-full border border-[var(--brand-ink)] p-2 text-sm bg-[var(--brand-surface)] resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-condensed uppercase font-bold mb-1">Instagram</label>
                  <input
                    type="text"
                    value={form.instagram}
                    onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                    className="w-full border border-[var(--brand-ink)] p-2 text-sm bg-[var(--brand-surface)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-condensed uppercase font-bold mb-1">Asal Daerah</label>
                  <input
                    type="text"
                    value={form.asalDaerah}
                    onChange={(e) => setForm({ ...form, asalDaerah: e.target.value })}
                    className="w-full border border-[var(--brand-ink)] p-2 text-sm bg-[var(--brand-surface)]"
                  />
                </div>
              </div>
              <div>
                <ImageUploader
                  value={form.imageUrl}
                  onChange={(url) => setForm({ ...form, imageUrl: url })}
                  label="Foto Mahasiswa (opsional)"
                  hint="Upload file atau tempel URL."
                  altText={`Foto ${form.name || 'mahasiswa'}`}
                  grayscale
                />
              </div>
              <button
                type="submit"
                className="bg-[var(--brand-ink)] text-white font-condensed uppercase py-2 mt-2 flex items-center justify-center gap-2 hover:bg-[var(--brand-maroon)]"
              >
                {editing ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {editing ? 'Simpan Edit' : 'Tambahkan'}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={() => {
                    setForm(emptyForm)
                    setEditing(false)
                  }}
                  className="text-xs uppercase font-condensed text-[var(--brand-ink-muted)] hover:text-[var(--brand-ink)]"
                >
                  Batal
                </button>
              )}
            </form>
          ) : (
            <p className="text-xs text-[var(--brand-ink-muted)] italic">
              Klik "+ Baru" untuk menambahkan mahasiswa baru ke direktori angkatan, atau edit baris di tabel
              sebelah.
            </p>
          )}
        </div>

        {/* Table */}
        <div className="md:col-span-2">
          {/* Bulk action bar (visible when items selected) */}
          {selectedIds.length > 0 && (
            <div className="bg-[var(--brand-ink)] text-[var(--brand-surface)] px-4 py-2 mb-2 flex flex-wrap items-center gap-2 shadow-hard">
              <span className="font-condensed text-xs uppercase tracking-widest font-bold flex items-center gap-2">
                <Layers className="w-4 h-4 text-[var(--brand-orange)]" />
                {selectedIds.length} terpilih
              </span>
              <div className="w-px h-5 bg-[var(--brand-surface)]/30" />
              <button
                onClick={() => bulkAction('assign-class', 'A')}
                className="px-3 py-1 text-[10px] uppercase tracking-widest font-condensed border border-[var(--brand-surface)]/40 hover:bg-[var(--brand-orange)]/15 hover:text-[var(--brand-ink)] transition-colors"
              >
                → Kelas A
              </button>
              <button
                onClick={() => bulkAction('assign-class', 'B')}
                className="px-3 py-1 text-[10px] uppercase tracking-widest font-condensed border border-[var(--brand-surface)]/40 hover:bg-[var(--brand-orange)]/15 hover:text-[var(--brand-ink)] transition-colors"
              >
                → Kelas B
              </button>
              <button
                onClick={() => bulkAction('delete')}
                className="px-3 py-1 text-[10px] uppercase tracking-widest font-condensed border border-[var(--brand-maroon)] text-[var(--brand-orange)] hover:bg-[var(--brand-maroon)] hover:text-white transition-colors"
              >
                Hapus
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="ml-auto text-[10px] uppercase tracking-widest font-condensed text-[var(--brand-surface)]/60 hover:text-[var(--brand-surface)]"
              >
                Batal
              </button>
            </div>
          )}

          <div className="overflow-x-auto border border-[var(--brand-ink)] max-h-[600px] overflow-y-auto custom-scroll">
            <table className="w-full text-left text-sm font-sans">
              <thead className="bg-[var(--brand-orange)]/15 font-condensed uppercase tracking-wider text-xs sticky top-0 z-10">
                <tr>
                  <th className="p-3 border-b border-[var(--brand-ink)] w-10">
                    <button
                      onClick={toggleSelectAll}
                      className="flex items-center justify-center"
                      title={selectedIds.length === students.length ? 'Batal pilih semua' : 'Pilih semua'}
                    >
                      {selectedIds.length === students.length && students.length > 0 ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-3 border-b border-[var(--brand-ink)]">Foto</th>
                  <th className="p-3 border-b border-[var(--brand-ink)]">Nama</th>
                  <th className="p-3 border-b border-[var(--brand-ink)]">NIM</th>
                  <th className="p-3 border-b border-[var(--brand-ink)]">Kelas</th>
                  <th className="p-3 border-b border-[var(--brand-ink)] text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-[var(--brand-ink-muted)]">Memuat data...</td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-[var(--brand-ink-muted)]">Belum ada mahasiswa terdaftar.</td>
                  </tr>
                ) : (
                  students.map((s) => (
                    <tr
                      key={s.id}
                      className={`border-b border-[var(--brand-border)] last:border-0 hover:bg-[var(--brand-orange)]/15/40 ${
                        selectedIds.includes(s.id) ? 'bg-[var(--brand-orange)]/15/60' : ''
                      }`}
                    >
                      <td className="p-3">
                        <button
                          onClick={() => toggleSelect(s.id)}
                          className="flex items-center justify-center"
                          title={selectedIds.includes(s.id) ? 'Batal pilih' : 'Pilih'}
                        >
                          {selectedIds.includes(s.id) ? (
                            <CheckSquare className="w-4 h-4 text-[var(--brand-ink)]" />
                          ) : (
                            <Square className="w-4 h-4 text-[var(--brand-ink-muted)]" />
                          )}
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="w-10 h-10 border border-[var(--brand-ink)]">
                          <PlaceholderImage alt={`Foto ${s.name}`} src={s.imageUrl || undefined} grayscale />
                        </div>
                      </td>
                      <td className="p-3 font-bold">
                        <button
                          onClick={() => setView('profile', s.id)}
                          className="hover:text-[var(--brand-maroon)] hover:underline text-left"
                        >
                          {s.name}
                        </button>
                      </td>
                      <td className="p-3 text-[var(--brand-ink-muted)]">{s.nim}</td>
                      <td className="p-3">
                        <span className="bg-[var(--brand-navy)]/15 border border-[var(--brand-ink)] px-2 py-0.5 font-condensed">
                          {s.kelas}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => handleEdit(s)}
                            className="w-8 h-8 flex items-center justify-center border border-[var(--brand-ink)] hover:bg-[var(--brand-ink)] hover:text-white transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="w-8 h-8 flex items-center justify-center border border-[var(--brand-maroon)] text-[var(--brand-maroon)] hover:bg-[var(--brand-maroon)] hover:text-white transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-[var(--brand-ink-muted)] mt-2 font-sans">
            Total {students.length} mahasiswa terdaftar di direktori.
            {selectedIds.length > 0 && ` • ${selectedIds.length} dipilih`}
          </p>
        </div>
      </div>

      {/* User Management (admin only) */}
      <UserManagement />

      {/* Analytics (admin only) */}
      <AdminAnalytics />
    </div>
  )
}
