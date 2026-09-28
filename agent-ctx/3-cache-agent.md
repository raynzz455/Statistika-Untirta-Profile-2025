# Task 3 — Apply caching to public GET API routes

**Agent**: cache-agent
**Task ID**: 3
**Status**: ✅ Completed
**Lint result**: 0 errors, 13 pre-existing warnings (all unrelated to this task)

## Summary

Applied `withCache` (Cache-Control headers) and `memoize` (in-memory TTL cache) to
seven public GET API routes per the task spec. Only GET handlers were modified;
all POST/PUT/DELETE handlers and existing business logic were left untouched.

## Files modified

| Route | Cache strategy | TTL |
|---|---|---|
| `src/app/api/students/route.ts` | `CachePresets.publicList` | 60s + 300s SWR |
| `src/app/api/articles/route.ts` | `CachePresets.publicList` | 60s + 300s SWR |
| `src/app/api/dosen/route.ts` | `CachePresets.publicStatic` | 300s + 600s SWR |
| `src/app/api/aspirasi/route.ts` | `CachePresets.publicDynamic` | 15s + 60s SWR |
| `src/app/api/events/route.ts` | `CachePresets.publicList` | 60s + 300s SWR |
| `src/app/api/gallery/route.ts` | `CachePresets.publicStatic` | 300s + 600s SWR |
| `src/app/api/search/route.ts` | `memoize('search:${q}:${limit}', ..., 10000)` | 10s in-memory |

## Implementation details

### Header-based caching (routes 1–6)
Each GET handler got:
1. `import { withCache, CachePresets } from '@/lib/cache'`
2. Its final `return NextResponse.json(...)` wrapped:
   `return withCache(NextResponse.json(...), CachePresets.XXX)`

`withCache` mutates the response headers in place (sets `Cache-Control` and
`X-Cache-TTL`) and returns the same `NextResponse` instance, so the function
signature stays `Promise<NextResponse>` — no type breakage.

### In-memory memoize (search route)
The search GET handler does a fan-out across 5 content tables in `Promise.all`,
plus a follow-up tag query — a heavy query that benefits from short-TTL
memoization. Wrapped the entire query block in:

```ts
const { students, articles, events, gallery, users } = await memoize(
  `search:${q}:${limit}`,
  async () => { /* Promise.all + tag query + dedup */ ... return { students, articles, events, gallery, users } },
  10000
)
```

Key derivation uses `q` (already lowercased + trimmed earlier in the handler)
and `limit` (already clamped to ≤10). The downstream `.map(...)` rendering
logic operates on these destructured arrays exactly as before, so the response
shape is unchanged.

### Things deliberately left alone
- POST/PUT/DELETE handlers in all touched files — no caching on writes.
- The `extractSnippet` helper and `shouldInclude` type filter in search route.
- All query param parsing and validation.
- Session checks (the only GET that touches session is `articles` when
  `includeDrafts=1`; that branch was untouched — only the `NextResponse.json`
  return is wrapped).

## Verification
- `bun run lint` → **0 errors**, 13 warnings (all pre-existing in unrelated
  files: `src/app/page.tsx`, `src/components/*`).
- No `dev.log` present at time of writing.

## Hand-off notes for downstream agents
- The cache helper lives at `src/lib/cache.ts` and exports `withCache`,
  `CachePresets`, `memoize`, `clearApiCache`. Future GET handlers that need
  caching should follow the same pattern.
- For routes that mutate data on POST (e.g. creating a student), you may want
  to call `clearApiCache()` if you later add memoize-based caching to a related
  list endpoint — not needed for the current header-based approach since
  `s-maxage` values are short (15–300s).
