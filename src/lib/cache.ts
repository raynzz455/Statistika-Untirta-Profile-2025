import { NextResponse } from 'next/server'

// ============================================================================
// API Response Caching Helpers
// ============================================================================
// Add Cache-Control headers to API responses for CDN + browser caching.
// This reduces server load and improves response time for public endpoints.
//
// Caching strategy:
// - s-maxage: how long CDN (Vercel Edge) caches the response
// - stale-while-revalidate: serve stale while fetching fresh in background
// - Public endpoints (students, articles): cache 30-60s, revalidate 300s
// - Rarely-changing endpoints (dosen): cache 300s, revalidate 600s
// - User-specific endpoints (notifications): no caching (private)
// ============================================================================

interface CacheConfig {
  /** CDN cache duration in seconds (s-maxage) */
  maxAge?: number
  /** How long to serve stale while revalidating (seconds) */
  staleWhileRevalidate?: number
  /** Whether this is a public (cacheable) or private (user-specific) response */
  isPublic?: boolean
}

const DEFAULT_CONFIG: Required<CacheConfig> = {
  maxAge: 30,
  staleWhileRevalidate: 300,
  isPublic: true,
}

/**
 * Wrap a NextResponse with Cache-Control headers for CDN + browser caching.
 *
 * @example
 *   // In a GET route handler:
 *   const data = await db.student.findMany(...)
 *   return withCache(NextResponse.json({ students: data }), {
 *     maxAge: 60,        // CDN caches for 60 seconds
 *     staleWhileRevalidate: 300,  // Serve stale up to 5 min while revalidating
 *   })
 */
export function withCache(
  res: NextResponse,
  config: CacheConfig = {}
): NextResponse {
  const { maxAge, staleWhileRevalidate, isPublic } = { ...DEFAULT_CONFIG, ...config }

  const cacheControl = isPublic
    ? `public, s-maxage=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`
    : 'private, no-cache, no-store, must-revalidate'

  res.headers.set('Cache-Control', cacheControl)
  res.headers.set('X-Cache-TTL', String(maxAge))

  return res
}

/**
 * Predefined cache configs for common endpoint patterns.
 */
export const CachePresets = {
  /** Public list endpoints (students, articles, events) — 60s cache, 300s stale */
  publicList: { maxAge: 60, staleWhileRevalidate: 300, isPublic: true },

  /** Rarely-changing data (dosen, stats) — 300s cache, 600s stale */
  publicStatic: { maxAge: 300, staleWhileRevalidate: 600, isPublic: true },

  /** Frequently-updated data (aspirasi, activity) — 15s cache, 60s stale */
  publicDynamic: { maxAge: 15, staleWhileRevalidate: 60, isPublic: true },

  /** User-specific data (notifications, messages) — no caching */
  private: { maxAge: 0, staleWhileRevalidate: 0, isPublic: false },
}

// ============================================================================
// In-memory API cache (for search + expensive queries)
// ============================================================================
// Simple TTL cache for API route handlers. Reduces DB load for repeated
// identical queries within a short time window.
// Works on Vercel serverless (per-instance cache, not shared across
// invocations — but still reduces load within a single warm instance).
// ============================================================================

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

const apiCache = new Map<string, CacheEntry<unknown>>()

/**
 * Get cached data if still valid, otherwise call the fetcher and cache result.
 *
 * @example
 *   const result = await memoize(
 *     `search:${q}:${limit}`,
 *     async () => expensiveDbQuery(q, limit),
 *     10000  // cache for 10 seconds
 *   )
 */
export async function memoize<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = 10000
): Promise<T> {
  const now = Date.now()
  const existing = apiCache.get(key) as CacheEntry<T> | undefined

  if (existing && existing.expiresAt > now) {
    return existing.data
  }

  const data = await fetcher()
  apiCache.set(key, { data, expiresAt: now + ttlMs })

  // Cleanup expired entries (prevent memory leaks)
  if (apiCache.size > 100) {
    for (const [k, v] of apiCache.entries()) {
      if (v.expiresAt <= now) apiCache.delete(k)
    }
  }

  return data
}

/**
 * Clear the in-memory cache (for testing or manual invalidation).
 */
export function clearApiCache(): void {
  apiCache.clear()
}
