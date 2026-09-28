'use client'

import { useEffect, useState } from 'react'
import { Menu, Search, LogOut, User, Shield, X, Sparkles } from 'lucide-react'
import { useAppStore, type ViewName } from '@/lib/store'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ThemeToggle'
import { NotificationBell } from '@/components/NotificationBell'

const NAV: { label: string; view: ViewName; short?: string }[] = [
  { label: 'Beranda', view: 'home' },
  { label: 'Direktori', view: 'directory' },
  { label: 'Rotasi Kelas', view: 'classes' },
  { label: 'Galeri Momen', view: 'gallery' },
  { label: 'Artikel', view: 'articles' },
  { label: 'Series', view: 'series' },
  { label: 'Event', view: 'events' },
  { label: 'Aspirasi', view: 'aspirasi' },
  { label: 'Tentang', view: 'about' },
]

const STATS = [
  { label: 'Jumlah Anggota', value: '120' },
  { label: 'Jumlah Kelas', value: '2' },
  { label: 'Angkatan Ke', value: '03' },
  { label: 'Tahun Masuk', value: '25' },
]

export function Header() {
  const setView = useAppStore((s) => s.setView)
  const user = useAppStore((s) => s.user)
  const currentView = useAppStore((s) => s.view)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const go = (v: ViewName) => {
    setView(v)
    setMobileOpen(false)
  }

  return (
    <>
      <header className="px-4 md:px-8 pt-4 md:pt-6 pb-3 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-4 border-b border-[var(--brand-border)] text-center md:text-left">
        {/* Left: Logo */}
        <div className="flex flex-col md:flex-row items-center gap-3">
          <button
            onClick={() => go('home')}
            className="w-16 h-16 md:w-[4.5rem] md:h-[4.5rem] border border-[var(--brand-ink)] rounded-full flex flex-col items-center justify-center p-1 flex-shrink-0 hover:bg-[var(--brand-ink)] hover:text-[var(--brand-surface)] transition-colors group"
            aria-label="Beranda"
          >
            <span className="font-condensed text-[11px] uppercase leading-none group-hover:text-[var(--brand-surface)]">EST. 2023</span>
            <span className="font-condensed text-base md:text-lg font-bold leading-none tracking-tight my-0.5 group-hover:text-[var(--brand-surface)]">UNTIRTA</span>
            <span className="font-condensed text-[9px] uppercase leading-none group-hover:text-[var(--brand-surface)]">BANTEN</span>
          </button>
          <div>
            <h1 className="font-condensed text-2xl md:text-3xl tracking-tight uppercase leading-none mb-1">
              STATISTIKA <span className="text-[var(--brand-orange)]">'25</span>
            </h1>
            <p className="font-condensed text-xs md:text-sm tracking-[0.15em] text-[var(--brand-ink-muted)] uppercase">
              Data • Analisis • Probabilitas
            </p>
            <div className="flex justify-center md:justify-start items-center gap-2 mt-1.5 text-xs font-mono text-[var(--brand-ink)]/60">
              <span>Kampus Cilegon</span>
              <span className="w-1 h-1 bg-[var(--brand-ink)]/30 rounded-full" />
              <span>Fakultas Teknik</span>
            </div>
          </div>
        </div>

        {/* Center: Main Title */}
        <div className="border border-[var(--brand-border)] py-3 px-6 md:px-10 text-center hidden md:block">
          <h2 className="font-condensed text-lg md:text-xl tracking-[0.15em] mb-1 uppercase">Profil Angkatan</h2>
          <div className="flex items-center justify-center gap-3">
            <div className="h-px bg-[var(--brand-border)] flex-grow" />
            <span className="font-mono text-xs text-[var(--brand-ink-muted)]">Tahun 2025</span>
            <div className="h-px bg-[var(--brand-border)] flex-grow" />
          </div>
        </div>

        {/* Right: Info */}
        <div className="text-center md:text-right flex flex-col items-center md:items-end">
          <p className="font-serif italic text-sm md:text-base text-[var(--brand-ink-muted)] mb-0.5">Sekretariat BEM FT</p>
          <p className="font-serif text-lg md:text-xl tracking-tight">
            Gedung <span className="font-normal text-[var(--brand-ink-muted)] text-sm ml-1">Cilegon</span>
          </p>
          <button
            onClick={() => go('about')}
            className="text-xs md:text-sm font-condensed uppercase tracking-widest text-[var(--brand-orange)] hover:text-[var(--brand-ink)] transition-colors mt-1"
          >
            Tentang Prodi →
          </button>
        </div>
      </header>

      {/* Stats bar */}
      <div className="bg-[var(--brand-orange)]/15 border-b border-[var(--brand-border)] py-2 px-4 md:px-8 flex items-center overflow-x-auto gap-4 md:gap-6 hide-scrollbar whitespace-nowrap">
        {STATS.map((stat, idx) => (
          <div
            key={idx}
            className="flex-shrink-0 flex items-center gap-2 border-r border-[var(--brand-ink)]/20 pr-4 md:pr-6 last:border-0"
          >
            <span className="font-body text-sm md:text-base font-semibold text-[var(--brand-ink)]">{stat.label}</span>
            <span className="bg-[var(--brand-navy)] text-[var(--brand-surface)] font-bold font-body text-sm md:text-base px-2 py-0.5">
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      {/* Nav row — consistent on mobile and desktop */}
      <nav
        className={cn(
          'sticky top-0 z-30 bg-[var(--brand-surface)]/95 backdrop-blur border-b-2 border-[var(--brand-ink)] py-2.5 md:py-3 px-4 md:px-8 flex items-center justify-between gap-2 transition-shadow',
          scrolled && 'shadow-md'
        )}
      >
        {/* Left: hamburger (mobile) or nav links (desktop) */}
        <div className="flex items-center gap-2 md:gap-3 flex-grow md:flex-grow-0">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 hover:bg-[var(--brand-orange)]/15 rounded border border-[var(--brand-border)]"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          {/* Desktop nav links — horizontal scroll on overflow */}
          <div className="hidden md:flex items-center overflow-x-auto hide-scrollbar whitespace-nowrap text-sm font-condensed uppercase tracking-wider text-[var(--brand-ink-muted)] gap-x-5">
            {NAV.map((item) => {
              const isActive = currentView === item.view
              return (
                <button
                  key={item.view}
                  onClick={() => go(item.view)}
                  className={cn(
                    'flex-shrink-0 py-1 border-b-2 transition-colors',
                    isActive
                      ? 'text-[var(--brand-navy)] border-[var(--brand-orange)] font-medium'
                      : 'border-transparent hover:text-[var(--brand-ink)]'
                  )}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Right: actions — consistent size on mobile and desktop */}
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          {user ? (
            <div className="flex items-center gap-2 md:gap-3">
              {user.role === 'admin' && (
                <button
                  onClick={() => go('admin')}
                  className="flex items-center gap-1.5 text-sm font-condensed uppercase tracking-wider text-[var(--brand-ink)] hover:text-[var(--brand-orange)] transition-colors"
                >
                  <Shield className="w-4 h-4" /> <span className="hidden sm:inline">Admin</span>
                </button>
              )}
              <button
                onClick={() => go('settings')}
                className="flex items-center gap-1.5 text-sm font-condensed uppercase tracking-wider text-[var(--brand-ink)] hover:text-[var(--brand-orange)] transition-colors max-w-[140px] truncate"
              >
                <User className="w-4 h-4" /> <span className="hidden sm:inline truncate">{user.displayName || user.username}</span>
              </button>
              <LogoutButton />
            </div>
          ) : (
            <button
              onClick={() => go('login')}
              className="flex items-center gap-1.5 text-sm font-condensed uppercase tracking-wider text-[var(--brand-ink)] hover:text-[var(--brand-orange)] transition-colors"
            >
              <User className="w-4 h-4" /> Login
            </button>
          )}
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 hover:bg-[var(--brand-orange)]/15 rounded border border-[var(--brand-border)]"
            aria-label="Cari"
          >
            <Search className="w-4 h-4 text-[var(--brand-ink-muted)]" />
          </button>
          <NotificationBell />
          <ThemeToggle />
        </div>
      </nav>

      {/* Mobile menu — slide-down panel */}
      {mobileOpen && (
        <div className="md:hidden border-b-2 border-[var(--brand-ink)] bg-[var(--brand-surface)]">
          <nav className="flex flex-col p-2">
            {NAV.map((item) => {
              const isActive = currentView === item.view
              return (
                <button
                  key={item.view}
                  onClick={() => go(item.view)}
                  className={cn(
                    'text-left font-condensed text-base uppercase tracking-wider py-3 px-4 border-b border-[var(--brand-border)] last:border-0 transition-colors flex items-center justify-between',
                    isActive
                      ? 'text-[var(--brand-surface)] font-bold bg-[var(--brand-navy)]'
                      : 'text-[var(--brand-ink-muted)] hover:text-[var(--brand-ink)] hover:bg-[var(--brand-surface-2)]'
                  )}
                >
                  <span>{item.label}</span>
                  {isActive && <span className="text-[var(--brand-orange)] text-xs">●</span>}
                </button>
              )
            })}
          </nav>
        </div>
      )}

      {/* Search overlay */}
      {searchOpen && (
        <SearchOverlay onClose={() => setSearchOpen(false)} />
      )}
    </>
  )
}

function LogoutButton() {
  const logoutClient = useAppStore((s) => s.logoutClient)
  const setView = useAppStore((s) => s.setView)
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    setLoading(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // ignore
    }
    logoutClient()
    setView('home')
    setLoading(false)
  }

  return (
    <button
      onClick={handle}
      disabled={loading}
      className="flex items-center gap-1.5 text-sm font-condensed uppercase tracking-wider text-[var(--brand-ink-muted)] hover:text-[var(--brand-ink)] disabled:opacity-50 transition-colors"
    >
      <LogOut className="w-4 h-4" /> {loading ? '...' : 'Keluar'}
    </button>
  )
}

interface SearchItem {
  id: string
  type: 'student' | 'article' | 'event' | 'gallery' | 'member'
  title: string
  subtitle: string
  tag?: string
  view: 'profile' | 'article-detail' | 'events' | 'gallery' | 'member-profile'
}

function SearchOverlay({ onClose }: { onClose: () => void }) {
  const setView = useAppStore((s) => s.setView)
  const [q, setQ] = useState('')
  const [results, setResults] = useState<{
    students: SearchItem[]
    articles: SearchItem[]
    events: SearchItem[]
    gallery: SearchItem[]
    users: SearchItem[]
  }>({ students: [], articles: [], events: [], gallery: [], users: [] })
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (!q.trim() || q.trim().length < 2) {
      setResults({ students: [], articles: [], events: [], gallery: [], users: [] })
      setLoading(false)
      return
    }
    setLoading(true)
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q.trim())}&limit=5`)
        .then((r) => r.json())
        .then((d) => setResults(d))
        .catch(() => setResults({ students: [], articles: [], events: [], gallery: [], users: [] }))
        .finally(() => setLoading(false))
    }, 200)
    return () => clearTimeout(t)
  }, [q])

  const flatResults: SearchItem[] = [
    ...results.students,
    ...results.articles,
    ...results.events,
    ...results.gallery,
    ...results.users,
  ]
  const total = flatResults.length

  useEffect(() => setActiveIndex(0), [q])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, total - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && flatResults[activeIndex]) {
      e.preventDefault()
      const item = flatResults[activeIndex]
      setView(item.view, item.view === 'gallery' ? null : item.id)
      onClose()
    }
  }

  const typeIcon: Record<SearchItem['type'], string> = {
    student: '👤',
    article: '📝',
    event: '📅',
    gallery: '🖼️',
    member: '⭐',
  }
  const typeLabel: Record<SearchItem['type'], string> = {
    student: 'Mahasiswa',
    article: 'Artikel',
    event: 'Event',
    gallery: 'Galeri',
    member: 'Member',
  }

  const goto = (item: SearchItem) => {
    setView(item.view, item.view === 'gallery' ? null : item.id)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 px-4"
      onClick={onClose}
    >
      <div
        className="bg-[var(--brand-surface)] w-full max-w-2xl border border-[var(--brand-ink)] shadow-hard-lg max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--brand-border)] bg-[var(--brand-ink)] text-[var(--brand-surface)]">
          <span className="font-condensed uppercase tracking-widest text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--brand-orange)]" /> Pencarian Global
          </span>
          <button onClick={onClose} aria-label="Tutup" className="hover:text-[var(--brand-orange)]">
            <X className="w-4 h-4" />
          </button>
        </div>
        <input
          autoFocus
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ketik untuk mencari mahasiswa, artikel, event, atau galeri..."
          className="w-full px-4 py-4 text-sm focus:outline-none bg-[var(--brand-surface)] text-[var(--brand-ink)] placeholder:text-[var(--brand-ink-muted)]"
        />
        <div className="overflow-y-auto custom-scroll flex-grow">
          {loading && (
            <div className="px-4 py-6 text-center text-sm text-[var(--brand-ink-muted)]">
              <span className="inline-block w-4 h-4 border-2 border-[var(--brand-orange)] border-t-transparent rounded-full animate-spin mr-2 align-middle" />
              Mencari...
            </div>
          )}
          {!loading && q.trim().length >= 2 && total === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="font-serif italic text-lg text-[var(--brand-ink-muted)]">
                Tidak ditemukan hasil untuk &ldquo;{q}&rdquo;
              </p>
              <p className="text-xs text-[var(--brand-ink-muted)] mt-2">
                Coba kata kunci lain atau kunjungi halaman masing-masing.
              </p>
            </div>
          )}
          {!loading && total > 0 && (
            <div className="py-2">
              {flatResults.map((item, i) => (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => goto(item)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`w-full text-left px-4 py-3 border-b border-[var(--brand-border)] last:border-0 transition-colors flex items-start gap-3 ${
                    i === activeIndex ? 'bg-[var(--brand-orange)]/15' : 'hover:bg-[var(--brand-surface-2)]'
                  }`}
                >
                  <span className="text-xl flex-shrink-0 mt-0.5">{typeIcon[item.type]}</span>
                  <div className="min-w-0 flex-grow">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[9px] uppercase tracking-widest font-condensed text-[var(--brand-orange)] bg-[var(--brand-orange)]/15 border border-[var(--brand-orange)] px-1.5 py-0.5">
                        {typeLabel[item.type]}
                      </span>
                      <p className="font-condensed text-sm truncate text-[var(--brand-ink)]">
                        {item.title}
                      </p>
                    </div>
                    <p className="text-xs text-[var(--brand-ink-muted)] truncate">{item.subtitle}</p>
                    {item.tag && (
                      <p className="text-[11px] text-[var(--brand-ink-muted)] italic mt-1 line-clamp-1">
                        &ldquo;{item.tag}&rdquo;
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] uppercase tracking-widest text-[var(--brand-ink-muted)] flex-shrink-0">
                    {i === activeIndex ? 'Enter ↵' : ''}
                  </span>
                </button>
              ))}
              <div className="px-4 py-2 text-[10px] uppercase tracking-widest font-condensed text-[var(--brand-ink-muted)] bg-[var(--brand-surface-2)] border-t border-[var(--brand-border)]">
                {total} hasil • gunakan ↑ ↓ untuk navigasi • Enter untuk buka
              </div>
            </div>
          )}
          {!loading && q.trim().length < 2 && (
            <div className="px-4 py-8 text-center">
              <p className="font-serif italic text-sm text-[var(--brand-ink-muted)]">
                Ketik minimal 2 huruf untuk mulai mencari.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {['Ahmad', 'Makrab', 'UTS', 'Kuliah Tamu', 'Kelas A'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setQ(s)}
                    className="text-[10px] uppercase tracking-widest font-condensed border border-[var(--brand-ink)] px-2 py-1 hover:bg-[var(--brand-orange)]/15 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
