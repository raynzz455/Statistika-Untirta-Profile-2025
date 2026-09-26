'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number // current page (1-based)
  totalPages: number
  onPageChange: (page: number) => void
  /** total items across all pages */
  total: number
  /** items per page */
  pageSize: number
}

/**
 * Newspaper-style pagination with prev/next + page number pills.
 * Hides itself when totalPages <= 1.
 */
export function Pagination({ page, totalPages, onPageChange, total, pageSize }: PaginationProps) {
  if (totalPages <= 1) return null

  // Build a compact page list: show first, last, current ±1, with ellipses
  const pages: (number | '...')[] = []
  const push = (n: number | '...') => {
    if (pages[pages.length - 1] !== n) pages.push(n)
  }
  push(1)
  if (page - 2 > 1) push('...')
  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) push(i)
  if (page + 2 < totalPages) push('...')
  if (totalPages > 1) push(totalPages)

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="mt-8 flex flex-col items-center gap-3">
      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="w-8 h-8 flex items-center justify-center border border-[var(--brand-ink)] bg-[var(--brand-surface-2)] hover:bg-[var(--brand-orange)]/15 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`e${i}`} className="px-2 text-[var(--brand-ink-muted)] font-condensed">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                'min-w-8 h-8 px-2 flex items-center justify-center border font-condensed text-sm transition-colors',
                p === page
                  ? 'bg-[var(--brand-ink)] text-[var(--brand-surface)] border-[var(--brand-ink)]'
                  : 'bg-[var(--brand-surface-2)] text-[var(--brand-ink)] border-[var(--brand-ink)] hover:bg-[var(--brand-orange)]/15'
              )}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="w-8 h-8 flex items-center justify-center border border-[var(--brand-ink)] bg-[var(--brand-surface-2)] hover:bg-[var(--brand-orange)]/15 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Halaman berikutnya"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <p className="text-[10px] uppercase tracking-widest font-condensed text-[var(--brand-ink-muted)]">
        Menampilkan {from}–{to} dari {total} item
      </p>
    </div>
  )
}
