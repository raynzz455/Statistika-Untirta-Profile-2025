# Statistika '25 Untirta Profile — Work Log

## Task 3 — Apply caching to public GET API routes
**Agent**: cache-agent
**Status**: ✅ Completed (lint: 0 errors)

Applied `withCache` + `CachePresets` (header-based CDN caching) and `memoize`
(in-memory TTL cache) to seven public GET API routes. Only GET handlers were
modified; all POST/PUT/DELETE handlers and existing business logic were left
untouched.

### Files modified
| Route | Cache strategy | TTL |
|---|---|---|
| `src/app/api/students/route.ts` | `CachePresets.publicList` | 60s + 300s SWR |
| `src/app/api/articles/route.ts` | `CachePresets.publicList` | 60s + 300s SWR |
| `src/app/api/dosen/route.ts` | `CachePresets.publicStatic` | 300s + 600s SWR |
| `src/app/api/aspirasi/route.ts` | `CachePresets.publicDynamic` | 15s + 60s SWR |
| `src/app/api/events/route.ts` | `CachePresets.publicList` | 60s + 300s SWR |
| `src/app/api/gallery/route.ts` | `CachePresets.publicStatic` | 300s + 600s SWR |
| `src/app/api/search/route.ts` | `memoize('search:${q}:${limit}', ..., 10000)` | 10s in-memory |

### Implementation
- **Header caching (routes 1–6)**: added `import { withCache, CachePresets } from '@/lib/cache'` and wrapped the final `return NextResponse.json(...)` in `withCache(..., CachePresets.XXX)`. `withCache` mutates response headers in place and returns the same `NextResponse`, so no type changes.
- **Search memoize**: wrapped the entire `Promise.all` + tag-query + dedup block inside `await memoize('search:${q}:${limit}', async () => {...; return { students, articles, events, gallery, users } }, 10000)`, then destructured the result. The downstream `.map()` rendering logic is unchanged, so the response shape is identical.

### Verification
- `bun run lint` → 0 errors, 13 warnings (all pre-existing in unrelated files).
- No `dev.log` present at time of writing.

Full per-file details in `agent-ctx/3-cache-agent.md`.
