# PERFORMANCE.md — Optimization Strategy

Performance and real-time data delivery strategy for Statistika '25.

---

## 1. Real-Time Updates (No Page Refresh)

### Architecture

```
┌────────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Browser (client)  │────▶│  Vercel (API)    │────▶│  Supabase (DB)   │
│                    │     │  (serverless)    │     │  (PostgreSQL)    │
│  useAutoRefresh    │     │  Cache-Control   │     │  Prisma ORM      │
│  (polling 30s)     │     │  + memoize cache │     │                 │
│                    │◀────│  Response        │◀────│                 │
│  useRealtimeNotif  │     │                  │     │  Realtime        │
│  (WebSocket)       │─────┼──────────────────┼────▶│  (WebSocket)     │
│                    │     │  (bypass API)    │     │                 │
│  Auto-update UI    │     │                  │     │  pg_notify()     │
└────────────────────┘     └──────────────────┘     └─────────────────┘
```

### 3 Layers of Data Freshness

| Layer | Method | Latency | Bandwidth | Use case |
|-------|--------|---------|------------|----------|
| 1. **WebSocket (real-time)** | Supabase Realtime | ~100ms | Minimal (only changes) | Notifications, live chat |
| 2. **Polling (near real-time)** | `useAutoRefresh` hook | 15-60s | Medium (full response) | Articles, students, events |
| 3. **CDN cache (stale-while-revalidate)** | `withCache` + Vercel Edge | 0ms (cached) | Minimal (304 Not Modified) | Static-ish public data |

### Usage

```tsx
// Polling (auto-refresh every 30s):
import { useAutoRefresh, useTimeAgo } from '@/lib/useAutoRefresh'

const { data, loading, lastUpdated, refresh } = useAutoRefresh(
  '/api/students?kelas=A',
  { interval: 30000 }
)
const { text: timeAgoText } = useTimeAgo(lastUpdated)

return (
  <div>
    <p>Last updated: {timeAgoText}</p>
    <button onClick={refresh}>Refresh now</button>
    {/* data renders here, auto-updates every 30s */}
  </div>
)

// Real-time notifications (WebSocket):
import { useRealtimeNotifications } from '@/lib/useRealtimeNotifications'

const { notifications, unreadCount, markAllAsRead, connected } = useRealtimeNotifications(
  user?.id
)

return (
  <div>
    <p>WebSocket: {connected ? 'connected' : 'polling'}</p>
    <p>Unread: {unreadCount}</p>
    <button onClick={markAllAsRead}>Mark all read</button>
    {notifications.map(n => <NotificationCard key={n.id} {...n} />)}
  </div>
)
```

---

## 2. API Caching

### Cache-Control Headers (Vercel CDN)

| Endpoint | Preset | s-maxage | SWR | Why |
|----------|--------|----------|-----|-----|
| `/api/students` | publicList | 60s | 300s | Changes occasionally (new claims) |
| `/api/articles` | publicList | 60s | 300s | New articles published occasionally |
| `/api/events` | publicList | 60s | 300s | Events added/updated weekly |
| `/api/dosen` | publicStatic | 300s | 600s | Rarely changes (3 dosen) |
| `/api/gallery` | publicStatic | 300s | 600s | New photos added occasionally |
| `/api/aspirasi` | publicDynamic | 15s | 60s | New submissions frequent |
| `/api/search` | memoize 10s | - | - | In-memory cache per instance |
| `/api/notifications` | private | 0 | 0 | User-specific, no caching |
| `/api/notifications/[id]/read` | private | 0 | 0 | Mutation, no caching |

### How Vercel Edge Cache Works

```
Request 1 (cold):
  Browser → Vercel Edge → Serverless → DB → Response (slow, 200ms)
                                          ↓
                                    Cache at Edge (60s TTL)

Request 2 (warm, within 60s):
  Browser → Vercel Edge → Cache HIT (0ms, instant!)

Request 3 (after 60s, within SWR window):
  Browser → Vercel Edge → Cache STALE → Serve old + fetch new in background
                                                  ↓
                                            Update cache (transparent to user)

Request 4 (after SWR expires):
  Browser → Vercel Edge → Cache MISS → Serverless → DB → Response (slow)
```

---

## 3. Search Optimization

### Before (unoptimized):
- Every keystroke → fetch → DB query (5 tables scanned)
- No caching → same query repeated = full DB scan again
- Returns full records (all fields)

### After (optimized):
- Client-side debouncing (200ms delay, already existed)
- Server-side in-memory cache (`memoize` with 10s TTL)
- Same query within 10s = instant (no DB hit)
- Field selection via Prisma `select` (only needed fields)

### Performance comparison:

| Scenario | Before | After |
|----------|--------|-------|
| Same search query within 10s | 200ms (DB hit) | 0ms (cache hit) |
| Different query | 200ms | 200ms (no cache) |
| Empty query | 50ms | 50ms |

---

## 4. Traffic Handling

### Vercel Serverless Auto-Scaling

| Traffic Level | Vercel Behavior |
|---------------|-----------------|
| Low (1-10 req/s) | 1 warm instance, instant response |
| Medium (10-100 req/s) | Auto-scale to 2-5 instances |
| High (100-1000 req/s) | Auto-scale to 10+ instances |
| Spike (1000+ req/s) | Cold start new instances (~2s delay for first request) |

### CDN Caching Reduces Server Load

With CDN caching:
- 60-80% of requests served from Edge cache (no serverless invocation)
- Only cache misses trigger serverless + DB queries
- Effectively: 1000 req/s → 200-400 actual DB queries (rest cached)

### Rate Limiting

| Endpoint | Rate Limit | Mechanism |
|----------|-----------|-----------|
| `/api/aspirasi` (POST) | 3 per 10 min per IP+name | In-memory (local dev) |
| `/api/auth/login` | TODO: 5 per 15 min per IP | Upstash Redis (production) |
| All other endpoints | None (Vercel handles auto-scaling) | - |

---

## 5. Data Transfer Speed

### Response Compression

| Type | Handled by | Compression |
|------|-----------|-------------|
| JSON API responses | Vercel Edge | Brotli (automatic) |
| Static assets (JS, CSS) | Vercel Edge | Brotli (automatic) |
| Images | Vercel Image Optimization | WebP/AVIF (automatic) |

### Field Selection (Prisma `select`)

Only fetch needed fields, not entire rows:

```ts
// Bad: fetch ALL fields (slow, large payload)
const students = await db.student.findMany()

// Good: only fetch what UI needs (fast, small payload)
const students = await db.student.findMany({
  select: { id: true, name: true, nickname: true, nim: true, kelas: true, imageUrl: true }
})
```

---

## 6. Performance Checklist

### Implemented
- [x] `useAutoRefresh` hook — client-side polling with auto-pause on hidden tab
- [x] `useTimeAgo` hook — "Updated 12s ago" display
- [x] `withCache` helper — Cache-Control headers on 7 public API routes
- [x] `memoize` function — in-memory cache for search (10s TTL)
- [x] `useRealtimeNotifications` hook — Supabase Realtime WebSocket
- [x] Polling fallback when Supabase not configured
- [x] Abort previous request on new fetch (prevent race conditions)
- [x] Prisma `select` field optimization in search

### TODO (Future Enhancements)
- [ ] React Query / SWR migration (replace manual `fetch()` in all components)
- [ ] Supabase Realtime for articles/students (not just notifications)
- [ ] Upstash Redis for distributed rate limiting + caching
- [ ] Vercel Edge Functions for ultra-low-latency API routes
- [ ] Image lazy-loading with Intersection Observer
- [ ] Infinite scroll for directories (reduce initial payload)
- [ ] WebSocket mini-service for real-time chat
- [ ] GraphQL API for client-specified field selection

---

## 7. Monitoring

### Vercel Analytics
- Core Web Vitals (LCP, FID, CLS)
- Function execution time
- Edge cache hit rate

### Supabase Dashboard
- Database query performance
- Connection pool usage
- Realtime connection count

### Application-Level
- `useTimeAgo` shows "last updated" in UI
- `connected` flag shows WebSocket vs polling status
- Console errors for cache misses / timeouts
