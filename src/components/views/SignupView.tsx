'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Eye, EyeOff, Mail, Lock, ChevronRight, UserPlus, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

export function SignupView() {
  const setView = useAppStore((s) => s.setView)
  const setUser = useAppStore((s) => s.setUser)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Email dan password wajib diisi.')
      return
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ email, password }),
      })
      const d = await res.json()

      if (d.error) {
        setError(d.error)
        setLoading(false)
        return
      }

      if (d.needsEmailConfirmation) {
        // Email confirmation required — show success message
        setNeedsConfirmation(true)
        toast.success(d.message || 'Cek email Anda untuk konfirmasi!')
        setLoading(false)
        return
      }

      // Signup succeeded with immediate session
      if (d.user) {
        setUser(d.user)
        toast.success(`Selamat datang, ${d.user.displayName || email}!`)
        if (d.redirect) {
          setTimeout(() => {
            window.location.hash = d.redirect
            setView('claim-profile')
          }, 500)
        } else {
          setView('home')
        }
      }
    } catch {
      setError('Koneksi gagal. Coba lagi.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto my-4 md:my-8 page-enter">
      <div className="border border-[var(--brand-ink)] bg-[var(--brand-surface)] shadow-hard">
        {/* Masthead header */}
        <div className="border-b-2 border-[var(--brand-ink)] px-6 py-5 text-center bg-[var(--brand-navy)] text-[var(--brand-surface)]">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--brand-surface)]/60 mb-2">
            EST. MMXXIII • VOL. I • NO. 01
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold leading-none mb-1">
            Daftar <span className="italic text-[var(--brand-orange)]">Akun</span>
          </h2>
          <div className="flex items-center justify-center gap-3 mt-2">
            <span className="h-px bg-[var(--brand-surface)]/30 w-12" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--brand-surface)]/50">
              STATISTIKA '25
            </span>
            <span className="h-px bg-[var(--brand-surface)]/30 w-12" />
          </div>
        </div>

        {/* Body */}
        <div className="p-6 md:p-8">
          {/* Back to login */}
          <button
            onClick={() => setView('login')}
            className="inline-flex items-center text-xs uppercase tracking-widest text-[var(--brand-ink-muted)] hover:text-[var(--brand-navy)] transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Sudah punya akun? Login
          </button>

          {needsConfirmation ? (
            /* Email confirmation success state */
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--brand-navy)]/10 text-[var(--brand-navy)] rounded-full mb-4">
                <Mail className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-2xl font-bold mb-2 text-[var(--brand-ink)]">
                Cek Email Anda!
              </h3>
              <p className="font-body text-sm text-[var(--brand-ink-muted)] mb-6 max-w-md mx-auto">
                Kami telah mengirim link konfirmasi ke <strong>{email}</strong>.
                Klik link tersebut untuk mengaktifkan akun Anda, lalu login.
              </p>
              <p className="font-body text-xs text-[var(--brand-ink-muted)] mb-4">
                Tidak menerima email? Cek folder spam/promosi. Atau
                <button
                  onClick={() => { setNeedsConfirmation(false); setLoading(false) }}
                  className="ml-1 text-[var(--brand-navy)] underline hover:no-underline"
                >
                  coba daftar lagi
                </button>.
              </p>
              <button
                onClick={() => setView('login')}
                className="bg-[var(--brand-navy)] text-[var(--brand-surface)] px-6 py-2.5 font-condensed uppercase tracking-widest text-sm hover:bg-[var(--brand-navy-light)] transition-colors"
              >
                Ke Halaman Login →
              </button>
            </div>
          ) : (
            /* Signup form */
            <form onSubmit={handleSignup} className="flex flex-col gap-4">
              {error && (
                <div className="bg-[var(--brand-maroon)]/10 text-[var(--brand-ink)] text-xs p-3 font-body border-l-4 border-[var(--brand-maroon)] flex items-start gap-2">
                  <span className="text-[var(--brand-maroon)] font-bold">⚠</span> {error}
                </div>
              )}

              <div>
                <label className="block font-condensed uppercase tracking-wider text-xs font-bold mb-1.5 flex items-center gap-2 text-[var(--brand-navy)]">
                  <Mail className="w-3 h-3" /> Email
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-[var(--brand-border)] border-b-2 border-b-[var(--brand-ink)] p-2.5 text-sm font-mono focus:outline-none focus:border-[var(--brand-navy)] bg-[var(--brand-surface)]"
                  placeholder="nama@email.com"
                />
              </div>

              <div>
                <label className="block font-condensed uppercase tracking-wider text-xs font-bold mb-1.5 flex items-center gap-2 text-[var(--brand-navy)]">
                  <Lock className="w-3 h-3" /> Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-[var(--brand-border)] border-b-2 border-b-[var(--brand-ink)] p-2.5 text-sm font-mono focus:outline-none focus:border-[var(--brand-navy)] bg-[var(--brand-surface)] pr-10"
                    placeholder="min. 6 karakter"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[var(--brand-ink-muted)] hover:text-[var(--brand-navy)] transition-colors"
                    aria-label={showPw ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-[var(--brand-navy)] text-[var(--brand-surface)] py-3 font-condensed uppercase tracking-widest text-sm hover:bg-[var(--brand-navy-light)] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {loading ? 'Memproses...' : (
                  <>
                    <UserPlus className="w-4 h-4" /> Daftar Akun
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-3">
                <span className="h-px bg-[var(--brand-border)] flex-grow" />
                <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--brand-ink-muted)]">ATAU</span>
                <span className="h-px bg-[var(--brand-border)] flex-grow" />
              </div>

              {/* Google OAuth alternative */}
              <a
                href="/api/auth/oauth/google"
                className="flex items-center justify-center gap-2.5 border border-[var(--brand-border)] py-3 font-condensed uppercase tracking-widest text-sm hover:bg-[var(--brand-surface-2)] hover:border-[var(--brand-navy)] transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Daftar dengan Google
              </a>

              {/* Info */}
              <div className="border-l-4 border-[var(--brand-orange)] bg-[var(--brand-orange)]/10 p-3 mt-2 text-xs">
                <p className="font-condensed uppercase tracking-widest text-[10px] text-[var(--brand-orange)] mb-1">
                  Setelah daftar
                </p>
                <p className="font-body text-[var(--brand-ink-muted)] leading-relaxed">
                  Setelah akun aktif, Anda akan diarahkan ke halaman <strong>Klaim Profil Mahasiswa</strong>
                  untuk input NIM dan menghubungkan akun dengan data direktori.
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Footer bar */}
        <div className="border-t border-[var(--brand-border)] px-4 py-2 bg-[var(--brand-surface-2)] flex items-center justify-between">
          <span className="font-mono text-[8px] uppercase tracking-widest text-[var(--brand-ink-muted)]">
            © MMXXVI Statistika '25 Untirta
          </span>
          <span className="font-mono text-[8px] uppercase tracking-widest text-[var(--brand-ink-muted)]">
            Cilegon • Banten
          </span>
        </div>
      </div>
    </div>
  )
}
