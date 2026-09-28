'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { ArrowLeft, Search, UserCheck, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'

interface ClaimResponse {
  ok?: boolean
  error?: string
  hint?: string
  message?: string
  alreadyClaimed?: boolean
  student?: {
    id: string
    name: string
    nim: string
    kelas: string
    nickname: string | null
  }
  studentId?: string
}

export function ClaimProfileView() {
  const setView = useAppStore((s) => s.setView)
  const user = useAppStore((s) => s.user)
  const [nim, setNim] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [claimedStudent, setClaimedStudent] = useState<ClaimResponse['student'] | null>(null)

  // Auto-redirect if not logged in
  useEffect(() => {
    if (!user) {
      toast.info('Anda harus login untuk klaim profil mahasiswa.')
      setView('login')
    }
  }, [user, setView])

  if (!user) return null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedNim = nim.trim().toUpperCase()
    if (trimmedNim.length < 3) {
      toast.error('NIM minimal 3 karakter.')
      return
    }

    setSubmitting(true)
    setClaimedStudent(null)

    try {
      const res = await fetch('/api/students/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nim: trimmedNim }),
      })
      const data: ClaimResponse = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Gagal mengklaim profil.')
        if (data.hint) {
          toast.info(data.hint, { duration: 6000 })
        }
      } else {
        if (data.alreadyClaimed) {
          toast.info(data.message || 'Profil sudah ter-link sebelumnya.')
        } else {
          toast.success(data.message || 'Berhasil! Profil mahasiswa ter-link ke akun Anda.')
        }
        if (data.student) {
          setClaimedStudent(data.student)
        } else if (data.studentId) {
          // Already claimed by same user — redirect to profile
          setTimeout(() => setView('profile', data.studentId), 1500)
        }
      }
    } catch {
      toast.error('Gagal terhubung ke server. Coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto page-enter">
      {/* Back button */}
      <button
        onClick={() => setView('home')}
        className="inline-flex items-center text-xs uppercase tracking-widest mb-6 hover:text-[var(--brand-navy)] transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Beranda
      </button>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--brand-navy)] text-[var(--brand-surface)] rounded-full mb-4">
          <UserCheck className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2 text-[var(--brand-ink)]">
          Klaim Profil Mahasiswa
        </h1>
        <p className="font-serif italic text-sm text-[var(--brand-ink-muted)] max-w-md mx-auto">
          Sudah daftar via Google? Sekarang link akun Anda dengan data mahasiswa yang sudah ter-list di direktori.
        </p>
      </div>

      {/* Success state — student claimed */}
      {claimedStudent ? (
        <div className="border-2 border-[var(--brand-navy)] bg-[var(--brand-surface-2)] p-6 text-center">
          <CheckCircle2 className="w-12 h-12 text-[var(--brand-navy)] mx-auto mb-3" />
          <h2 className="font-serif text-2xl font-bold mb-2">Berhasil!</h2>
          <p className="text-sm text-[var(--brand-ink-muted)] mb-1">
            Profil mahasiswa <strong>{claimedStudent.name}</strong> ({claimedStudent.nim})
            <br />
            Kelas {claimedStudent.kelas} — {claimedStudent.nickname ? `"${claimedStudent.nickname}"` : 'tanpa nickname'}
          </p>
          <p className="font-serif italic text-xs text-[var(--brand-ink-muted)] mb-4">
            Sekarang Anda bisa edit foto, bio, tagline, lagu tema, dan portofolio.
          </p>
          <button
            onClick={() => setView('profile', claimedStudent.id)}
            className="bg-[var(--brand-navy)] text-[var(--brand-surface)] px-6 py-2.5 font-condensed uppercase tracking-widest text-sm hover:bg-[var(--brand-navy-light)] transition-colors"
          >
            Lihat Profil Saya →
          </button>
        </div>
      ) : (
        <>
          {/* Claim form */}
          <form
            onSubmit={submit}
            className="border border-[var(--brand-ink)] bg-[var(--brand-surface)] p-6 md:p-8"
          >
            <h2 className="font-condensed text-sm uppercase tracking-widest text-[var(--brand-ink-muted)] mb-4 border-b border-[var(--brand-border)] pb-2">
              Masukkan NIM Anda
            </h2>

            <div className="mb-4">
              <label className="block font-condensed text-xs uppercase tracking-widest text-[var(--brand-ink-muted)] mb-1.5">
                Nomor Induk Mahasiswa <span className="text-[var(--brand-orange)]">*</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--brand-ink-muted)]" />
                <input
                  type="text"
                  value={nim}
                  onChange={(e) => setNim(e.target.value)}
                  maxLength={20}
                  placeholder="cth: 3336250001"
                  className="w-full pl-10 pr-4 py-2.5 border-b-2 border-[var(--brand-border)] bg-transparent font-mono text-sm focus:outline-none focus:border-[var(--brand-navy)] transition-colors uppercase"
                  disabled={submitting}
                  autoFocus
                />
              </div>
              <p className="font-mono text-[10px] text-[var(--brand-ink-muted)] mt-1.5">
                NIM tertera di kartu mahasiswa / SIA. Format: angka tanpa spasi.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting || nim.length < 3}
              className={cn(
                'w-full flex items-center justify-center gap-2 bg-[var(--brand-navy)] text-[var(--brand-surface)] font-condensed uppercase tracking-widest text-sm py-3 hover:bg-[var(--brand-navy-light)] transition-colors',
                (submitting || nim.length < 3) && 'opacity-50 cursor-not-allowed'
              )}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Mengklaim…
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" /> Klaim Profil Saya
                </>
              )}
            </button>
          </form>

          {/* Info box */}
          <div className="mt-6 border-l-4 border-[var(--brand-orange)] bg-[var(--brand-orange)]/10 p-4 flex items-start gap-2 text-sm">
            <AlertCircle className="w-4 h-4 text-[var(--brand-orange)] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-condensed uppercase tracking-widest text-[10px] text-[var(--brand-orange)] mb-1">
                Tidak yakin NIM Anda?
              </p>
              <p className="font-serif italic text-xs text-[var(--brand-ink-muted)] leading-relaxed">
                Cek kartu mahasiswa atau login ke SIA Untirta. NIM angkatan 2025 biasanya
                berformat <span className="font-mono not-italic">333625XXXX</span> (10 digit).
                <br />
                Jika NIM Anda tidak ditemukan, kemungkinan admin belum menambahkan Anda ke
                direktori. Hubungi admin via grup WhatsApp angkatan.
              </p>
            </div>
          </div>

          {/* How it works */}
          <details className="mt-6 border border-[var(--brand-border)] bg-[var(--brand-surface-2)] p-4">
            <summary className="font-condensed text-xs uppercase tracking-widest cursor-pointer text-[var(--brand-navy)]">
              Cara kerja klaim profil
            </summary>
            <ol className="mt-3 space-y-2 text-xs text-[var(--brand-ink-muted)] list-decimal list-inside font-serif italic leading-relaxed">
              <li>Admin mendaftarkan seluruh mahasiswa angkatan ke direktori (dengan NIM).</li>
              <li>Anda signup/login via Google OAuth dengan email pribadi.</li>
              <li>Setelah login, masukkan NIM Anda di form di atas.</li>
              <li>Sistem cek NIM di database. Jika match dan belum diklaim siapa pun → profil ter-link ke akun Google Anda.</li>
              <li>Setelah ter-link, Anda dapat edit foto, bio, tagline, lagu tema, dan portofolio (website, proker, sertifikat).</li>
            </ol>
          </details>
        </>
      )}
    </div>
  )
}
