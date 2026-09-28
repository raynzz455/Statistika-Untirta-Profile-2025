'use client'

import { useEffect, useRef, useState } from 'react'
import { Play, Pause, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MusicPlayerProps {
  songTitle?: string | null
  artist?: string | null
  audioUrl?: string | null
  /** compact = inline mini-player for directory cards; full = larger for profile */
  variant?: 'compact' | 'full'
}

export function MusicPlayer({ songTitle, artist, audioUrl, variant = 'compact' }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [muted, setMuted] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audioUrl) return

    const onTimeUpdate = () => setProgress(audio.currentTime)
    const onLoadedMetadata = () => setDuration(audio.duration || 0)
    const onEnded = () => { setPlaying(false); setProgress(0) }
    const onWaiting = () => setLoading(true)
    const onPlaying = () => setLoading(false)

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('waiting', onWaiting)
    audio.addEventListener('playing', onPlaying)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('waiting', onWaiting)
      audio.removeEventListener('playing', onPlaying)
    }
  }, [audioUrl])

  // Stop audio when unmounting
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [])

  const togglePlay = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const audio = audioRef.current
    if (!audio || !audioUrl) return

    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => {})
    }
  }

  const toggleMute = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const audio = audioRef.current
    if (!audio) return
    audio.muted = !audio.muted
    setMuted(audio.muted)
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const audio = audioRef.current
    if (!audio || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    audio.currentTime = pct * duration
    setProgress(audio.currentTime)
  }

  if (!audioUrl) {
    // No song — show "no song" state
    if (variant === 'compact') {
      return null // hide entirely in compact mode
    }
    return (
      <div className="border border-[var(--brand-border)] p-3 bg-[var(--brand-surface-2)] text-center">
        <p className="text-[10px] uppercase tracking-widest font-condensed text-[var(--brand-ink-muted)]">
          Belum ada lagu tema
        </p>
      </div>
    )
  }

  const fmtTime = (s: number) => {
    if (!s || isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const pct = duration ? (progress / duration) * 100 : 0

  if (variant === 'compact') {
    // Mini player for directory cards — single row, pinned to card bottom
    return (
      <div
        className="flex items-center gap-1.5 px-2 py-1 border-t border-[var(--brand-border)] bg-[var(--brand-surface)] group/player flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <audio ref={audioRef} src={audioUrl} preload="metadata" />
        <button
          onClick={togglePlay}
          className="w-6 h-6 flex-shrink-0 flex items-center justify-center bg-[var(--brand-navy)] text-[var(--brand-surface)] hover:bg-[var(--brand-navy-light)] transition-colors rounded-full"
          aria-label={playing ? 'Pause' : 'Play'}
          title={playing ? 'Pause' : 'Play'}
        >
          {loading ? (
            <span className="w-2 h-2 border border-current border-t-transparent rounded-full animate-spin" />
          ) : playing ? (
            <Pause className="w-3 h-3" />
          ) : (
            <Play className="w-3 h-3 ml-0.5" />
          )}
        </button>
        <div className="flex-grow min-w-0">
          <p className="text-[9px] font-body font-semibold leading-tight truncate" title={songTitle || ''}>
            {songTitle || 'Unknown'}
          </p>
          <p className="text-[8px] text-[var(--brand-ink-muted)] leading-tight truncate">
            {artist || ''}
          </p>
        </div>
        <span className="text-[8px] font-mono text-[var(--brand-ink-muted)] flex-shrink-0">
          {fmtTime(progress)} / {fmtTime(duration)}
        </span>
      </div>
    )
  }

  // Full player for profile page
  return (
    <div className="border border-[var(--brand-ink)] bg-[var(--brand-surface-2)] p-4">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={togglePlay}
          className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-[var(--brand-navy)] text-[var(--brand-surface)] hover:bg-[var(--brand-navy-light)] transition-colors rounded-full"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : playing ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </button>
        <div className="flex-grow min-w-0">
          <p className="font-serif font-bold text-sm leading-tight truncate">{songTitle || 'Unknown'}</p>
          <p className="text-xs text-[var(--brand-ink-muted)] truncate">{artist || 'Unknown artist'}</p>
        </div>
        <button
          onClick={toggleMute}
          className="p-1.5 text-[var(--brand-ink-muted)] hover:text-[var(--brand-ink)]"
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
      {/* Progress bar */}
      <div
        className="h-1.5 bg-[var(--brand-border)] cursor-pointer overflow-hidden"
        onClick={seek}
      >
        <div
          className="h-full bg-[var(--brand-navy)] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] font-mono text-[var(--brand-ink-muted)]">{fmtTime(progress)}</span>
        <span className="text-[9px] font-mono text-[var(--brand-ink-muted)]">{fmtTime(duration)}</span>
      </div>
    </div>
  )
}
