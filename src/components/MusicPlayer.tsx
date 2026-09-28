'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { Play, Pause, Volume2, VolumeX, ExternalLink, Music2, Youtube } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// URL TYPE DETECTION
// ============================================================================

type AudioUrlType = 'spotify' | 'youtube' | 'direct-audio' | 'external' | 'none'

interface UrlInfo {
  type: AudioUrlType
  embedUrl?: string  // URL for iframe embed (Spotify/YouTube)
  trackId?: string   // Extracted track/video ID
}

function detectUrlType(url: string | null | undefined): UrlInfo {
  if (!url || !url.trim()) return { type: 'none' }

  const u = url.trim().toLowerCase()

  // Spotify: https://open.spotify.com/track/TRACK_ID or spotify:track:TRACK_ID
  const spotifyMatch = url.match(/open\.spotify\.com\/(?:track|album|playlist|episode)\/([a-zA-Z0-9]+)/i)
    || url.match(/spotify:(?:track|album|playlist|episode):([a-zA-Z0-9]+)/i)
  if (spotifyMatch) {
    const trackId = spotifyMatch[1]
    const embedUrl = `https://open.spotify.com/embed/${url.includes('/album/') ? 'album' : url.includes('/playlist/') ? 'playlist' : 'track'}/${trackId}`
    return { type: 'spotify', embedUrl, trackId }
  }

  // YouTube: https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/i)
  if (ytMatch) {
    const videoId = ytMatch[1]
    const embedUrl = `https://www.youtube.com/embed/${videoId}`
    return { type: 'youtube', embedUrl, trackId: videoId }
  }

  // Direct audio: ends with .mp3, .ogg, .wav, .m4a, .aac
  if (u.match(/\.(mp3|ogg|wav|m4a|aac|flac)(\?.*)?$/)) {
    return { type: 'direct-audio' }
  }

  // Fallback: external link (SoundCloud, Apple Music, Bandcamp, etc.)
  return { type: 'external' }
}

// ============================================================================
// MUSIC PLAYER COMPONENT
// ============================================================================

interface MusicPlayerProps {
  songTitle?: string | null
  artist?: string | null
  audioUrl?: string | null
  variant?: 'compact' | 'full'
}

export function MusicPlayer({ songTitle, artist, audioUrl, variant = 'compact' }: MusicPlayerProps) {
  const urlInfo = useMemo(() => detectUrlType(audioUrl), [audioUrl])

  // === NO SONG ===
  if (urlInfo.type === 'none') {
    if (variant === 'compact') return null
    return (
      <div className="border border-[var(--brand-border)] p-3 bg-[var(--brand-surface-2)] text-center">
        <p className="text-[10px] uppercase tracking-widest font-condensed text-[var(--brand-ink-muted)]">
          Belum ada lagu tema
        </p>
      </div>
    )
  }

  // === COMPACT VARIANT (directory card) ===
  if (variant === 'compact') {
    return <CompactPlayer songTitle={songTitle} artist={artist} audioUrl={audioUrl} urlInfo={urlInfo} />
  }

  // === FULL VARIANT (profile page) ===
  return <FullPlayer songTitle={songTitle} artist={artist} audioUrl={audioUrl} urlInfo={urlInfo} />
}

// ============================================================================
// COMPACT PLAYER (for directory cards)
// ============================================================================

function CompactPlayer({
  songTitle,
  artist,
  audioUrl,
  urlInfo,
}: {
  songTitle?: string | null
  artist?: string | null
  audioUrl?: string | null
  urlInfo: UrlInfo
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
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

  useEffect(() => {
    return () => { if (audioRef.current) audioRef.current.pause() }
  }, [])

  const togglePlay = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const audio = audioRef.current
    if (!audio || !audioUrl) return
    if (playing) { audio.pause(); setPlaying(false) }
    else { audio.play().then(() => setPlaying(true)).catch(() => {}) }
  }

  const fmtTime = (s: number) => {
    if (!s || isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const ServiceIcon = urlInfo.type === 'spotify' ? Music2 : urlInfo.type === 'youtube' ? Youtube : Play
  const serviceColor = urlInfo.type === 'spotify' ? 'text-[#1DB954]' : urlInfo.type === 'youtube' ? 'text-[#FF0000]' : ''

  // For Spotify/YouTube/external in compact mode: show icon + title, click opens in new tab
  if (urlInfo.type !== 'direct-audio') {
    return (
      <a
        href={audioUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-2 py-1 border-t border-[var(--brand-border)] bg-[var(--brand-surface)] group/player flex-shrink-0 hover:bg-[var(--brand-surface-2)] transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={cn('w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full', serviceColor)}>
          <ServiceIcon className="w-3 h-3" />
        </div>
        <div className="flex-grow min-w-0">
          <p className="text-[9px] font-body font-semibold leading-tight truncate" title={songTitle || ''}>
            {songTitle || 'Unknown'}
          </p>
          <p className="text-[8px] text-[var(--brand-ink-muted)] leading-tight truncate">
            {urlInfo.type === 'spotify' ? 'Spotify' : urlInfo.type === 'youtube' ? 'YouTube' : 'External'} {artist ? `· ${artist}` : ''}
          </p>
        </div>
        <ExternalLink className="w-3 h-3 text-[var(--brand-ink-muted)] flex-shrink-0" />
      </a>
    )
  }

  // Direct audio in compact mode (current behavior)
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

// ============================================================================
// FULL PLAYER (for profile page)
// ============================================================================

function FullPlayer({
  songTitle,
  artist,
  audioUrl,
  urlInfo,
}: {
  songTitle?: string | null
  artist?: string | null
  audioUrl?: string | null
  urlInfo: UrlInfo
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [muted, setMuted] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audioUrl || urlInfo.type !== 'direct-audio') return

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
  }, [audioUrl, urlInfo.type])

  useEffect(() => {
    return () => { if (audioRef.current) audioRef.current.pause() }
  }, [])

  const togglePlay = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const audio = audioRef.current
    if (!audio || !audioUrl) return
    if (playing) { audio.pause(); setPlaying(false) }
    else { audio.play().then(() => setPlaying(true)).catch(() => {}) }
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

  const fmtTime = (s: number) => {
    if (!s || isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const pct = duration ? (progress / duration) * 100 : 0

  // === SPOTIFY EMBED ===
  if (urlInfo.type === 'spotify' && urlInfo.embedUrl) {
    return (
      <div className="border border-[var(--brand-ink)] bg-[var(--brand-surface-2)] p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-[#1DB954] text-white rounded-full">
            <Music2 className="w-5 h-5" />
          </div>
          <div className="flex-grow min-w-0">
            <p className="font-serif font-bold text-sm leading-tight truncate">{songTitle || 'Spotify Track'}</p>
            <p className="text-xs text-[var(--brand-ink-muted)] truncate">
              {artist || 'Unknown artist'} · <span className="text-[#1DB954]">Spotify</span>
            </p>
          </div>
        </div>
        <iframe
          src={urlInfo.embedUrl}
          width="100%"
          height="152"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="rounded-sm"
        />
      </div>
    )
  }

  // === YOUTUBE EMBED ===
  if (urlInfo.type === 'youtube' && urlInfo.embedUrl) {
    return (
      <div className="border border-[var(--brand-ink)] bg-[var(--brand-surface-2)] p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-[#FF0000] text-white rounded-full">
            <Youtube className="w-5 h-5" />
          </div>
          <div className="flex-grow min-w-0">
            <p className="font-serif font-bold text-sm leading-tight truncate">{songTitle || 'YouTube Video'}</p>
            <p className="text-xs text-[var(--brand-ink-muted)] truncate">
              {artist || 'Unknown artist'} · <span className="text-[#FF0000]">YouTube</span>
            </p>
          </div>
        </div>
        <div className="aspect-video w-full overflow-hidden border border-[var(--brand-border)]">
          <iframe
            src={urlInfo.embedUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            className="w-full h-full"
          />
        </div>
      </div>
    )
  }

  // === EXTERNAL LINK (SoundCloud, Apple Music, Bandcamp, etc.) ===
  if (urlInfo.type === 'external') {
    return (
      <div className="border border-[var(--brand-ink)] bg-[var(--brand-surface-2)] p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-[var(--brand-navy)] text-[var(--brand-surface)] rounded-full">
            <Music2 className="w-5 h-5" />
          </div>
          <div className="flex-grow min-w-0">
            <p className="font-serif font-bold text-sm leading-tight truncate">{songTitle || 'External Link'}</p>
            <p className="text-xs text-[var(--brand-ink-muted)] truncate">{artist || 'Unknown artist'}</p>
          </div>
          <a
            href={audioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-[var(--brand-navy)] text-[var(--brand-surface)] px-4 py-2 text-xs font-condensed uppercase tracking-widest hover:bg-[var(--brand-navy-light)] transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Buka
          </a>
        </div>
      </div>
    )
  }

  // === DIRECT AUDIO (HTML5 audio player — current behavior) ===
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
      <div className="h-1.5 bg-[var(--brand-border)] cursor-pointer overflow-hidden" onClick={seek}>
        <div className="h-full bg-[var(--brand-navy)] transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] font-mono text-[var(--brand-ink-muted)]">{fmtTime(progress)}</span>
        <span className="text-[9px] font-mono text-[var(--brand-ink-muted)]">{fmtTime(duration)}</span>
      </div>
    </div>
  )
}
