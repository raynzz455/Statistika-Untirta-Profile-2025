'use client'

import { useEffect, useState, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface LightboxItem {
  id: string
  src: string
  alt: string
  caption?: string
  category?: string
}

interface LightboxProps {
  items: LightboxItem[]
  /** index of currently open item, or null if closed */
  index: number | null
  onClose: () => void
  onNavigate: (index: number) => void
}

/**
 * Full-screen image lightbox with keyboard navigation, zoom, download, and prev/next.
 * Renders nothing when index is null.
 */
export function Lightbox({ items, index, onClose, onNavigate }: LightboxProps) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const isOpen = index !== null && index >= 0 && index < items.length
  const current = isOpen ? items[index] : null

  const resetView = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  // Reset zoom/pan when navigating
  useEffect(() => {
    if (isOpen) resetView()
  }, [index, isOpen, resetView])

  const goNext = useCallback(() => {
    if (!isOpen) return
    onNavigate((index! + 1) % items.length)
  }, [isOpen, index, items.length, onNavigate])

  const goPrev = useCallback(() => {
    if (!isOpen) return
    onNavigate((index! - 1 + items.length) % items.length)
  }, [isOpen, index, items.length, onNavigate])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(z + 0.25, 4))
      else if (e.key === '-') setZoom((z) => Math.max(z - 0.25, 0.5))
      else if (e.key === '0') resetView()
    }
    window.addEventListener('keydown', onKey)
    // Lock body scroll
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [isOpen, goNext, goPrev, onClose, resetView])

  if (!isOpen || !current) return null

  const onMouseDown = (e: React.MouseEvent) => {
    if (zoom === 1) return
    setDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }
  const onMouseUp = () => setDragging(false)

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent text-white">
        <div className="min-w-0 flex-1">
          <p className="font-condensed text-xs uppercase tracking-widest text-white/60 truncate">
            {current.category || 'Galeri'} • {index! + 1} / {items.length}
          </p>
          {current.caption && (
            <p className="font-serif italic text-sm truncate mt-0.5">{current.caption}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.25, 4))}
            className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded transition-colors"
            title="Perbesar (+)"
            aria-label="Perbesar"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
            className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded transition-colors"
            title="Perkecil (-)"
            aria-label="Perkecil"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={resetView}
            className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded transition-colors"
            title="Reset (0)"
            aria-label="Reset zoom"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <a
            href={current.src}
            download
            className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded transition-colors"
            title="Download"
            aria-label="Download gambar"
          >
            <Download className="w-4 h-4" />
          </a>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center hover:bg-[var(--brand-maroon)] rounded transition-colors ml-1"
            title="Tutup (Esc)"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Prev button */}
      {items.length > 1 && (
        <button
          onClick={goPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center bg-black/40 hover:bg-[var(--brand-orange)] hover:text-[var(--brand-ink)] rounded-full transition-colors text-white"
          aria-label="Sebelumnya"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Image */}
      <div
        className={cn(
          'flex-1 flex items-center justify-center w-full overflow-hidden',
          zoom > 1 && (dragging ? 'cursor-grabbing' : 'cursor-grab')
        )}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.src}
          alt={current.alt}
          className="max-w-[90vw] max-h-[80vh] object-contain transition-transform duration-150"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transitionDuration: dragging ? '0ms' : '150ms',
          }}
          draggable={false}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Next button */}
      {items.length > 1 && (
        <button
          onClick={goNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center bg-black/40 hover:bg-[var(--brand-orange)] hover:text-[var(--brand-ink)] rounded-full transition-colors text-white"
          aria-label="Berikutnya"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Bottom thumbnails strip */}
      {items.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent pt-8 pb-3">
          <div className="flex gap-2 overflow-x-auto custom-scroll justify-center max-w-[90vw] mx-auto px-4 py-2">
            {items.map((item, i) => (
              <button
                key={item.id}
                onClick={() => onNavigate(i)}
                className={cn(
                  'flex-shrink-0 w-16 h-16 border-2 overflow-hidden transition-all',
                  i === index
                    ? 'border-[var(--brand-orange)] scale-110'
                    : 'border-white/20 opacity-50 hover:opacity-100'
                )}
                aria-label={`Lihat gambar ${i + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.src} alt={item.alt} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Zoom indicator */}
      <div className="absolute top-16 left-4 z-10 bg-black/60 text-white/80 text-[10px] uppercase tracking-widest font-condensed px-2 py-1 rounded">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  )
}
