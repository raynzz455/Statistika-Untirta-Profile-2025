'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ScrollRevealProps {
  children: ReactNode
  className?: string
  delay?: 1 | 2 | 3 | 4 | 5
  as?: 'div' | 'section' | 'article' | 'li' | 'span' | 'button'
  [key: string]: any
}

/**
 * Wraps children in a fade-up scroll-reveal animation driven by IntersectionObserver.
 * Use the `delay` prop to stagger reveals in a list/grid.
 * Supports being rendered as a `button` (pass `onClick`) or other tags via `as`.
 */
export function ScrollReveal({ children, className, delay, as = 'div', ...rest }: ScrollRevealProps) {
  const ref = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Respect reduced-motion: skip animation entirely
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('is-visible')
      return
    }

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.add('is-visible')
            obs.unobserve(el)
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const Tag = as as any
  return (
    <Tag
      ref={ref as any}
      className={cn('reveal', delay && `reveal-delay-${delay}`, className)}
      {...rest}
    >
      {children}
    </Tag>
  )
}
