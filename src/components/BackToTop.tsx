'use client'

import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Floating "back to top" button that appears once the user scrolls past 600px.
 * Smoothly scrolls to top when clicked.
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={cn(
        'fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full',
        'bg-[var(--brand-ink)] text-[var(--brand-surface)]',
        'border-2 border-[var(--brand-orange)]',
        'flex items-center justify-center',
        'shadow-hard hover:bg-[var(--brand-maroon)] transition-all',
        'hover:-translate-y-1',
        'animate-[pop-in_0.4s_ease-out]'
      )}
      aria-label="Kembali ke atas"
      title="Kembali ke atas"
    >
      <ArrowUp className="w-5 h-5" />
      <span className="absolute inset-0 rounded-full border border-[var(--brand-orange)] animate-ping opacity-30" />
    </button>
  )
}
