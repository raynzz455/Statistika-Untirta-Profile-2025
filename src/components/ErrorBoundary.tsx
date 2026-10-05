'use client'

import { Component, type ReactNode } from 'react'

// ============================================================================
// Error Boundary — catches React render crashes and shows a fallback UI
// instead of a white screen "Application error: a client-side exception
// has occurred".
//
// This is the SAFETY NET for bugs like "e.map is not a function" that
// might slip through despite our defensive Array.isArray() checks.
// Instead of crashing the entire app, the Error Boundary catches the
// error, shows a friendly message + a "Reload" button, and lets the
// rest of the app continue functioning.
// ============================================================================

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string | null }) {
    // Log to console for debugging (visible in DevTools)
    console.error('[ErrorBoundary] caught:', error?.message, errorInfo?.componentStack)
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md text-center border border-[var(--brand-ink)] bg-[var(--brand-surface-2)] p-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-[var(--brand-orange)]/15 text-[var(--brand-orange)] rounded-full mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.007M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="font-serif text-xl font-bold mb-2 text-[var(--brand-ink)]">
              Terjadi Kesalahan
            </h2>
            <p className="text-sm text-[var(--brand-ink-muted)] mb-4">
              Bagian halaman ini gagal dimuat. Coba reload halaman — jika masalah berlanjut,
              hubungi admin.
            </p>
            {this.state.error?.message && (
              <p className="font-mono text-[10px] text-[var(--brand-ink-muted)]/70 bg-[var(--brand-surface)] p-2 border border-[var(--brand-border)] truncate mb-4" title={this.state.error.message}>
                {this.state.error.message.slice(0, 100)}
              </p>
            )}
            <button
              onClick={() => window.location.reload()}
              className="bg-[var(--brand-ink)] text-[var(--brand-surface)] px-4 py-2 font-condensed uppercase tracking-widest text-xs hover:bg-[var(--brand-maroon)] transition-colors"
            >
              Reload Halaman
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
