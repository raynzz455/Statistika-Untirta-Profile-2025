'use client'

import { Search, Filter, ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { PlaceholderImage } from '@/components/PlaceholderImage'
import { ScrollReveal } from '@/components/ScrollReveal'
import { Pagination } from '@/components/Pagination'
import { MusicPlayer } from '@/components/MusicPlayer'

interface Student {
  id: string
  name: string
  nickname: string | null
  nim: string
  kelas: string
  tagline: string | null
  imageUrl: string | null
  lagu: string | null
  laguArtis: string | null
  laguUrl: string | null
}

export function DirectoryView() {
  const setView = useAppStore((s) => s.setView)
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [kelasFilter, setKelasFilter] = useState<'all' | 'A' | 'B'>('all')
  const [showFilter, setShowFilter] = useState(false)
  const [yearFilter, setYearFilter] = useState<string>('all') // 'all' | '2025' | '2024' etc.
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 12

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (kelasFilter !== 'all') params.set('kelas', kelasFilter)
    if (q) params.set('q', q)
    fetch(`/api/students?${params}`)
      .then((r) => r.json())
      .then((d) => setStudents(d.students || []))
      .catch(() => setStudents([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const t = setTimeout(load, 200)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, kelasFilter])

  // Reset page on filter change
  useEffect(() => setPage(1), [q, kelasFilter, yearFilter])

  // Filter by year (NIM prefix: 333625XXXXXX → year 2025)
  const yearFiltered = yearFilter === 'all' ? students : students.filter((s) => {
    // NIM format: 3336250001 → year is 2025 (from digits 4-5)
    const yearPart = s.nim.slice(4, 6) // "25" for 2025
    const year = '20' + yearPart
    return year === yearFilter
  })

  const totalPages = Math.ceil(yearFiltered.length / PAGE_SIZE)
  useEffect(() => {
    if (page > totalPages) setPage(1)
  }, [totalPages, page])
  const paged = yearFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="max-w-5xl mx-auto page-enter">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 pb-6 border-b-2 border-[var(--brand-ink)]">
        <div>
          <h1 className="text-5xl font-serif font-black uppercase mb-4 text-[var(--brand-ink)]">
            Direktori <span className="italic text-[var(--brand-navy)]">Mahasiswa</span>
          </h1>
          <p className="uppercase tracking-widest text-sm font-bold text-[var(--brand-ink)]/70">
            Angkatan 2025 • Total {students.length} Anggota Tampil
          </p>
        </div>

        <div className="flex gap-4 mt-6 md:mt-0 w-full md:w-auto">
          <div className="relative flex-grow md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--brand-ink)]/50" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nama..."
              className="w-full border border-[var(--brand-ink)] py-2 pl-10 pr-4 bg-[var(--brand-surface-3)] text-sm uppercase font-bold placeholder:text-[var(--brand-ink)]/40 focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            {/* Year filter */}
            <div className="relative">
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="flex items-center gap-2 border border-[var(--brand-ink)] py-2 px-3 bg-[var(--brand-surface-2)] text-xs uppercase font-bold focus:outline-none cursor-pointer appearance-none pr-8"
              >
                <option value="all">Semua Tahun</option>
                <option value="2025">Angkatan 2025</option>
                <option value="2024">Angkatan 2024</option>
                <option value="2023">Angkatan 2023</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" />
            </div>
            {/* Class filter */}
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="flex items-center gap-2 border border-[var(--brand-ink)] py-2 px-4 bg-[var(--brand-surface-2)] text-sm uppercase font-bold hover:bg-[var(--brand-navy)] hover:text-[var(--brand-surface)] transition-colors"
            >
              <Filter className="w-4 h-4" /> Kelas
              <ChevronDown className="w-3 h-3" />
            </button>
            {showFilter && (
              <div className="absolute right-0 top-full mt-1 bg-[var(--brand-surface)] border border-[var(--brand-ink)] shadow-hard z-10 w-32">
                {(['all', 'A', 'B'] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => {
                      setKelasFilter(k)
                      setShowFilter(false)
                    }}
                    className={`block w-full text-left px-3 py-2 text-xs uppercase font-bold hover:bg-[var(--brand-orange)]/15 ${
                      kelasFilter === k ? 'bg-[var(--brand-orange)]/15' : ''
                    }`}
                  >
                    {k === 'all' ? 'Semua Kelas' : `Kelas ${k}`}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="border border-[var(--brand-ink)] p-3 bg-[var(--brand-surface-2)]">
              <div className="aspect-[3/4] bg-[var(--brand-orange)]/15/40 animate-pulse mb-4" />
              <div className="h-4 bg-[var(--brand-orange)]/15/40 animate-pulse mb-2" />
              <div className="h-3 bg-[var(--brand-orange)]/15/40 animate-pulse w-2/3" />
            </div>
          ))}
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-[var(--brand-ink)]/30">
          <p className="font-serif italic text-2xl text-[var(--brand-ink)]/50 mb-2">Tidak ada mahasiswa ditemukan</p>
          <p className="text-sm text-[var(--brand-ink-muted)]">Coba kata kunci atau filter kelas berbeda.</p>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {paged.map((s, i) => (
            <ScrollReveal
              key={s.id}
              delay={((i % 4) + 1) as 1 | 2 | 3 | 4}
              className="group block border border-[var(--brand-ink)] bg-[var(--brand-surface-2)] transition-all text-left lift-on-hover overflow-hidden"
            >
              {/* Photo area */}
              <div
                className="relative aspect-[3/4] overflow-hidden border-b border-[var(--brand-border)] cursor-pointer"
                onClick={() => setView('profile', s.id)}
              >
                <PlaceholderImage
                  alt={`Foto ${s.name}`}
                  src={s.imageUrl || undefined}
                  grayscale
                />
                {/* Nickname badge top-right (replaces class badge) */}
                {s.nickname && (
                  <div className="absolute top-2 right-2 bg-[var(--brand-navy)] text-[var(--brand-surface)] px-2 py-0.5 text-[10px] font-condensed uppercase tracking-wider">
                    "{s.nickname}"
                  </div>
                )}
                {/* Class badge bottom-left (subtle) */}
                <div className="absolute bottom-2 left-2 bg-[var(--brand-surface)]/90 border border-[var(--brand-border)] px-1.5 py-0.5 text-[8px] font-condensed uppercase tracking-widest text-[var(--brand-ink-muted)]">
                  Kelas {s.kelas}
                </div>
              </div>

              {/* Name + tagline */}
              <div
                className="p-3 cursor-pointer"
                onClick={() => setView('profile', s.id)}
              >
                <h3 className="font-serif font-bold text-base leading-tight mb-1 group-hover:text-[var(--brand-navy)] transition-colors">
                  {s.name}
                </h3>
                <p className="text-[11px] italic text-[var(--brand-ink-muted)] line-clamp-2 leading-relaxed">
                  "{s.tagline || 'Belum ada tagline.'}"
                </p>
              </div>

              {/* Music player (compact, only if song exists) */}
              {s.laguUrl && (
                <MusicPlayer
                  songTitle={s.lagu}
                  artist={s.laguArtis}
                  audioUrl={s.laguUrl}
                  variant="compact"
                />
              )}
            </ScrollReveal>
          ))}
        </div>
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          total={yearFiltered.length}
          pageSize={PAGE_SIZE}
        />
        </>
      )}
    </div>
  )
}
