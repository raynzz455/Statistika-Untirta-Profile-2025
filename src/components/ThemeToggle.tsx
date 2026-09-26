'use client'

import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

type ThemeMode = 'light' | 'dark' | 'system'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const user = useAppStore((s) => s.user)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  // When user logs in, apply their persisted theme preference (if any)
  useEffect(() => {
    if (!mounted || !user) return
    if (user.theme && user.theme !== theme) {
      setTheme(user.theme)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, mounted])

  const current = mounted ? (theme as ThemeMode) : 'light'
  const isDark = (mounted ? resolvedTheme : 'light') === 'dark'

  // Cycle through: light → dark → system → light
  const cycle = () => {
    const next: ThemeMode = current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light'
    setTheme(next)
    // Persist to server if logged in (fire-and-forget)
    if (user) {
      fetch('/api/auth/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: next }),
      }).catch(() => {})
    }
  }

  const label = current === 'system' ? 'Mode Sistem' : isDark ? 'Mode Gelap' : 'Mode Terang'

  return (
    <button
      onClick={cycle}
      className="relative w-9 h-9 rounded-full border border-[var(--brand-ink)] bg-[var(--brand-ivory)] hover:bg-[var(--brand-orange)]/15 transition-colors flex items-center justify-center group"
      aria-label={label}
      title={label}
    >
      {/* Sun icon (visible in light mode) */}
      <Sun
        className={cn(
          'absolute w-4 h-4 text-[var(--brand-ink)] transition-all duration-500',
          current === 'light' ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'
        )}
      />
      {/* Moon icon (visible in dark mode) */}
      <Moon
        className={cn(
          'absolute w-4 h-4 text-[var(--brand-ink)] transition-all duration-500',
          current === 'dark' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
        )}
      />
      {/* Monitor icon (visible in system mode) */}
      <Monitor
        className={cn(
          'absolute w-4 h-4 text-[var(--brand-ink)] transition-all duration-500',
          current === 'system' ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'
        )}
      />
      {/* Decorative ring on hover */}
      <span className="absolute inset-0 rounded-full border border-[var(--brand-ink)]/0 group-hover:border-[var(--brand-ink)]/30 transition-all" />
      {/* Persisted indicator (small dot when saved to server) */}
      {user && (
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[var(--brand-orange)] border border-[var(--brand-surface)]" title="Tersimpan ke akun" />
      )}
      {/* System indicator: small "S" badge when in system mode */}
      {current === 'system' && (
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[var(--brand-blue-dark)] border border-[var(--brand-surface)] flex items-center justify-center" title="Mengikuti sistem">
          <span className="text-[6px] font-bold text-[var(--brand-surface)]">S</span>
        </span>
      )}
    </button>
  )
}
