'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Eye, EyeOff, Lock, User as UserIcon, ShieldCheck, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

const TEST_ACCOUNTS = [
  { role: 'Admin', username: 'admin', password: 'admin', desc: 'Akses penuh ke dashboard admin' },
  { role: 'Mahasiswa', username: 'user', password: 'user', desc: 'Buat artikel, event, & kelola profil' },
  { role: 'Member', username: 'fauzi', password: 'fauzi', desc: 'Profil mahasiswa tertaut akun' },
]

export function LoginView() {
  const setUser = useAppStore((s) => s.setUser)
  const setView = useAppStore((s) => s.setView)
  const selectedId = useAppStore((s) => s.selectedId)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Detect OAuth error from hash routing (#/login/oauth-error)
  useEffect(() => {
    if (selectedId === 'oauth-error') {
      setError('Login Google gagal. Pastikan Supabase + Google OAuth sudah dikonfigurasi. Hubungi admin jika masalah berlanjut.')
    }
  }, [selectedId])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const d = await res.json()
      if (!res.ok) {
        setError(d.error || 'Login gagal.')
        setLoading(false)
        return
      }
      setUser(d.user)
      toast.success(`Selamat datang, ${d.user.displayName || d.user.username}!`)
      if (d.user.role === 'admin') {
        setView('admin')
      } else {
        setView('settings')
      }
    } catch {
      setError('Koneksi gagal. Coba lagi.')
      setLoading(false)
    }
  }

  const quickLogin = (u: string, p: string) => {
    setUsername(u)
    setPassword(p)
    setError('')
  }

  return (
    <div className="max-w-4xl mx-auto my-4 md:my-8 page-enter">
      {/* Retro newspaper-style login card */}
      <div className="border border-[var(--brand-ink)] bg-[var(--brand-surface)] shadow-hard">

        {/* Masthead header */}
        <div className="border-b-2 border-[var(--brand-ink)] px-6 py-5 text-center bg-[var(--brand-navy)] text-[var(--brand-surface)]">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--brand-surface)]/60 mb-2">
            EST. MMXXIII • VOL. I • NO. 01
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold leading-none mb-1">
            Portal <span className="italic text-[var(--brand-orange)]">Anggota</span>
          </h2>
          <div className="flex items-center justify-center gap-3 mt-2">
            <span className="h-px bg-[var(--brand-surface)]/30 w-12" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--brand-surface)]/50">
              STATISTIKA '25
            </span>
            <span className="h-px bg-[var(--brand-surface)]/30 w-12" />
          </div>
        </div>

        {/* Two-column body */}
        <div className="grid grid-cols-1 md:grid-cols-5">
          {/* Left: welcome + scatter chart */}
          <div className="md:col-span-2 p-6 md:p-8 border-b md:border-b-0 md:border-r border-[var(--brand-border)] flex flex-col justify-between bg-[var(--brand-surface-2)]">
            <div>
              <h1 className="font-serif text-2xl md:text-3xl leading-tight mb-3">
                Selamat <span className="italic text-[var(--brand-navy)]">Datang</span> Kembali
              </h1>
              <p className="font-body text-sm text-[var(--brand-ink-muted)] leading-relaxed mb-6">
                Masuk untuk mengelola profil, menulis artikel, membuat event, dan berkolaborasi
                membangun profil angkatan.
              </p>
            </div>

            {/* Retro scatter chart */}
            <svg viewBox="0 0 100 60" className="w-full max-w-[200px] mx-auto opacity-60">
              <line x1="5" y1="55" x2="95" y2="55" stroke="var(--brand-ink)" strokeWidth="0.3" />
              <line x1="5" y1="55" x2="5" y2="5" stroke="var(--brand-ink)" strokeWidth="0.3" />
              <line x1="10" y1="50" x2="90" y2="10" stroke="var(--brand-navy)" strokeWidth="0.5" strokeDasharray="2,1" />
              {Array.from({ length: 25 }).map((_, i) => (
                <circle
                  key={i}
                  cx={10 + i * 3.2 + Math.sin(i) * 2}
                  cy={50 - i * 1.5 + Math.cos(i) * 3}
                  r="0.8"
                  fill="var(--brand-orange)"
                />
              ))}
              <text x="3" y="50" fontSize="2" fill="var(--brand-ink-muted)" transform="rotate(-90 3 50)" textAnchor="middle">Y</text>
              <text x="50" y="59" fontSize="2" fill="var(--brand-ink-muted)" textAnchor="middle">X</text>
            </svg>

            <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--brand-ink-muted)] mt-4 text-center">
              Data • Analisis • Probabilitas
            </p>
          </div>

          {/* Right: form */}
          <div className="md:col-span-3 p-6 md:p-8 flex flex-col">
            {error && (
              <div className="bg-[var(--brand-maroon)]/10 text-[var(--brand-ink)] text-xs p-3 font-body border-l-4 border-[var(--brand-maroon)] mb-4 flex items-start gap-2">
                <span className="text-[var(--brand-maroon)] font-bold">⚠</span> {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <label className="block font-condensed uppercase tracking-wider text-xs font-bold mb-1.5 flex items-center gap-2 text-[var(--brand-navy)]">
                  <UserIcon className="w-3 h-3" /> Username
                </label>
                <input
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border border-[var(--brand-border)] border-b-2 border-b-[var(--brand-ink)] p-2.5 text-sm font-mono focus:outline-none focus:border-[var(--brand-navy)] bg-[var(--brand-surface)]"
                  placeholder="admin / user / fauzi"
                />
              </div>
              <div>
                <label className="block font-condensed uppercase tracking-wider text-xs font-bold mb-1.5 flex items-center gap-2 text-[var(--brand-navy)]">
                  <Lock className="w-3 h-3" /> Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-[var(--brand-border)] border-b-2 border-b-[var(--brand-ink)] p-2.5 text-sm font-mono focus:outline-none focus:border-[var(--brand-navy)] bg-[var(--brand-surface)] pr-10"
                    placeholder="••••••"
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
                {loading ? 'Memproses...' : 'Masuk'}
                {!loading && <ChevronRight className="w-4 h-4" />}
              </button>
            </form>

            {/* Google OAuth button */}
            <a
              href="/api/auth/oauth/google"
              className="flex items-center justify-center gap-2.5 border border-[var(--brand-border)] py-3 font-condensed uppercase tracking-widest text-sm hover:bg-[var(--brand-surface-2)] hover:border-[var(--brand-navy)] transition-colors mt-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Masuk dengan Google
            </a>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <span className="h-px bg-[var(--brand-border)] flex-grow" />
              <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--brand-ink-muted)]">ATAU COBA</span>
              <span className="h-px bg-[var(--brand-border)] flex-grow" />
            </div>

            {/* Test accounts */}
            <div className="space-y-2">
              <p className="font-condensed uppercase tracking-widest text-[10px] text-[var(--brand-ink-muted)] font-bold mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-[var(--brand-orange)]" /> Akun Demo
              </p>
              {TEST_ACCOUNTS.map((acc) => (
                <button
                  key={acc.username}
                  onClick={() => quickLogin(acc.username, acc.password)}
                  type="button"
                  className="w-full text-left p-2.5 border border-[var(--brand-border)] hover:border-[var(--brand-navy)] hover:bg-[var(--brand-surface-2)] transition-all group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-condensed text-xs uppercase tracking-wide flex items-center gap-2">
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${acc.role === 'Admin' ? 'bg-[var(--brand-navy)]' : 'bg-[var(--brand-orange)]'}`}
                        />
                        {acc.role}
                        <span className="font-mono font-normal text-[var(--brand-ink-muted)] lowercase text-[10px]">
                          {acc.username} / {acc.password}
                        </span>
                      </p>
                      <p className="text-[10px] text-[var(--brand-ink-muted)] mt-0.5">{acc.desc}</p>
                    </div>
                    <ChevronRight className="w-3 h-3 text-[var(--brand-ink-muted)] group-hover:text-[var(--brand-navy)] flex-shrink-0 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
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
