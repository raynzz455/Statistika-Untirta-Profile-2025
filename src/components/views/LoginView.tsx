'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Eye, EyeOff, Lock, User as UserIcon, ShieldCheck, ChevronRight, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

const TEST_ACCOUNTS = [
  { role: 'Admin', username: 'admin', password: 'admin', desc: 'Akses penuh ke dashboard admin' },
  { role: 'Mahasiswa', username: 'user', password: 'user', desc: 'Buat artikel, event, & kelola profil' },
  { role: 'Member', username: 'fauzi', password: 'fauzi', desc: 'Profil mahasiswa tertaut akun' },
]

export function LoginView() {
  const setUser = useAppStore((s) => s.setUser)
  const setView = useAppStore((s) => s.setView)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
              <p className="font-sans text-sm text-[var(--brand-ink-muted)] leading-relaxed mb-6">
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
              <div className="bg-[var(--brand-maroon)]/10 text-[var(--brand-ink)] text-xs p-3 font-sans border-l-4 border-[var(--brand-maroon)] mb-4 flex items-start gap-2">
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
