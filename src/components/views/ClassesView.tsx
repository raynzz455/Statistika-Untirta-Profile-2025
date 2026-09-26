'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { PlaceholderImage } from '@/components/PlaceholderImage'
import { ScrollReveal } from '@/components/ScrollReveal'
import { Users, Calendar, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react'
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

function ClassBlock({ kelas, students }: { kelas: 'A' | 'B'; students: Student[] }) {
  const setView = useAppStore((s) => s.setView)
  const [selectedAngkatan, setSelectedAngkatan] = useState<string>('all')
  const isA = kelas === 'A'

  const filtered = selectedAngkatan === 'all' ? students : students.filter((s) => (s.angkatan || '2025') === selectedAngkatan)
  const angkatanList = [...new Set(students.map((s) => s.angkatan || '2025'))].sort().reverse()

  return (
    <div className="border border-[var(--brand-ink)] bg-[var(--brand-surface)]">
      {/* Header bar */}
      <div className={cn('border-b-2 border-[var(--brand-ink)] px-4 py-3 flex items-center justify-between', isA ? 'bg-[var(--brand-navy)]' : 'bg-[var(--brand-orange)]')}>
        <div className="flex items-center gap-3">
          <div className="font-serif text-3xl text-[var(--brand-surface)] leading-none">
            {kelas}
          </div>
          <div>
            <h2 className="font-serif text-xl text-[var(--brand-surface)] leading-tight">Kelas {kelas}</h2>
            <p className="text-[10px] uppercase tracking-widest font-condensed text-[var(--brand-surface)]/70">
              {filtered.length} Anggota
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

      {/* Member list — table style for 30+ students */}
      <div className="max-h-[500px] overflow-y-auto custom-scroll">
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
            {filtered.map((s, i) => (
              <tr
                key={s.id}
                onClick={() => setView('profile', s.id)}
                className="border-b border-[var(--brand-border)] last:border-0 hover:bg-[var(--brand-surface-2)] cursor-pointer transition-colors group"
              >
                <td className="p-2 text-[10px] font-mono text-[var(--brand-ink-muted)]">{i + 1}</td>
                <td className="p-2">
                  <div className="w-9 h-9 border border-[var(--brand-border)] overflow-hidden">
                    <PlaceholderImage alt={`Foto ${s.name}`} src={s.imageUrl || undefined} grayscale />
                  </div>
                </td>
                <td className="p-2">
                  <p className="font-sans text-sm font-semibold group-hover:text-[var(--brand-navy)] transition-colors truncate">{s.name}</p>
                  <p className="text-[9px] text-[var(--brand-ink-muted)] font-mono sm:hidden">{s.nim}</p>
                </td>
                <td className="p-2 hidden sm:table-cell">
                  <p className="font-mono text-xs text-[var(--brand-ink-muted)]">{s.nim}</p>
                </td>
                <td className="p-2 hidden md:table-cell">
                  <p className="font-condensed text-xs text-[var(--brand-ink-muted)] uppercase">{s.angkatan || '2025'}</p>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-sm text-[var(--brand-ink-muted)] italic">
                  Belum ada anggota di kelas ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
          <span className="font-sans text-[var(--brand-ink-muted)]">
            Rotasi kelas pada Semester {activeSemester} — mahasiswa Kelas A berpindah ke B dan sebaliknya.
          </span>
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
        <p className="font-sans italic text-sm text-[var(--brand-ink-muted)]">
          Rotasi pertama akan dilakukan setelah Semester 2.
        </p>
      </div>
    </div>
  )
}
