'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { ImageOff } from 'lucide-react'

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

/**
 * Image component with graceful fallback to a prominent "Foto Tidak Tersedia"
 * placeholder card when src is missing or fails to load.
 * This eliminates ALL dummy local images from the design — the user wanted
 * either "not found" placeholders OR relevant internet images. We use the
 * former for now since no real photos are uploaded yet.
 */
export function PlaceholderImage({
  alt,
  src,
  className,
  wrapperClassName,
  grayscale = false,
  priority = false,
}: PlaceholderImageProps) {
  const [status, setStatus] = useState<'loading' | 'ok' | 'fallback'>(
    src ? 'loading' : 'fallback'
  )

  // If src changes, reset to loading
  useEffect(() => {
    setStatus(src ? 'loading' : 'fallback')
  }, [src])

  if (status === 'fallback' || !src) {
    return (
      <div
        className={cn(
          'relative w-full h-full bg-gradient-to-br from-[#f9d8e5] via-[#fce8f0] to-[#f0c5d8] flex items-center justify-center overflow-hidden',
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
              fill="var(--brand-navy)"
            />
          ))}
        </svg>

        {/* Centered content */}
        <div className="relative text-center px-3 py-2 max-w-[90%]">
          <ImageOff className="w-6 h-6 mx-auto mb-2 text-[var(--brand-navy)]/60" strokeWidth={1.5} />
          <div className="inline-block border border-[var(--brand-ink)]/40 px-2 py-0.5 text-[9px] font-condensed uppercase tracking-widest text-[var(--brand-ink)]/70 mb-2 bg-[var(--brand-surface)]/50">
            Foto Tidak Tersedia
          </div>
          <p className="font-condensed text-xs uppercase tracking-wider text-[var(--brand-ink)] line-clamp-2 font-semibold">
            {alt || 'Image not available'}
          </p>
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
        onError={() => setStatus('fallback')}
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
