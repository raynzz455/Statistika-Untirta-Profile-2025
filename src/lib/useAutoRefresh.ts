'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// ============================================================================
// useAutoRefresh — Auto-fetching hook with polling
// ============================================================================
// Fetches data from an API endpoint and automatically refreshes it at
// regular intervals. Users get up-to-date data WITHOUT manually refreshing
// the page.
//
// Features:
// - Initial fetch on mount
// - Auto-refresh every `interval` ms (default: 30 seconds)
// - Manual refresh via `refresh()` function
// - Abort previous request if still pending (prevents race conditions)
// - `lastUpdated` timestamp for UI display
// - Pause when tab is hidden (saves bandwidth)
// - Resume when tab is visible again
//
// Usage:
//   const { data, loading, error, lastUpdated, refresh } = useAutoRefresh(
//     '/api/students',
//     { interval: 30000 }  // refresh every 30s
//   )
//
//   // With query params:
//   const { data } = useAutoRefresh(
//     '/api/students?kelas=A&q=ahmad',
//     { interval: 15000 }
//   )
//
//   // Conditional (null URL = no fetch):
//   const { data } = useAutoRefresh(
//     user ? `/api/notifications?userId=${user.id}` : null,
//     { interval: 10000 }
//   )
// ============================================================================

interface AutoRefreshOptions {
  /** Polling interval in milliseconds (default: 30000 = 30s) */
  interval?: number
  /** Enable/disable auto-refresh (default: true) */
  enabled?: boolean
  /** Pause when browser tab is hidden (default: true — saves bandwidth) */
  pauseOnHidden?: boolean
  /** Callback on successful fetch */
  onSuccess?: (data: unknown) => void
  /** Callback on error */
  onError?: (error: Error) => void
}

interface AutoRefreshResult<T> {
  data: T | null
  loading: boolean
  error: Error | null
  lastUpdated: Date | null
  refresh: () => Promise<void>
}

export function useAutoRefresh<T = unknown>(
  url: string | null,
  options: AutoRefreshOptions = {}
): AutoRefreshResult<T> {
  const {
    interval = 30000,
    enabled = true,
    pauseOnHidden = true,
    onSuccess,
    onError,
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isVisible, setIsVisible] = useState(true)

  const abortRef = useRef<AbortController | null>(null)
  const onSuccessRef = useRef(onSuccess)
  const onErrorRef = useRef(onError)

  // Keep refs updated without triggering re-fetch
  useEffect(() => {
    onSuccessRef.current = onSuccess
    onErrorRef.current = onError
  }, [onSuccess, onError])

  // Track tab visibility
  useEffect(() => {
    if (!pauseOnHidden) return
    const onVisibility = () => setIsVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [pauseOnHidden])

  const fetchData = useCallback(async () => {
    if (!url) {
      setLoading(false)
      return
    }

    // Abort previous request if still pending
    if (abortRef.current) {
      abortRef.current.abort()
    }
    abortRef.current = new AbortController()

    try {
      const res = await fetch(url, {
        signal: abortRef.current.signal,
        headers: {
          'Accept': 'application/json',
          // Prevent browser from caching API responses (we handle caching at app level)
          'Cache-Control': 'no-cache',
        },
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${res.status}`)
      }

      const json = await res.json()
      setData(json)
      setLastUpdated(new Date())
      setError(null)
      onSuccessRef.current?.(json)
    } catch (e) {
      // Ignore abort errors (expected when cancelling previous request)
      if (e instanceof DOMException && e.name === 'AbortError') return
      const err = e as Error
      setError(err)
      onErrorRef.current?.(err)
    } finally {
      setLoading(false)
    }
  }, [url])

  // Initial fetch + auto-refresh polling
  useEffect(() => {
    fetchData()

    if (!enabled || !url) return

    // Only poll when tab is visible (saves bandwidth when hidden)
    const shouldPoll = pauseOnHidden ? isVisible : true
    if (!shouldPoll) return

    const timer = setInterval(fetchData, interval)

    return () => {
      clearInterval(timer)
      if (abortRef.current) {
        abortRef.current.abort()
      }
    }
  }, [fetchData, interval, enabled, url, isVisible, pauseOnHidden])

  return { data, loading, error, lastUpdated, refresh: fetchData }
}

// ============================================================================
// useAutoRefreshStats — Display "last updated" + manual refresh button
// ============================================================================
// Helper hook that returns formatted "last updated" text + age in seconds.
// Useful for showing "Updated 12s ago" in the UI.
// ============================================================================

export function useTimeAgo(date: Date | null): { text: string; seconds: number } {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  if (!date) return { text: 'never', seconds: -1 }

  const seconds = Math.floor((now - date.getTime()) / 1000)

  let text: string
  if (seconds < 5) text = 'just now'
  else if (seconds < 60) text = `${seconds}s ago`
  else if (seconds < 3600) text = `${Math.floor(seconds / 60)}m ago`
  else text = `${Math.floor(seconds / 3600)}h ago`

  return { text, seconds }
}
