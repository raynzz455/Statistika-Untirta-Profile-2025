'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { UserPlus, UserCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface FollowButtonProps {
  targetUserId: string
  size?: 'sm' | 'md' | 'lg'
}

export function FollowButton({ targetUserId, size = 'md' }: FollowButtonProps) {
  const user = useAppStore((s) => s.user)
  const [following, setFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/users/${targetUserId}/follow`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        setFollowing(d.following)
        setFollowersCount(d.followersCount)
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [targetUserId])

  const toggle = async () => {
    if (!user) {
      toast.error('Login dulu untuk follow member.')
      return
    }
    if (loading) return
    if (user.id === targetUserId) return // can't follow self

    const prev = following
    setFollowing(!prev)
    setFollowersCount((c) => c + (prev ? -1 : 1))
    setAnimating(true)
    setTimeout(() => setAnimating(false), 400)

    try {
      const res = await fetch(`/api/users/${targetUserId}/follow`, { method: 'POST' })
      const d = await res.json()
      if (d.error) {
        setFollowing(prev)
        setFollowersCount((c) => c + (prev ? 1 : -1))
        toast.error(d.error)
        return
      }
      setFollowing(d.following)
      toast.success(d.following ? 'Berhasil follow!' : 'Unfollow berhasil.')
    } catch {
      setFollowing(prev)
      setFollowersCount((c) => c + (prev ? 1 : -1))
      toast.error('Gagal memperbarui follow.')
    }
  }

  // Don't show follow button on own profile
  if (user?.id === targetUserId) return null

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2',
  }
  const iconSizes = { sm: 'w-3 h-3', md: 'w-4 h-4', lg: 'w-5 h-5' }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        onClick={toggle}
        disabled={loading}
        className={cn(
          'inline-flex items-center font-condensed uppercase tracking-widest border transition-all',
          sizeClasses[size],
          following
            ? 'bg-[var(--brand-surface-2)] text-[var(--brand-ink)] border-[var(--brand-ink)] hover:bg-[var(--brand-orange)]/15'
            : 'bg-[var(--brand-ink)] text-[var(--brand-surface)] border-[var(--brand-ink)] hover:bg-[var(--brand-maroon)]',
          loading && 'opacity-50'
        )}
        aria-pressed={following}
        aria-label={following ? 'Unfollow' : 'Follow member ini'}
        title={user ? (following ? 'Klik untuk unfollow' : 'Follow member ini') : 'Login untuk follow'}
      >
        {following ? (
          <UserCheck className={cn(iconSizes[size], 'transition-transform', animating && 'scale-125')} />
        ) : (
          <UserPlus className={cn(iconSizes[size], 'transition-transform', animating && 'scale-125')} />
        )}
        <span>{following ? 'Following' : 'Follow'}</span>
      </button>
      {followersCount > 0 && (
        <span className="text-[10px] uppercase tracking-widest font-condensed text-[var(--brand-ink-muted)]">
          {followersCount} pengikut
        </span>
      )}
    </div>
  )
}
