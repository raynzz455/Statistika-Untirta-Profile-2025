'use client'

import { ArrowLeft, Instagram, MapPin } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { PlaceholderImage } from '@/components/PlaceholderImage'
import { MusicPlayer } from '@/components/MusicPlayer'

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
}

export function ProfileView() {
  const selectedId = useAppStore((s) => s.selectedId)
  const setView = useAppStore((s) => s.setView)
  const user = useAppStore((s) => s.user)
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!selectedId) { setLoading(false); return }
    fetch(`/api/students/${selectedId}`)
      .then((r) => r.json())
      .then((d) => setStudent(d.student || null))
      .catch(() => setStudent(null))
      .finally(() => setLoading(false))
  }, [selectedId])

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
              {student.nickname && <p className="font-condensed text-[10px] uppercase tracking-widest text-[var(--brand-orange)]">"{student.nickname}"</p>}
              <p className="font-mono text-[10px] text-[var(--brand-ink-muted)]">NIM. {student.nim}</p>
              <div className="inline-flex items-center gap-1.5 mt-2 border border-[var(--brand-border)] px-2 py-0.5">
                <span className="bg-[var(--brand-navy)] text-[var(--brand-surface)] w-4 h-4 text-[10px] flex items-center justify-center font-bold">{student.kelas}</span>
                <span className="text-[9px] uppercase tracking-widest font-condensed text-[var(--brand-ink-muted)]">Kelas</span>
              </div>
            </div>
            {user && (user.role === 'admin' || user.id === student.id) && (
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
          {/* Name — flows wider, not stacked */}
          <h1 className="font-serif text-3xl md:text-5xl font-bold leading-tight mb-2 break-words">
            {student.name}
          </h1>
          {student.nickname && (
            <p className="font-serif italic text-lg text-[var(--brand-orange)] mb-4">"{student.nickname}"</p>
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

          {/* Bio */}
          {student.bio && (
            <div className="mb-6">
              <h3 className="text-[10px] uppercase tracking-widest mb-2 border-b border-[var(--brand-border)] pb-1 text-[var(--brand-ink-muted)]">
                Biografi
              </h3>
              <p className="text-sm leading-relaxed text-[var(--brand-ink)]/80">{student.bio}</p>
            </div>
          )}

          {/* Contact info */}
          <div className="flex flex-wrap gap-3">
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
    </div>
  )
}
