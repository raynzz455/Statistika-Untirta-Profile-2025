'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { PlaceholderImage } from '@/components/PlaceholderImage'
import { Leaderboard } from '@/components/Leaderboard'
import { TagCloud } from '@/components/TagCloud'
import { GraduationCap, BookOpen, Award, Trophy, Tag, Plus, X, Mail } from 'lucide-react'
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

export function AboutView() {
  const setView = useAppStore((s) => s.setView)
  const user = useAppStore((s) => s.user)
  const [dosenList, setDosenList] = useState<Dosen[]>([])
  const [loadingDosen, setLoadingDosen] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', title: '', role: 'Dosen', expertise: '', bio: '', email: '', imageUrl: '', courses: '' })

  const loadDosen = () => {
    fetch('/api/dosen')
      .then((r) => r.json())
      .then((d) => setDosenList(d.dosen || []))
      .catch(() => setDosenList([]))
      .finally(() => setLoadingDosen(false))
  }

  useEffect(() => { loadDosen() }, [])

  const addDosen = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/dosen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const d = await res.json()
    if (d.error) { toast.error(d.error); return }
    toast.success('Dosen ditambahkan.')
    setForm({ name: '', title: '', role: 'Dosen', expertise: '', bio: '', email: '', imageUrl: '', courses: '' })
    setShowAdd(false)
    loadDosen()
  }

  // Split dosen by role
  const kaprodi = dosenList.find((d) => d.role.toLowerCase().includes('kaprodi'))
  const otherDosen = dosenList.filter((d) => !d.role.toLowerCase().includes('kaprodi'))

  return (
    <div className="max-w-4xl mx-auto page-enter">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-serif uppercase mb-3">
          Tentang <span className="italic text-[var(--brand-navy)]">Prodi</span>
        </h1>
        <p className="text-[10px] uppercase tracking-widest font-condensed text-[var(--brand-ink-muted)]">
          Mengenal Program Studi Statistika Universitas Sultan Ageng Tirtayasa
        </p>
      </div>

      {/* Quote */}
      <div className="border-y border-[var(--brand-border)] py-8 mb-10 bg-[var(--brand-surface-2)]">
        <p className="font-serif text-lg md:text-xl leading-relaxed italic text-[var(--brand-ink-muted)] max-w-2xl mx-auto text-center px-6">
          "Berdiri pada tahun 2023 di bawah naungan Fakultas Teknik, Kampus Cilegon. Program Studi
          Statistika Untirta hadir untuk menjawab tantangan era big data."
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-10">
        {[
          { icon: GraduationCap, label: 'Mahasiswa', value: '120' },
          { icon: BookOpen, label: 'Mata Kuliah', value: '48' },
          { icon: Award, label: 'Prestasi', value: '12' },
        ].map((s, i) => (
          <div key={i} className="border border-[var(--brand-border)] p-3 text-center bg-[var(--brand-surface)]">
            <s.icon className="w-5 h-5 mx-auto mb-1 text-[var(--brand-navy)]" />
            <p className="font-serif text-xl">{s.value}</p>
            <p className="text-[9px] uppercase tracking-widest text-[var(--brand-ink-muted)] font-condensed">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Kaprodi card (if exists) */}
      {kaprodi && (
        <div className="mb-10">
          <h2 className="text-[10px] uppercase tracking-widest mb-4 border-b border-[var(--brand-border)] pb-1 text-[var(--brand-ink-muted)]">
            Profil Kaprodi
          </h2>
          <button
            onClick={() => setView('dosen-detail', kaprodi.id)}
            className="block w-full text-left border border-[var(--brand-border)] bg-[var(--brand-surface-2)] p-4 hover:border-[var(--brand-navy)] transition-colors group"
          >
            <div className="flex gap-4 items-start">
              <div className="w-24 h-24 flex-shrink-0 border border-[var(--brand-border)] overflow-hidden">
                <PlaceholderImage alt={`Foto ${kaprodi.name}`} src={kaprodi.imageUrl || undefined} grayscale />
              </div>
              <div className="flex-grow min-w-0">
                <h3 className="font-serif text-xl leading-tight group-hover:text-[var(--brand-navy)] transition-colors">
                  {kaprodi.title ? `${kaprodi.title} ` : ''}{kaprodi.name}
                </h3>
                <p className="text-[10px] uppercase tracking-widest text-[var(--brand-orange)] font-condensed mt-0.5 mb-2">Ketua Program Studi</p>
                {kaprodi.bio && <p className="text-xs leading-relaxed text-[var(--brand-ink-muted)] line-clamp-3">{kaprodi.bio}</p>}
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Dosen list — clickable, admin can add */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[10px] uppercase tracking-widest border-b border-[var(--brand-border)] pb-1 text-[var(--brand-ink-muted)] flex-grow">
            Daftar Dosen Pengajar
          </h2>
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="text-[10px] uppercase tracking-widest font-condensed bg-[var(--brand-navy)] text-[var(--brand-surface)] px-2 py-1 hover:bg-[var(--brand-navy-light)] flex items-center gap-1 ml-2 flex-shrink-0"
            >
              {showAdd ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />} {showAdd ? 'Tutup' : 'Tambah'}
            </button>
          )}
        </div>

        {/* Add form (admin only) */}
        {showAdd && user?.role === 'admin' && (
          <form onSubmit={addDosen} className="mb-4 border border-[var(--brand-border)] p-3 bg-[var(--brand-surface-2)] space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama" className="border border-[var(--brand-border)] p-2 text-sm bg-[var(--brand-surface)]" required />
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Gelar" className="border border-[var(--brand-border)] p-2 text-sm bg-[var(--brand-surface)]" />
              <input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Role (Kaprodi/Dosen)" className="border border-[var(--brand-border)] p-2 text-sm bg-[var(--brand-surface)]" />
              <input value={form.expertise} onChange={(e) => setForm({ ...form, expertise: e.target.value })} placeholder="Bidang Keahlian" className="border border-[var(--brand-border)] p-2 text-sm bg-[var(--brand-surface)]" />
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="border border-[var(--brand-border)] p-2 text-sm bg-[var(--brand-surface)]" />
              <input value={form.courses} onChange={(e) => setForm({ ...form, courses: e.target.value })} placeholder="Mata Kuliah (koma)" className="border border-[var(--brand-border)] p-2 text-sm bg-[var(--brand-surface)]" />
            </div>
            <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Biografi" rows={2} className="w-full border border-[var(--brand-border)] p-2 text-sm bg-[var(--brand-surface)] resize-none" />
            <button type="submit" className="bg-[var(--brand-navy)] text-[var(--brand-surface)] px-3 py-1.5 text-[10px] uppercase font-condensed tracking-widest">Tambah Dosen</button>
          </form>
        )}

        {/* Dosen cards */}
        {loadingDosen ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3 items-center border border-[var(--brand-border)] p-3">
                <div className="w-12 h-12 skeleton-shimmer flex-shrink-0" />
                <div className="flex-grow space-y-1">
                  <div className="h-3 skeleton-shimmer w-2/3" />
                  <div className="h-2 skeleton-shimmer w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : otherDosen.length === 0 ? (
          <p className="text-sm italic text-[var(--brand-ink-muted)] py-6 text-center">
            {user?.role === 'admin' ? 'Belum ada dosen. Klik "Tambah" untuk menambah.' : 'Belum ada data dosen.'}
          </p>
        ) : (
          <div className="space-y-2">
            {otherDosen.map((d) => (
              <button
                key={d.id}
                onClick={() => setView('dosen-detail', d.id)}
                className="flex items-center gap-3 border border-[var(--brand-border)] p-3 bg-[var(--brand-surface)] hover:border-[var(--brand-navy)] hover:bg-[var(--brand-surface-2)] transition-all text-left w-full group"
              >
                <div className="w-12 h-12 flex-shrink-0 border border-[var(--brand-border)] overflow-hidden">
                  <PlaceholderImage alt={`Foto ${d.name}`} src={d.imageUrl || undefined} grayscale />
                </div>
                <div className="flex-grow min-w-0">
                  <h4 className="font-serif font-semibold text-sm truncate group-hover:text-[var(--brand-navy)] transition-colors">
                    {d.title ? `${d.title} ` : ''}{d.name}
                  </h4>
                  <p className="text-[10px] uppercase tracking-widest text-[var(--brand-ink-muted)] font-condensed truncate">
                    {d.expertise || d.role}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tag cloud */}
      <div className="mt-12 border-t border-dashed border-[var(--brand-border)] pt-8">
        <h2 className="text-2xl font-serif uppercase mb-2 flex items-center gap-2">
          <Tag className="w-5 h-5 text-[var(--brand-orange)]" /> Topik Populer
        </h2>
        <p className="text-xs text-[var(--brand-ink-muted)] mb-4">
          Awan tag dari artikel angkatan.
        </p>
        <TagCloud />
      </div>

      {/* Leaderboard */}
      <div className="mt-12 border-t border-dashed border-[var(--brand-border)] pt-8">
        <h2 className="text-2xl font-serif uppercase mb-2 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[var(--brand-orange)]" /> Papan Peringkat
        </h2>
        <p className="text-xs text-[var(--brand-ink-muted)] mb-4">
          Anggota paling aktif di angkatan Statistika '25.
        </p>
        <Leaderboard />
      </div>

      {/* CTA */}
      <div className="mt-12 text-center border-t border-dashed border-[var(--brand-border)] pt-8">
        <p className="font-serif italic text-sm text-[var(--brand-ink-muted)] mb-4 max-w-md mx-auto">
          "Bergabunglah dengan keluarga besar Statistika '25."
        </p>
        <button
          onClick={() => setView('directory')}
          className="inline-flex items-center gap-2 bg-[var(--brand-navy)] text-[var(--brand-surface)] px-5 py-2.5 font-condensed uppercase tracking-widest text-xs hover:bg-[var(--brand-navy-light)]"
        >
          Lihat Direktori Mahasiswa →
        </button>
      </div>
    </div>
  )
}
