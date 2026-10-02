'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { ImageOff, AlertTriangle } from 'lucide-react'

interface PlaceholderImageProps {
  /** alt text — also used as the placeholder caption when image is unavailable */
  alt: string
  /** primary src; if it fails or is empty, shows our prominent placeholder */
  src?: string
  className?: string
  /** wrapper classes, e.g. aspect ratio */
  wrapperClassName?: string
  /** grayscale filter */
  grayscale?: boolean
  /** priority load */
  priority?: boolean
}

type ImgStatus = 'loading' | 'ok' | 'fallback-empty' | 'fallback-error'

/**
 * Image component with graceful fallback to a prominent placeholder card
 * when src is missing OR fails to load.
 *
 * Distinguishes between two failure modes so the user can debug:
 *   - 'fallback-empty' → no src provided (user hasn't uploaded a photo yet)
 *     → shows "Foto Belum Diupload"
 *   - 'fallback-error' → src was provided but image failed to load
 *     → shows "Foto Gagal Dimuat" + the broken URL hint
 *     This usually means the Supabase storage bucket is still PRIVATE
 *     (user hasn't run updated supabase/storage-policies.sql to make it
 *     public). The image URL itself is correct, but the bucket rejects
 *     unauthenticated GET requests.
 */
export function PlaceholderImage({
  alt,
  src,
  className,
  wrapperClassName,
  grayscale = false,
  priority = false,
}: PlaceholderImageProps) {
  const [status, setStatus] = useState<ImgStatus>(
    src ? 'loading' : 'fallback-empty'
  )

  // If src changes, reset to appropriate state
  useEffect(() => {
    setStatus(src ? 'loading' : 'fallback-empty')
  }, [src])

  if (status === 'fallback-empty' || status === 'fallback-error' || !src) {
    const isError = status === 'fallback-error'
    return (
      <div
        className={cn(
          'relative w-full h-full flex items-center justify-center overflow-hidden',
          isError
            ? 'bg-gradient-to-br from-[#fce8d8] via-[#fdf0e0] to-[#f0d8c5]'
            : 'bg-gradient-to-br from-[#f9d8e5] via-[#fce8f0] to-[#f0c5d8]',
          wrapperClassName
        )}
        role="img"
        aria-label={alt || 'Foto tidak tersedia'}
      >
        {/* Shimmer overlay for visual interest */}
        <div className="absolute inset-0 placeholder-shimmer opacity-40" />

        {/* Decorative scatter dots in background */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-20" preserveAspectRatio="none">
          {Array.from({ length: 18 }).map((_, i) => (
            <circle
              key={i}
              cx={(i * 7 + 5) % 100}
              cy={(i * 11 + 10) % 100}
              r="1"
              fill={isError ? 'var(--brand-orange)' : 'var(--brand-navy)'}
            />
          ))}
        </svg>

        {/* Centered content */}
        <div className="relative text-center px-3 py-2 max-w-[90%]">
          {isError ? (
            <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-[var(--brand-orange)]" strokeWidth={1.5} />
          ) : (
            <ImageOff className="w-6 h-6 mx-auto mb-2 text-[var(--brand-navy)]/60" strokeWidth={1.5} />
          )}
          <div className={cn(
            'inline-block border px-2 py-0.5 text-[9px] font-condensed uppercase tracking-widest mb-2 bg-[var(--brand-surface)]/50',
            isError
              ? 'border-[var(--brand-orange)]/50 text-[var(--brand-orange)]'
              : 'border-[var(--brand-ink)]/40 text-[var(--brand-ink)]/70'
          )}>
            {isError ? 'Foto Gagal Dimuat' : 'Foto Belum Diupload'}
          </div>
          <p className="font-condensed text-xs uppercase tracking-wider text-[var(--brand-ink)] line-clamp-2 font-semibold">
            {alt || 'Image not available'}
          </p>
          {isError && (
            <p className="font-mono text-[8px] text-[var(--brand-ink-muted)] mt-2 truncate max-w-[180px] mx-auto" title={src}>
              {src}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('relative w-full h-full overflow-hidden', wrapperClassName)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={() => setStatus('ok')}
        onError={() => setStatus('fallback-error')}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          status === 'ok' ? 'opacity-100' : 'opacity-0',
          grayscale ? 'grayscale' : '',
          className
        )}
      />
      {status === 'loading' && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#f9d8e5] to-[#fce8f0] animate-pulse" />
      )}
    </div>
  )
}
