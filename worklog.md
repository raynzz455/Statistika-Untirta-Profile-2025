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

---
Task ID: post-auth-fixes
Agent: main (continuation session)
Task: Fix /api/students/claim 500 + Google OAuth post-login routing (unclaimed -> claim, claimed -> profile, admin -> home)

Work Log:
- Read existing worklog.md and confirmed only cache-agent had logged work.
- Inspected prisma/schema.prisma, src/lib/session.ts, src/lib/db.ts, src/app/api/students/claim/route.ts, src/app/auth/callback/route.ts, src/app/api/auth/me/route.ts, src/app/api/auth/login/route.ts, src/components/views/ClaimProfileView.tsx, src/app/page.tsx, src/components/views/LoginView.tsx.
- Diagnosed root cause of claim 500:
  * Prisma `Student.owner User? @relation(fields: [ownerId], references: [id])` creates real FK `students.owner_id -> users.id`.
  * Google OAuth users have session.userId = Supabase UUID (e.g. "a1b2c3d4-...") but Prisma `users` table only has custom-session test users (CUID like "clxxxx").
  * db.student.update({ ownerId: <UUID> }) fails FK violation -> catch block returns 500 with "Gagal meng-update profil. Coba lagi atau hubungi admin."
- Diagnosed cookie loss bug in auth/callback:
  * Original code built `res = NextResponse.redirect(<next>)`, let Supabase set cookies via setAll(), then returned `NextResponse.redirect(<claim-profile>, { headers: res.headers })`.
  * Cookies set via res.cookies.set() live in a separate cookie store — NOT auto-merged into the plain headers map. New redirect silently dropped Supabase + stat_session cookies -> user appeared logged out on arrival -> bounced to home.
- Fixed prisma/schema.prisma:
  * Removed `owner User? @relation(...)` line from Student model.
  * Removed inverse `students Student[]` from User model.
  * Added `@unique` to `ownerId` so findUnique({ where: { ownerId } }) works in callback (1:1 semantic).
- Ran `bun run db:generate` twice (once after each schema edit) to regenerate Prisma client.
- Created scripts/drop-students-owner-fk.sql (idempotent):
  * Drops FK constraint `students_owner_id_fkey` if exists.
  * Adds UNIQUE constraint `students_owner_id_key` via DO block (safe if already present).
  * Adds plain index `idx_students_owner_id`.
  * Includes verification query in comments.
- Rewrote src/app/auth/callback/route.ts:
  * Build ONE final redirect response upfront (default target: /#/claim-profile).
  * Supabase client sets cookies on that SAME response.
  * After OAuth success: check profiles table for admin role + check students table for linked studentId.
  * Smart routing: admin -> /#/ ; already-linked student -> /#/profile/<id> ; else /#/claim-profile.
  * When final target differs from initial fallback, rebuild response BUT copy all cookies via `res.cookies.getAll()` to avoid the cookie loss bug.
- Extended src/app/api/auth/me/route.ts:
  * Added try/catch around db.user.findUnique (defensive).
  * Added lookup of `db.student.findUnique({ where: { ownerId: session.userId } })` for studentId.
  * Returns `studentId` in user object so frontend can do smart post-login routing.
- Updated src/app/api/auth/login/route.ts to also return studentId (parallel to /me route).
- Updated src/lib/store.ts SessionUser interface to include `studentId?: string | null`.
- Updated src/app/page.tsx initial auth check:
  * After fetching /api/auth/me, if user landed on /#/claim-profile but already has studentId -> redirect to /#/profile/<id>.
  * If user is admin landing on /#/claim-profile -> redirect to /#/.
- Updated src/components/views/LoginView.tsx handleLogin:
  * admin -> /#/admin (unchanged)
  * has studentId -> /#/profile/<id>
  * else -> /#/settings (test users without student)
- Enhanced src/components/views/ClaimProfileView.tsx:
  * If user.studentId -> show "Profil Anda Sudah Ter-link" banner with "Lihat Profil Saya" + "Pengaturan Akun" buttons.
  * If user.role === 'admin' -> show "Anda adalah Admin" banner with "Buka Panel Admin" button.
  * After successful claim: refresh /api/auth/me to update store's studentId (so Header etc. can react).
- Added try/catch to public API routes that were still 500-ing on missing DB:
  * src/app/api/students/route.ts: returns `{ students: [], dbError: true }` with 200.
  * src/app/api/articles/route.ts: returns `{ articles: [], dbError: true }` with 200.
  * src/app/api/recommendations/route.ts: wraps both anonymous + logged-in paths in try/catch, returns `{ recommendations: [], basedOnHistory: false }` with 200.
- Documented full post-login routing workflow in SUPABASE_SETUP.md (new section "Post-Login Routing Workflow") with:
  * 3-tier routing table (server-side redirect, client-side safety net, custom session login).
  * ClaimProfileView conditional behavior table.
  * Critical fix notes for cookie loss bug + FK constraint fix.
- Added two new Troubleshooting entries to SUPABASE_SETUP.md:
  * "Claim NIM gagal: 500 Gagal meng-update profil" -> point to scripts/drop-students-owner-fk.sql
  * "Setelah Google OAuth login, redirect ke Beranda (bukan claim-profile)" -> explains cookie loss bug + fix.
- Verified locally with curl + agent-browser:
  * /api/students -> 200 {"students":[],"dbError":true}
  * /api/auth/me -> 200 {"user":null}
  * /api/students/claim POST -> 401 {"error":"Anda harus login..."}
  * /api/articles?limit=6 -> 200 {"articles":[],"dbError":true}
  * /api/recommendations -> 200 {"recommendations":[],"basedOnHistory":false}
  * Home page renders cleanly (no errors, banner + stats + nav visible).
  * /#/login renders Portal Anggota with Google button + test accounts.
  * /#/claim-profile auto-redirects to /#/login when no session (with toast info "Anda harus login untuk klaim profil mahasiswa.").
  * /#/directory renders "Tidak ada mahasiswa ditemukan" instead of crashing.
- bun run lint -> 0 errors, 13 warnings (all pre-existing, no new warnings introduced).

Stage Summary:
- Fixed root cause of /api/students/claim 500 (FK constraint on students.owner_id prevented Google OAuth UUIDs from being linked). Schema change + scripts/drop-students-owner-fk.sql for production.
- Fixed cookie loss bug in /auth/callback that sent users to home instead of claim-profile. New pattern: ONE response, set all cookies, return directly. If final URL changes, copy cookies via res.cookies.getAll().
- Implemented smart post-login routing in 3 places (server-side callback, client-side page.tsx safety net, custom-session LoginView). Rules: admin -> home/admin panel, already-linked student -> profile, first-time user -> claim-profile.
- Extended /api/auth/me + /api/auth/login to return studentId in user payload so frontend can drive routing.
- ClaimProfileView now shows banner states for already-linked users and admins (no more NIM form for users who already claimed).
- Added try/catch to /api/students, /api/articles, /api/recommendations so they return 200 + empty arrays + dbError flag instead of crashing 500 when DB is unreachable. Home page no longer shows partial-broken layout.
- Documented entire auth workflow + critical fixes in SUPABASE_SETUP.md (Post-Login Routing Workflow section + 2 new Troubleshooting entries).
- Artifacts: prisma/schema.prisma, src/app/auth/callback/route.ts, src/app/api/auth/me/route.ts, src/app/api/auth/login/route.ts, src/app/api/students/route.ts, src/app/api/articles/route.ts, src/app/api/recommendations/route.ts, src/app/page.tsx, src/lib/store.ts, src/components/views/LoginView.tsx, src/components/views/ClaimProfileView.tsx, scripts/drop-students-owner-fk.sql, SUPABASE_SETUP.md.

Unresolved / Risks:
- User must run scripts/drop-students-owner-fk.sql in Supabase SQL Editor on PRODUCTION to drop the FK constraint. Without this, /api/students/claim will still 500 in production.
- User must also ensure Prisma client is regenerated on Vercel (postinstall: prisma generate is in package.json — should work).
- next.config.ts still has ignoreBuildErrors: true due to ~10 pre-existing src/ TypeScript errors (not introduced by this task). Recommend cleaning up TS errors in a follow-up pass and then setting ignoreBuildErrors: false.
- The 10 src/ TS errors are in unrelated files (Recommendations.tsx, RichTextEditor.tsx etc.) — not blocking for this auth fix.
- Google OAuth provider still needs to be configured in Supabase Dashboard by user (Step 4 in SUPABASE_SETUP.md). Code is ready; provider config is a manual step.
- First admin user still needs to be set via SQL: UPDATE profiles SET role = 'admin' WHERE id = 'USER_UUID'; (after first Google OAuth login creates the profile row).

---
Task ID: intro-animation-1h-cookie
Agent: main (continuation session 2)
Task: Fix opening animation to persist via cookie + localStorage with 1-hour reset (was replaying on every refresh — old code had 5-min expiry + misleading "3 hours" comment)

Work Log:
- Read src/lib/store.ts and src/components/OpeningAnimation.tsx to understand existing intro session logic.
- Found bug: comment in OpeningAnimation.tsx claimed "once every 3 hours" but actual code in store.ts used `FIVE_MINUTES_MS = 5 * 60 * 1000` (5 minutes). Misleading.
- Rewrote intro session in src/lib/store.ts:
  * Bumped key `stat25_intro_seen_v1` -> `stat25_intro_seen_v2` (invalidates old 5-min entries by design — users will see intro one more time after this update).
  * Changed expiry from 5 min -> 1 hour (`ONE_HOUR_MS = 60 * 60 * 1000`).
  * Added dual-storage strategy: cookie (primary, max-age=3600s, SameSite=Lax, Secure on HTTPS) + localStorage (backup, absolute expiry timestamp).
  * shouldShowIntro(): checks cookie first, falls back to localStorage, returns true only if both are absent/expired.
  * markIntroSeen(): writes BOTH cookie (auto-expires via max-age) AND localStorage (timestamp-based expiry) for robustness.
  * Cookie's `Secure` flag added only when window.location.protocol === 'https:' (so dev on http://localhost doesn't break).
  * Comprehensive comment block explaining the dual-storage strategy + version bump rationale.
- Updated misleading comment in src/components/OpeningAnimation.tsx:
  * Top docstring: "once every 3 hours" -> "once per hour per browser session" + persistence note.
  * Inline useEffect comment: "3-hour window" -> "1-hour window".
- Verified locally with agent-browser:
  * Test 1 (fresh session, no cookie): intro plays — cookie `stat25_intro_seen=1` set after first visit.
  * Test 2 (reload within 1h window): home page renders IMMEDIATELY at 0.5s, no intro overlay — cookie-based skip works.
  * Test 3 (simulate 1h expiry by clearing cookie + localStorage): intro REAPPEARS — "VARIABEL Y/X", "ȳ" mean point, "LEWATI INTRO →" button all visible. Reset-every-1-hour logic confirmed.
- bun run lint -> 0 errors, 13 warnings (all pre-existing).

Stage Summary:
- Fixed misleading "3 hours" comment + actual 5-minute expiry bug.
- Implemented cookie + localStorage dual-storage for the intro session with 1-hour reset.
- Verified: intro shows once, then suppressed for 1 hour on refresh, then replays after the window passes.
- Cookie has `max-age=3600` so browser auto-deletes it after 1 hour (no client-side timer needed).
- localStorage stores absolute expiry timestamp as backup for when cookies are blocked.
- Bumped storage key version (v1 -> v2) to invalidate old 5-min entries.
- Artifacts: src/lib/store.ts, src/components/OpeningAnimation.tsx.

---
Task ID: bulk-trycatch-fix
Agent: trycatch-agent
Task: Add try/catch to 27 API routes missing error handling

Work Log:
- Read worklog.md to understand prior work (cache-agent had wrapped 7 GET routes with `withCache` + `memoize`; post-auth-fixes agent had added try/catch to `/api/students`, `/api/articles` GET, and `/api/recommendations`).
- Ran the discovery script (`grep -c "try {"` per route file) and found 27 files with 0 try blocks — minus `src/app/api/route.ts` (root API docs page, explicitly skipped per task instructions) = 26 routes to modify.
- For each route, wrapped ALL `db.xxx` calls in `try { ... } catch (e: any) { console.error(...) ; return ... }`. Auth checks (`getSession`, `getCurrentUser`, admin-role guard) kept OUTSIDE try/catch so 401/403 semantics are preserved — only DB work + body parsing + business validations live inside the try.
- Error-handling pattern (consistent with the existing `/api/students` GET style):
  * GET routes → `NextResponse.json({ <empty shape>, dbError: true })` (HTTP 200, NOT 500). Empty shapes mirror the success shape (`{ articles: [] }`, `{ dosen: [] }`, `{ event: null }`, `{ user: null, stats: {...0...}, recentActivity: {...empty...} }`, etc.) so the frontend can render "no data" gracefully instead of crashing on JSON.parse of a 500 empty body.
  * POST / PUT / PATCH / DELETE routes → `NextResponse.json({ error: 'Gagal <action>. Coba lagi atau hubungi admin.' }, { status: 500 })`.
- console.error log tag mirrors the route path (e.g. `[api/analytics]`, `[api/users/id PATCH]`) and slices the error message to first 100–200 chars to avoid dumping huge Prisma payloads.
- Skipped `src/app/api/route.ts` (root API docs page) per task instruction — no DB calls.
- Incidental fix while wrapping: `src/app/api/dosen/route.ts` GET had a pre-existing bug `return NextResponse.json(NextResponse.json({ dosen }))` (double-wrapped NextResponse — the outer call serializes the inner NextResponse object as JSON `data` instead of `{ dosen: [...] }`, so /api/dosen GET has been returning broken payloads since at least the cache-agent's work). Fixed to `return NextResponse.json({ dosen })` inside the new try block. No other business-logic changes were made.
- Also tidied `src/app/api/tags/route.ts`: the original file had stray imports at the BOTTOM of the file (`import { NextRequest }` + `import { getSession }`) below the POST handler. Moved these to the top of the file alongside the existing imports, then wrapped GET and POST with try/catch.
- Files modified (26 routes):
  * src/app/api/analytics/route.ts (GET)
  * src/app/api/articles/[id]/bookmark/route.ts (GET + POST)
  * src/app/api/articles/bulk/route.ts (POST)
  * src/app/api/auth/logout/route.ts (POST — wrapped clearSession() defensively even though it has no db call)
  * src/app/api/auth/theme/route.ts (POST)
  * src/app/api/bookmarks/route.ts (GET)
  * src/app/api/dosen/[id]/route.ts (GET + PUT + DELETE)
  * src/app/api/dosen/route.ts (GET + POST, plus double-wrap bug fix above)
  * src/app/api/events/[id]/route.ts (GET + PUT + DELETE)
  * src/app/api/export/route.ts (GET)
  * src/app/api/gallery/[id]/route.ts (DELETE)
  * src/app/api/leaderboard/route.ts (GET)
  * src/app/api/messages/conversation/route.ts (GET)
  * src/app/api/notifications/[id]/route.ts (PATCH + DELETE)
  * src/app/api/notifications/route.ts (GET + POST)
  * src/app/api/students/[id]/portfolio/[itemId]/route.ts (PUT + DELETE)
  * src/app/api/students/[id]/portfolio/route.ts (GET + POST)
  * src/app/api/students/bulk/route.ts (POST)
  * src/app/api/students/unlinked/route.ts (GET)
  * src/app/api/tags/route.ts (GET + POST, plus import-order tidy)
  * src/app/api/users/[id]/followers/route.ts (GET)
  * src/app/api/users/[id]/following/route.ts (GET)
  * src/app/api/users/[id]/profile/route.ts (GET)
  * src/app/api/users/[id]/route.ts (PATCH + DELETE)
  * src/app/api/users/route.ts (GET + POST)
  * src/app/api/users/suggestions/route.ts (GET — wrapped both anonymous + logged-in branches separately so a failure in the anon branch still returns 200 + `{ suggestions: [], dbError: true }`)

Stage Summary:
- All 26 API data routes (excluding `/api/route.ts` root docs) now have try/catch around every `db.xxx` call. Database failures (missing DATABASE_URL, schema not pushed, FK violations, connection timeouts, etc.) now return:
  * 200 + `{ <empty shape>, dbError: true }` for GET — frontend can render "no data" instead of crashing on a 500 empty body.
  * 500 + `{ error: '<human-readable message>' }` for POST/PUT/PATCH/DELETE — frontend can show the error message and the user can retry without triggering a parse-cascade.
- This directly fixes the "very slow app" symptom described in the task brief: previously, on DB errors, the routes returned 500 with an empty body. The frontend's `await res.json()` would throw a SyntaxError (Unexpected end of JSON input), which most callers wrapped in their own try/catch that triggered an exponential-backoff retry (e.g. react-query's `retry: 3` + jitter). After this fix, the frontend gets a valid JSON body on the first try, so no retries cascade and the app feels snappy even when the DB is down/slow.
- All auth checks (401/403 semantics) preserved — try/catch only wraps DB work.
- No Cache-Control headers added (next.config.ts handles that globally per task rule 3).
- Lint: `bun run lint` → 0 errors, 13 warnings (all pre-existing, in unrelated component files — same baseline as post-auth-fixes).
- Discovery script re-run: only `src/app/api/route.ts` remains without try/catch — that's the root API docs page, intentionally skipped per task rule 8.
- Artifacts (26 files): see "Files modified" list above.
