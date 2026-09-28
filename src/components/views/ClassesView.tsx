'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { PlaceholderImage } from '@/components/PlaceholderImage'
import { ScrollReveal } from '@/components/ScrollReveal'
import { Users, Calendar, RefreshCw, ChevronDown, ChevronRight, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Student {
  id: string
  name: string
  nim: string
  kelas: string
  angkatan?: string
  semester?: number
  imageUrl: string | null
}

const MEMBERS_PER_PAGE = 12

function ClassBlock({ kelas, students }: { kelas: 'A' | 'B'; students: Student[] }) {
  const setView = useAppStore((s) => s.setView)
  const [selectedAngkatan, setSelectedAngkatan] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const isA = kelas === 'A'

  const angkatanList = useMemo(
    () => [...new Set(students.map((s) => s.angkatan || '2025'))].sort().reverse(),
    [students]
  )

  const filtered = useMemo(() => {
    let result = selectedAngkatan === 'all'
      ? students
      : students.filter((s) => (s.angkatan || '2025') === selectedAngkatan)
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.nim.toLowerCase().includes(q)
      )
    }
    return result
  }, [students, selectedAngkatan, search])

  // Reset page when filters change
  useEffect(() => setPage(1), [selectedAngkatan, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / MEMBERS_PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const paged = filtered.slice(
    (currentPage - 1) * MEMBERS_PER_PAGE,
    currentPage * MEMBERS_PER_PAGE
  )

  return (
    <div className="border border-[var(--brand-ink)] bg-[var(--brand-surface)] flex flex-col">
      {/* Header bar */}
      <div className={cn(
        'border-b-2 border-[var(--brand-ink)] px-4 py-3 flex items-center justify-between gap-3',
        isA ? 'bg-[var(--brand-navy)]' : 'bg-[var(--brand-orange)]'
      )}>
        <div className="flex items-center gap-3">
          <div className="font-serif text-3xl text-[var(--brand-surface)] leading-none">
            {kelas}
          </div>
          <div>
            <h2 className="font-serif text-xl text-[var(--brand-surface)] leading-tight">Kelas {kelas}</h2>
            <p className="text-[10px] uppercase tracking-widest font-condensed text-[var(--brand-surface)]/70">
              {filtered.length} Anggota {search && `(dari ${students.length})`}
            </p>
          </div>
        </div>
        {angkatanList.length > 1 && (
          <select
            value={selectedAngkatan}
            onChange={(e) => setSelectedAngkatan(e.target.value)}
            className="bg-[var(--brand-surface)] border border-[var(--brand-surface)]/30 text-[var(--brand-ink)] text-[10px] uppercase tracking-widest font-condensed px-2 py-1 focus:outline-none cursor-pointer"
          >
            <option value="all">Semua Angkatan</option>
            {angkatanList.map((yr) => (
              <option key={yr} value={yr}>Angkatan {yr}</option>
            ))}
          </select>
        )}
      </div>

      {/* Search bar */}
      <div className="border-b border-[var(--brand-border)] px-3 py-2 bg-[var(--brand-surface-2)]">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--brand-ink-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Cari di Kelas ${kelas}...`}
            className="w-full border border-[var(--brand-border)] pl-7 pr-7 py-1 text-xs font-body bg-[var(--brand-surface)] focus:outline-none focus:border-[var(--brand-navy)]"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--brand-ink-muted)] hover:text-[var(--brand-ink)]"
              aria-label="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Member table — handles 30+ members with pagination */}
      <div className="max-h-[600px] overflow-y-auto custom-scroll flex-grow">
        <table className="w-full text-left">
          <thead className="sticky top-0 z-10 bg-[var(--brand-surface-2)] border-b border-[var(--brand-border)]">
            <tr>
              <th className="p-2 text-[9px] uppercase tracking-widest font-condensed text-[var(--brand-ink-muted)] w-8">#</th>
              <th className="p-2 text-[9px] uppercase tracking-widest font-condensed text-[var(--brand-ink-muted)]">Foto</th>
              <th className="p-2 text-[9px] uppercase tracking-widest font-condensed text-[var(--brand-ink-muted)]">Nama</th>
              <th className="p-2 text-[9px] uppercase tracking-widest font-condensed text-[var(--brand-ink-muted)] hidden sm:table-cell">NIM</th>
              <th className="p-2 text-[9px] uppercase tracking-widest font-condensed text-[var(--brand-ink-muted)] hidden md:table-cell">Angkatan</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((s, i) => {
              const globalIdx = (currentPage - 1) * MEMBERS_PER_PAGE + i + 1
              const isEven = i % 2 === 1
              return (
                <tr
                  key={s.id}
                  onClick={() => setView('profile', s.id)}
                  className={cn(
                    'border-b border-[var(--brand-border)] last:border-0 hover:bg-[var(--brand-orange)]/10 cursor-pointer transition-colors group',
                    isEven && 'bg-[var(--brand-surface-2)]/50'
                  )}
                >
                  <td className="p-2 text-[10px] font-mono text-[var(--brand-ink-muted)]">{globalIdx}</td>
                  <td className="p-2">
                    <div className="w-9 h-9 border border-[var(--brand-border)] overflow-hidden">
                      <PlaceholderImage alt={`Foto ${s.name}`} src={s.imageUrl || undefined} grayscale />
                    </div>
                  </td>
                  <td className="p-2">
                    <p className="font-body text-sm font-semibold group-hover:text-[var(--brand-navy)] transition-colors truncate">{s.name}</p>
                    <p className="text-[9px] text-[var(--brand-ink-muted)] font-mono sm:hidden">{s.nim}</p>
                  </td>
                  <td className="p-2 hidden sm:table-cell">
                    <p className="font-mono text-xs text-[var(--brand-ink-muted)]">{s.nim}</p>
                  </td>
                  <td className="p-2 hidden md:table-cell">
                    <p className="font-condensed text-xs text-[var(--brand-ink-muted)] uppercase">{s.angkatan || '2025'}</p>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-sm text-[var(--brand-ink-muted)] italic">
                  {search ? `Tidak ada hasil untuk "${search}"` : 'Belum ada anggota di kelas ini.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer with pagination + count */}
      <div className="border-t-2 border-[var(--brand-ink)] px-4 py-2.5 bg-[var(--brand-surface-2)] flex items-center justify-between gap-2 flex-wrap text-[10px] font-mono uppercase tracking-widest text-[var(--brand-ink-muted)]">
        <span>
          Menampilkan {paged.length} dari {filtered.length}
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 border border-[var(--brand-border)] disabled:opacity-30 enabled:hover:bg-[var(--brand-surface)] enabled:hover:border-[var(--brand-navy)] transition-colors font-condensed"
              aria-label="Halaman sebelumnya"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }).map((_, idx) => {
              const p = idx + 1
              // Show max 5 pages, with ellipsis
              if (totalPages > 5 && Math.abs(p - currentPage) > 1 && p !== 1 && p !== totalPages) {
                if (p === 2 || p === totalPages - 1) {
                  return <span key={p} className="px-1">…</span>
                }
                return null
              }
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    'px-2 py-1 border font-condensed transition-colors',
                    p === currentPage
                      ? 'bg-[var(--brand-navy)] text-[var(--brand-surface)] border-[var(--brand-navy)]'
                      : 'border-[var(--brand-border)] hover:bg-[var(--brand-surface)] hover:border-[var(--brand-navy)]'
                  )}
                >
                  {p}
                </button>
              )
            })}
            <button
              onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-2 py-1 border border-[var(--brand-border)] disabled:opacity-30 enabled:hover:bg-[var(--brand-surface)] enabled:hover:border-[var(--brand-navy)] transition-colors font-condensed"
              aria-label="Halaman berikutnya"
            >
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function ClassesView() {
  const [stats, setStats] = useState({ classA: 0, classB: 0, total: 0 })
  const [classA, setClassA] = useState<Student[]>([])
  const [classB, setClassB] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSemester, setActiveSemester] = useState('1')

  useEffect(() => {
    Promise.all([
      fetch('/api/students?kelas=A').then((r) => r.json()),
      fetch('/api/students?kelas=B').then((r) => r.json()),
      fetch('/api/stats').then((r) => r.json()),
    ])
      .then(([a, b, st]) => {
        setClassA(a.students || [])
        setClassB(b.students || [])
        setStats({ classA: st.classA || 0, classB: st.classB || 0, total: (st.classA || 0) + (st.classB || 0) })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const SEMESTERS = [
    { value: '1', label: 'Sem 1' },
    { value: '2', label: 'Sem 2' },
    { value: '3', label: 'Sem 3 (Rotasi)' },
    { value: '4', label: 'Sem 4' },
    { value: '5', label: 'Sem 5 (Rotasi)' },
    { value: '6', label: 'Sem 6' },
  ]

  return (
    <div className="max-w-6xl mx-auto page-enter">
      <div className="text-center mb-6">
        <h1 className="text-3xl md:text-4xl font-serif uppercase mb-2">
          Rotasi &amp; <span className="italic text-[var(--brand-navy)]">Kelas</span>
        </h1>
        <p className="text-[10px] uppercase tracking-widest font-condensed text-[var(--brand-ink-muted)]">
          Total {stats.total} mahasiswa • {stats.classA} di Kelas A • {stats.classB} di Kelas B
        </p>
      </div>

      {/* Semester selector */}
      <div className="flex flex-wrap justify-center gap-1 mb-6">
        {SEMESTERS.map((sem) => (
          <button
            key={sem.value}
            onClick={() => setActiveSemester(sem.value)}
            className={cn(
              'px-3 py-1.5 text-[10px] uppercase tracking-widest font-condensed border transition-colors',
              activeSemester === sem.value
                ? 'bg-[var(--brand-navy)] text-[var(--brand-surface)] border-[var(--brand-navy)]'
                : 'bg-[var(--brand-surface)] border-[var(--brand-border)] hover:border-[var(--brand-navy)]'
            )}
          >
            {sem.label}
          </button>
        ))}
      </div>

      {/* Rotation info */}
      {(activeSemester === '3' || activeSemester === '5') && (
        <div className="mb-4 border-l-4 border-[var(--brand-orange)] bg-[var(--brand-orange)]/10 p-3 flex items-center gap-2 text-sm">
          <RefreshCw className="w-4 h-4 text-[var(--brand-orange)] flex-shrink-0" />
          <span className="font-body text-[var(--brand-ink-muted)]">
            Rotasi kelas pada Semester {activeSemester} — mahasiswa Kelas A berpindah ke B dan sebaliknya.
          </span>
        </div>
      )}

      {/* Info banner — handles large class size */}
      {(stats.classA >= 20 || stats.classB >= 20) && (
        <div className="mb-4 bg-[var(--brand-surface-2)] border border-[var(--brand-border)] p-3 flex items-start gap-2 text-xs">
          <Users className="w-4 h-4 text-[var(--brand-navy)] flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-condensed uppercase tracking-widest text-[var(--brand-navy)] mb-1">Kelas Besar</p>
            <p className="font-body text-[var(--brand-ink-muted)] leading-relaxed">
              Kelas dengan 20+ anggota ditampilkan 12 per halaman. Gunakan kolom pencarian di tiap kelas untuk menemukan mahasiswa spesifik berdasarkan nama atau NIM.
            </p>
          </div>
        </div>
      )}

      {/* Class tables side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loading ? (
          <>
            <div className="border border-[var(--brand-border)] p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton-shimmer h-10" />
              ))}
            </div>
            <div className="border border-[var(--brand-border)] p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton-shimmer h-10" />
              ))}
            </div>
          </>
        ) : (
          <>
            <ClassBlock kelas="A" students={classA} />
            <ClassBlock kelas="B" students={classB} />
          </>
        )}
      </div>

      {/* Archive */}
      <div className="mt-10 border-t border-dashed border-[var(--brand-border)] pt-6 text-center">
        <p className="font-body italic text-sm text-[var(--brand-ink-muted)]">
          Rotasi pertama akan dilakukan setelah Semester 2.
        </p>
      </div>
    </div>
  )
}
