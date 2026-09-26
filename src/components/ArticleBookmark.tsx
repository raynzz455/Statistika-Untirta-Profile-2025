'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Bookmark } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ArticleBookmarkProps {
  articleId: string
  size?: 'sm' | 'md' | 'lg'
}

export function ArticleBookmark({ articleId, size = 'md' }: ArticleBookmarkProps) {
  const user = useAppStore((s) => s.user)
  const [bookmarked, setBookmarked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/articles/${articleId}/bookmark`)
      .then((r) => r.json())
      .then((d) => !cancelled && setBookmarked(d.bookmarked))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [articleId])

  const toggle = async () => {
    if (!user) {
      toast.error('Login dulu untuk menyimpan artikel.')
      return
    }
    if (loading) return

    const prev = bookmarked
    setBookmarked(!prev)
    setAnimating(true)
    setTimeout(() => setAnimating(false), 400)

    try {
      const res = await fetch(`/api/articles/${articleId}/bookmark`, { method: 'POST' })
      const d = await res.json()
      if (d.error) {
        setBookmarked(prev)
        toast.error(d.error)
        return
      }
      setBookmarked(d.bookmarked)
      toast.success(d.bookmarked ? 'Artikel disimpan!' : 'Bookmark dihapus.')
    } catch {
      setBookmarked(prev)
      toast.error('Gagal memperbarui bookmark.')
    }
  }

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2',
  }
  const iconSizes = { sm: 'w-3 h-3', md: 'w-4 h-4', lg: 'w-5 h-5' }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={cn(
        'inline-flex items-center font-condensed uppercase tracking-widest border transition-all',
        sizeClasses[size],
        bookmarked
          ? 'bg-[var(--brand-ink)] text-[var(--brand-surface)] border-[var(--brand-ink)]'
          : 'bg-[var(--brand-surface-2)] text-[var(--brand-ink)] border-[var(--brand-ink)] hover:bg-[var(--brand-orange)]/15 hover:border-[var(--brand-orange)]',
        loading && 'opacity-50'
      )}
      aria-pressed={bookmarked}
      aria-label={bookmarked ? 'Hapus dari simpanan' : 'Simpan artikel'}
      title={user ? (bookmarked ? 'Klik untuk hapus dari simpanan' : 'Simpan untuk dibaca nanti') : 'Login untuk menyimpan'}
    >
      <Bookmark
        className={cn(
          iconSizes[size],
          'transition-transform',
          bookmarked && 'fill-current',
          animating && 'scale-125 animate-[pop-in_0.4s_ease-out]'
        )}
      />
      <span className="hidden sm:inline">{bookmarked ? 'Tersimpan' : 'Simpan'}</span>
    </button>
  )
}
