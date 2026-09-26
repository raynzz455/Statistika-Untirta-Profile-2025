'use client'

import { useEffect, useState } from 'react'
import { markIntroSeen, shouldShowIntro, useAppStore } from '@/lib/store'

/**
 * Opening animation shown once every 3 hours per browser session.
 * Renders a scatter-plot reveal with axes, regression line, dots and brand text.
 */
export function OpeningAnimation() {
  const introSeen = useAppStore((s) => s.introSeen)
  const setIntroSeen = useAppStore((s) => s.setIntroSeen)
  const [mounted, setMounted] = useState(false)
  const [phase, setPhase] = useState<'show' | 'fade'>('show')

  useEffect(() => {
    setMounted(true)
    // If already seen within the 3-hour window, skip entirely
    if (introSeen || !shouldShowIntro()) {
      setIntroSeen(true)
      return
    }

    // Sequence timing (ms):
    // 0       -> axes draw (0.3s start, 0.8s duration -> done ~1.1s)
    // ~1.1s   -> dots begin fading (staggered, total ~0.6s)
    // ~1.4s   -> regression line draws (1.2s duration -> done ~2.6s)
    // ~2.6s   -> brand text + tagline fade in
    // ~4.0s   -> start fade out (0.6s)
    // ~4.6s   -> mark seen & unmount
    const fadeTimer = setTimeout(() => setPhase('fade'), 4000)
    const doneTimer = setTimeout(() => {
      markIntroSeen()
      setIntroSeen(true)
    }, 4600)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(doneTimer)
    }
  }, [introSeen, setIntroSeen])

  // On server or before mount, render nothing to avoid hydration mismatch
  if (!mounted || introSeen) return null

  // Pre-computed scatter points so they don't reshuffle on re-renders
  const points = Array.from({ length: 40 }).map((_, i) => {
    const x = 8 + (i * 2.1) + Math.sin(i * 1.3) * 3
    const y = 92 - (i * 2.1) + Math.cos(i * 0.9) * 4
    return {
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(5, Math.min(95, y)),
      delay: 1.1 + (i / 40) * 0.6 + Math.sin(i * 2.1) * 0.05,
    }
  })

  return (
    <div
      className={`intro-overlay fixed inset-0 z-[100] bg-[var(--brand-surface)] flex flex-col items-center justify-center transition-opacity duration-700 ${
        phase === 'fade' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-hidden={phase === 'fade'}
    >
      {/* Decorative top-left brand corner */}
      <div className="absolute top-6 left-6 md:top-10 md:left-10 font-condensed text-[10px] uppercase tracking-[0.3em] text-[var(--brand-ink)]/60">
        Universitas Sultan Ageng Tirtayasa
      </div>
      <div className="absolute top-6 right-6 md:top-10 md:right-10 font-condensed text-[10px] uppercase tracking-[0.3em] text-[var(--brand-ink)]/60">
        Est. 2023 • Cilegon
      </div>

      {/* Scatter plot */}
      <div className="w-72 h-72 md:w-[28rem] md:h-[28rem] relative">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full overflow-visible"
          aria-label="Scatter plot dengan garis regresi"
        >
          {/* Grid lines */}
          {[20, 40, 60, 80].map((g) => (
            <line
              key={`gh-${g}`}
              x1="5"
              y1={g}
              x2="95"
              y2={g}
              stroke="#1a1a1a"
              strokeWidth="0.2"
              className="opacity-20 axes-line"
              style={{ animationDelay: '0s' }}
            />
          ))}
          {[20, 40, 60, 80].map((g) => (
            <line
              key={`gv-${g}`}
              x1={g}
              y1="5"
              x2={g}
              y2="95"
              stroke="#1a1a1a"
              strokeWidth="0.2"
              className="opacity-20 axes-line"
              style={{ animationDelay: '0s' }}
            />
          ))}

          {/* Axes */}
          <line
            x1="5"
            y1="95"
            x2="95"
            y2="95"
            stroke="#1a1a1a"
            strokeWidth="0.6"
            className="axes-line"
          />
          <line
            x1="5"
            y1="95"
            x2="5"
            y2="5"
            stroke="#1a1a1a"
            strokeWidth="0.6"
            className="axes-line"
          />

          {/* Y axis label */}
          <text
            x="3"
            y="50"
            textAnchor="middle"
            transform="rotate(-90 3 50)"
            fontSize="2"
            className="scatter-text"
            fill="#1a1a1a"
            style={{ animationDelay: '2.5s' }}
          >
            VARIABEL Y
          </text>
          {/* X axis label */}
          <text
            x="50"
            y="99"
            textAnchor="middle"
            fontSize="2"
            className="scatter-text"
            fill="#1a1a1a"
            style={{ animationDelay: '2.5s' }}
          >
            VARIABEL X
          </text>

          {/* Scatter dots */}
          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r="1.1"
              fill="var(--brand-orange)"
              className="scatter-dot"
              style={{ animationDelay: `${p.delay}s` }}
            />
          ))}

          {/* Regression Line */}
          <line
            x1="10"
            y1="90"
            x2="90"
            y2="10"
            stroke="#1a1a1a"
            strokeWidth="0.8"
            strokeDasharray="120"
            strokeDashoffset="120"
            className="regression-line"
          />

          {/* Mean point */}
          <circle
            cx="50"
            cy="50"
            r="2.5"
            fill="#1a1a1a"
            className="scatter-dot"
            style={{ animationDelay: '2.4s' }}
          />
          <text
            x="53"
            y="48"
            fontSize="2"
            className="scatter-text"
            fill="#1a1a1a"
            style={{ animationDelay: '2.7s' }}
          >
            ȳ
          </text>
        </svg>
      </div>

      {/* Brand text */}
      <div className="mt-10 text-center px-6">
        <p className="font-condensed text-[10px] md:text-xs uppercase tracking-[0.4em] text-[var(--brand-ink-muted)] mb-3 scatter-text">
          Program Studi
        </p>
        <h1 className="font-condensed text-4xl md:text-6xl uppercase tracking-[0.15em] font-bold text-[var(--brand-ink)] scatter-text">
          Statistika <span className="text-[var(--brand-orange)]">'25</span>
        </h1>
        <p className="font-serif italic text-sm md:text-lg text-[var(--brand-ink-muted)] mt-3 scatter-tagline">
          Data • Analisis • Probabilitas
        </p>
      </div>

      {/* Skip button */}
      <button
        onClick={() => {
          setPhase('fade')
          setTimeout(() => {
            markIntroSeen()
            setIntroSeen(true)
          }, 500)
        }}
        className="absolute bottom-8 right-8 md:bottom-10 md:right-10 font-condensed text-[10px] uppercase tracking-[0.3em] text-[var(--brand-ink)]/50 hover:text-[var(--brand-ink)] border border-[var(--brand-ink)]/30 hover:border-[var(--brand-ink)] px-4 py-1.5 transition-colors"
      >
        Lewati Intro →
      </button>

      {/* Progress indicator */}
      <div className="absolute bottom-8 left-8 md:bottom-10 md:left-10 w-16 h-px bg-[var(--brand-ink)]/20 overflow-hidden">
        <div
          className="h-full bg-[var(--brand-orange)]"
          style={{
            animation: 'progress-fill 4.6s linear forwards',
          }}
        />
      </div>

      <style>{`@keyframes progress-fill { from { width: 0% } to { width: 100% } }`}</style>
    </div>
  )
}
