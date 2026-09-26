'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ArticleLikeProps {
  articleId: string
  /** size variant */
  size?: 'sm' | 'md' | 'lg'
}

export function ArticleLike({ articleId, size = 'md' }: ArticleLikeProps) {
  const user = useAppStore((s) => s.user)
  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/articles/${articleId}/like`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        setLiked(d.liked)
        setCount(d.count)
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [articleId])

  const toggle = async () => {
    if (!user) {
      toast.error('Login dulu untuk menyukai artikel.')
      return
    }
    if (loading) return

    // Optimistic update with heart pop animation
    const prevLiked = liked
    const prevCount = count
    setLiked(!prevLiked)
    setCount(prevLiked ? prevCount - 1 : prevCount + 1)
    setAnimating(true)
    setTimeout(() => setAnimating(false), 400)

    try {
      const res = await fetch(`/api/articles/${articleId}/like`, { method: 'POST' })
      const d = await res.json()
      if (d.error) {
        // Revert on error
        setLiked(prevLiked)
        setCount(prevCount)
        toast.error(d.error)
        return
      }
      setLiked(d.liked)
      setCount(d.count)
    } catch {
      setLiked(prevLiked)
      setCount(prevCount)
      toast.error('Gagal memperbarui like.')
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
        liked
          ? 'bg-[var(--brand-orange)] text-[var(--brand-surface)] border-[var(--brand-orange)]'
          : 'bg-[var(--brand-surface-2)] text-[var(--brand-ink)] border-[var(--brand-ink)] hover:bg-[var(--brand-orange)]/15 hover:border-[var(--brand-orange)]',
        loading && 'opacity-50'
      )}
      aria-pressed={liked}
      aria-label={liked ? 'Batal suka' : 'Suka artikel ini'}
      title={user ? (liked ? 'Klik untuk batal suka' : 'Klik untuk menyukai') : 'Login untuk menyukai'}
    >
      <Heart
        className={cn(
          iconSizes[size],
          'transition-transform',
          liked && 'fill-current',
          animating && 'scale-125 animate-[pop-in_0.4s_ease-out]'
        )}
      />
      <span>{count}</span>
      <span className="hidden sm:inline opacity-70">{count === 1 ? 'Suka' : 'Suka'}</span>
    </button>
  )
}
