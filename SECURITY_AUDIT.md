# 🔒 Security Audit — Statistika '25 Untirta Profile

Dokumen ini berisi audit kelengkapan setup Supabase + daftar kerentanan keamanan + langkah penanggulangan untuk deployment ke **Vercel + Supabase**.

> Diperbarui: 2026-09-26
> Status: Audit lengkap, beberapa mitigasi perlu implementasi

---

## Daftar Isi

1. [Status Setup Supabase Saat Ini](#1-status-setup-supabase-saat-ini)
2. [Daftar Kerentanan Keamanan](#2-daftar-kerentanan-keamanan)
3. [Mitigasi per Phase (Pre-deploy → Deploy → Post-deploy)](#3-mitigasi-per-phase)
4. [Checklist Deploy Vercel + Supabase](#4-checklist-deploy-vercel--supabase)

---

## 1. Status Setup Supabase Saat Ini

### ✅ Code Infrastructure SUDAH SIAP (di repo)

| # | File | Fungsi | Status |
|---|------|--------|--------|
| 1 | `src/lib/supabase-browser.ts` | Browser client via `@supabase/ssr` (createBrowserClient) | ✅ Ready |
| 2 | `src/lib/supabase-server.ts` | Server client RLS-aware + admin bypass (`createSupabaseAdminClient`) | ✅ Ready |
| 3 | `src/lib/supabase-types.ts` | TypeScript interfaces (placeholder, perlu auto-gen) | ✅ Ready |
| 4 | `src/app/auth/callback/route.ts` | OAuth callback handler (exchange code → session → cookie) | ✅ Ready |
| 5 | `SUPABASE_SETUP.md` | Panduan 9-step setup | ✅ Ready |
| 6 | `.env.example` | Template semua env vars (DB + Supabase + Auth) | ✅ Ready |
| 7 | `prisma/schema.prisma` | Komentar cara switch `sqlite` → `postgresql` | ✅ Ready |
| 8 | `package.json` | `@supabase/supabase-js@2.117.2` + `@supabase/ssr@0.12.7` terinstall | ✅ Ready |

### ❌ Yang BELUM DISetup (perlu user action)

| # | Item | Cara Setup |
|---|------|-----------|
| 1 | Supabase project belum dibuat | Daftar di https://supabase.com, create project region Singapore |
| 2 | DATABASE_URL masih SQLite (`file:./db/custom.db`) | Update `.env` dengan Supabase pooler URL |
| 3 | Prisma provider masih `sqlite` | Edit `prisma/schema.prisma` → `provider = "postgresql"` |
| 4 | Tables belum dibuat di Supabase | `bun run db:push` |
| 5 | Seed data belum di-insert ke Supabase | `bun run db:seed` |
| 6 | API keys belum diisi di `.env` | Copy dari Supabase Dashboard → Project Settings → API |
| 7 | OAuth providers belum dikonfigurasi | Supabase Dashboard → Authentication → Providers (Google, GitHub, dll) |
| 8 | RLS policies belum ada | Eksekusi SQL via Supabase SQL Editor (lihat `SUPABASE_SETUP.md` Step 7) |
| 9 | App code masih pakai `src/lib/session.ts` (custom cookie auth) | Migrasi route handlers ke `supabaseServer()` |
| 10 | Storage bucket belum dibuat untuk upload foto | Supabase Dashboard → Storage → New bucket `mahasiswa-photos` |
| 11 | Redirect URLs belum dikonfigurasi di Supabase | Authentication → URL Configuration → tambah `http://localhost:3000/auth/callback` + domain Vercel |

### 📊 Kelengkapan: 8/19 (42%)

Sisa 11 item adalah konfigurasi di dashboard Supabase/Vercel yang TIDAK BISA saya kerjakan dari sini (perlu akses ke akun user).

---

## 2. Daftar Kerentanan Keamanan

### 🔴 CRITICAL (Wajib fix sebelum deploy)

#### V-01: Password hashing pakai SHA-256 (raw, tanpa salt)
- **File**: `src/lib/session.ts` line 38-40
- **Masalah**: `createHash('sha256').update(pw).digest('hex')`
  - SHA-256 adalah hash function CEPAT → rentan brute force & rainbow table
  - Tidak ada salt → 2 user dengan password sama punya hash sama
  - Tidak ada work factor (cost) yang membuat brute force mahal
- **Risiko**: Jika database leak, attacker bisa crack password dalam detik
- **Mitigasi**: Ganti ke `bcrypt` (cost ≥ 10) atau `argon2id` (recommended)
  ```bash
  bun add bcryptjs @types/bcryptjs  # atau argon2
  ```
  ```ts
  import bcrypt from 'bcryptjs'
  export function hashPassword(pw: string) {
    return bcrypt.hashSync(pw, 10)  // cost factor 10
  }
  export function verifyPassword(pw: string, hash: string) {
    return bcrypt.compareSync(pw, hash)
  }
  ```
  Lalu reset semua password user (atau migrate saat login pertama).

#### V-02: Login endpoint TIDAK ada rate limiting
- **File**: `src/app/api/auth/login/route.ts`
- **Masalah**: Endpoint `/api/auth/login` bisa dihit tanpa batas
- **Risiko**: Brute force password akun admin (terutama karena default `admin/admin`)
- **Mitigasi**:
  - Implementasi rate limiting pakai Upstash Redis (works di Vercel serverless)
  - Limit: 5 attempts per 15 menit per IP + username
  - Lock akun setelah 10 failed attempts (unlock via admin)
  ```bash
  bun add @upstash/redis @upstash/ratelimit
  ```

#### V-03: Rate limiting in-memory TIDAK WORK di Vercel
- **File**: `src/app/api/aspirasi/route.ts` (line 5-30)
- **Masalah**: `const rateMap = new Map()` — disimpan di memori server
  - Vercel serverless = stateless instances → setiap request jalan di instance berbeda
  - Setiap instance punya `rateMap` sendiri → attacker bisa bypass dengan request cepat
- **Mitigasi**: Pakai Upstash Redis (serverless-friendly, REST API):
  ```ts
  import { Ratelimit } from '@upstash/ratelimit'
  import { redis } from '@/lib/redis'
  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '10 m'),
    prefix: 'aspirasi',
  })
  ```

#### V-04: Service Role Key bisa ter-expose di browser bundle
- **File**: `src/lib/supabase-server.ts` (mengakses `process.env.SUPABASE_SERVICE_ROLE_KEY`)
- **Masalah**: Service Role Key bypass RLS — jika ter-expose = penuh akses ke DB
  - Saat ini hanya di-import di server-side route handlers → AMAN
  - TAPI jika ada yang tidak sengaja import `supabaseServer` di file dengan `'use client'`, Next.js akan bundle key ke client JS
- **Risiko**: Catastrophic data leak jika key exposed
- **Mitigasi**:
  - Tambahkan ESLint rule untuk mencegah import `supabase-server.ts` di client components
  - Buat file `.eslintrc` dengan `no-restricted-imports` rule
  - Atau rename file jadi `supabase-server.server.ts` (Next.js auto-detect `.server.ts`)

#### V-05: Tidak ada security headers
- **File**: `next.config.ts`
- **Masalah**: Tidak ada CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS
- **Risiko**: XSS, clickjacking, MIME-sniffing, SSL strip
- **Mitigasi**: Tambah `headers()` di `next.config.ts`:
  ```ts
  const nextConfig = {
    async headers() {
      return [{
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          // CSP — sesuaikan dengan kebutuhan
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co;" },
        ],
      }]
    },
  }
  ```

### 🟠 HIGH

#### V-06: `typescript.ignoreBuildErrors: true`
- **File**: `next.config.ts` line 5
- **Masalah**: Build tidak fail meski ada TypeScript errors → bug type-safety lolos ke production
- **Mitigasi**: Set `ignoreBuildErrors: false`

#### V-07: `reactStrictMode: false`
- **File**: `next.config.ts` line 7
- **Masalah**: Strict mode disabled → tidak ada warning untuk unsafe lifecycle, deprecated APIs
- **Mitigasi**: Set `reactStrictMode: true`

#### V-08: CSRF protection tidak ada (cookie-based session)
- **File**: `src/lib/session.ts` (`sameSite: 'lax'`)
- **Masalah**: Cookie `sameSite: 'lax'` block POST cross-origin, TAPI:
  - GET requests dari third-party site masih bawa cookie
  - Jika ada GET endpoint yang ubah state (e.g. `/api/logout` via GET), bisa CSRF
  - Saat ini logout pakai POST → relatif aman, tapi tetap perlu CSRF token
- **Mitigasi**:
  - Migrasi ke Supabase Auth (CSRF built-in via PKCE flow)
  - Atau generate CSRF token di `/api/auth/csrf`, validate di setiap POST/PUT/DELETE
  - Atau set `sameSite: 'strict'` (lebih ketat tapi break OAuth flow)

#### V-09: File upload validation weak (client-side only)
- **File**: `src/components/ImageUploader.tsx`
- **Masalah**: Hanya cek `file.type.startsWith('image/')` di client
  - Attacker bisa bypass dengan curl POST langsung ke API
  - Tidak ada magic-bytes / file signature validation di server
  - Tidak ada `/api/upload/route.ts` — belum jelas ke mana file diupload
- **Risiko**: Upload polyglot file (image yang berisi PHP/JS script)
- **Mitigasi**:
  - Buat `/api/upload/route.ts` dengan validasi magic bytes di server
  - Pakai `file-type` library untuk detect true MIME
  - Limit file size di server (multer-like middleware)
  - Generate random filename, simpan di `public/uploads/` dengan no-execute permissions
  - Atau pakai Supabase Storage (ada validation built-in)

#### V-10: Tidak ada audit log untuk admin actions
- **Masalah**: Aksi admin (delete aspirasi, edit dosen, export user data) tidak tercatat
- **Risiko**: Insider threat tidak terdeteksi, accountability = 0
- **Mitigasi**: Buat tabel `AuditLog`:
  ```prisma
  model AuditLog {
    id        String   @id @default(cuid())
    actorId   String
    action    String   // "delete_aspirasi", "edit_dosen", etc
    targetId  String?
    metadata  String?
    createdAt DateTime @default(now())
  }
  ```
  Log setiap admin action, expose di Admin Panel.

### 🟡 MEDIUM

#### V-11: SESSION_SECRET tidak ada rotasi
- **File**: `.env` (variable `SESSION_SECRET`)
- **Masalah**: Jika SESSION_SECRET bocor, semua session cookie bisa di-forge
- **Mitigasi**:
  - Rotate secret setiap 90 hari
  - Implementasi key ring (multiple valid secrets, graceful rotation)
  - Invalidasi semua session setelah rotation

#### V-12: Session tidak ter-invalidasi server-side setelah logout
- **File**: `src/app/api/auth/logout/route.ts`
- **Masalah**: Hapus cookie di browser, tapi session tetap "valid" jika cookie di-replay
  - Karena pakai signed cookie (stateless), tidak ada server-side session store
  - Attacker yang capture cookie bisa pakai setelah logout
- **Mitigasi**:
  - Pakai Supabase Auth (server-side session, bisa revoke)
  - Atau maintain blacklist di Redis untuk revoked sessions

#### V-13: Default credentials `admin/admin`
- **Masalah**: Akun admin default dengan password mudah ditebak
- **Mitigasi**:
  - Wajib ganti password saat setup pertama
  - Atau hapus akun admin default, buat setelah setup via UI/CLI
  - Disable akun admin setelah X failed login attempts

#### V-14: Error messages reveal internal info
- **File**: Multiple route handlers (e.g. `src/app/api/auth/login/route.ts` line 35: `console.error('[auth/login] error', e)`)
- **Masalah**: `console.error` di Vercel logs bisa expose stack trace / env vars
- **Mitigasi**:
  - Sanitize error before logging
  - Use structured logger (pino, winston) with redaction
  - Return generic error messages to client

#### V-15: Public API routes mungkin leak data
- **File**: `src/app/api/activity/route.ts`, `leaderboard`, `stats`, `search`
- **Masalah**: Endpoint ini `NO auth check` — perlu verifikasi tidak expose PII
- **Mitigasi**:
  - Audit setiap public endpoint, pastikan tidak return email, user ID, dll
  - Limit response fields (e.g. `select: { id: true, name: true }`)

### 🟢 LOW

#### V-16: `reactStrictMode: false` → tidak best practice
#### V-17: No robots.txt restrictions → check `/public/robots.txt`
#### V-18: No sitemap.xml → SEO only, bukan security
#### V-19: No Dependabot → dependencies tidak auto-update (security patches tertunda)
#### V-20: Sharp processing di memory → potential DoS dengan file besar

---

## 3. Mitigasi per Phase

### Phase 1 — Pre-deploy Hardening (Lokal, sebelum push ke Vercel)

#### Step 1.1: Ganti password hashing ke bcrypt
```bash
bun add bcryptjs @types/bcryptjs
```
Edit `src/lib/session.ts`:
```ts
import bcrypt from 'bcryptjs'
const SALT_ROUNDS = 10

export function hashPassword(pw: string): string {
  return bcrypt.hashSync(pw, SALT_ROUNDS)
}
export function verifyPassword(pw: string, hash: string): boolean {
  return bcrypt.compareSync(pw, hash)
}
```
Update login route: ganti `user.passwordHash !== hashPassword(password)` jadi `!verifyPassword(password, user.passwordHash)`.

#### Step 1.2: Tambah security headers di `next.config.ts`
Lihat code snippet di V-05 di atas.

#### Step 1.3: Aktifkan TypeScript strict + React strict mode
```ts
const nextConfig = {
  output: "standalone",
  typescript: { ignoreBuildErrors: false },  // ← ganti
  reactStrictMode: true,                       // ← ganti
}
```

#### Step 1.4: Tambah rate limiting di login (Upstash Redis)
```bash
bun add @upstash/redis @upstash/ratelimit
```
Buat `src/lib/ratelimit.ts`:
```ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  prefix: 'login',
})
```
Apply di `src/app/api/auth/login/route.ts`:
```ts
import { ratelimit } from '@/lib/ratelimit'
const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
const { success } = await ratelimit.limit(ip)
if (!success) return NextResponse.json({ error: 'Too many attempts.' }, { status: 429 })
```

#### Step 1.5: Audit public endpoints
Pastikan `/api/activity`, `/api/leaderboard`, `/api/stats`, `/api/search` tidak expose:
- Email user
- User ID (cuid) — kecuali perlu
- Password hash
- IP address

#### Step 1.6: Buat `/api/upload/route.ts` dengan server-side validation
```ts
import { fileTypeFromBuffer } from 'file-type'
// ... validate magic bytes, size, dst
```

### Phase 2 — Supabase Project Setup

#### Step 2.1: Buat project Supabase
- Region: `Southeast Asia (Singapore)` — paling dekat Indonesia
- Plan: Free tier (500MB DB, 50K MAU auth)
- Password DB: generate 32+ char random

#### Step 2.2: Setup schema
1. Edit `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
     directUrl = env("DIRECT_URL")
   }
   ```
2. Update `.env` dengan Supabase pooler + direct URLs
3. Jalankan:
   ```bash
   bun run db:generate
   bun run db:push
   bun run db:seed
   ```

#### Step 2.3: Setup RLS (Row-Level Security)
Buka Supabase Dashboard → SQL Editor, jalankan:

```sql
-- Enable RLS on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Student" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Article" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Aspirasi" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Dosen" ENABLE ROW LEVEL SECURITY;
-- (repeat for all 17 tables)

-- Public read for non-sensitive tables
CREATE POLICY "Public read students" ON "Student" FOR SELECT USING (true);
CREATE POLICY "Public read articles" ON "Article" FOR SELECT USING (published = true);
CREATE POLICY "Public read dosen" ON "Dosen" FOR SELECT USING (true);
CREATE POLICY "Public read aspirasi approved" ON "Aspirasi" FOR SELECT USING (approved = true);

-- Users can only modify their own data
CREATE POLICY "Users update own profile" ON "User" FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users manage own articles" ON "Article" FOR ALL
  USING (auth.uid() = "authorId");

-- Admin full access (via custom role claim)
CREATE POLICY "Admin full access" ON "Aspirasi" FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');
-- (repeat for all tables that need admin access)
```

#### Step 2.4: Configure OAuth providers
Di Supabase Dashboard → Authentication → Providers:

**Google OAuth**:
1. Google Cloud Console → APIs & Services → Credentials → Create OAuth 2.0 Client ID
2. Authorized redirect URI: `https://[PROJECT_REF].supabase.co/auth/v1/callback`
3. Copy Client ID + Secret ke Supabase Dashboard

**GitHub OAuth**:
1. GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
2. Callback URL: `https://[PROJECT_REF].supabase.co/auth/v1/callback`
3. Copy Client ID + Secret ke Supabase Dashboard

#### Step 2.5: Set redirect URLs
Authentication → URL Configuration:
- Site URL: `https://[your-app].vercel.app`
- Redirect URLs:
  - `http://localhost:3000/auth/callback` (dev)
  - `https://[your-app].vercel.app/auth/callback` (prod)
  - `https://[your-app]-*.vercel.app/auth/callback` (preview deploys)

#### Step 2.6: Setup admin role
1. Buat akun pertama via Supabase Dashboard → Authentication → Users → Add user
2. Jalankan SQL untuk set role admin:
   ```sql
   -- Buat tabel profiles yang mirror auth.users
   CREATE TABLE profiles (
     id UUID REFERENCES auth.users(id) PRIMARY KEY,
     username TEXT UNIQUE,
     role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
     display_name TEXT,
     theme TEXT DEFAULT 'light'
   );

   -- Set user pertama sebagai admin
   INSERT INTO profiles (id, username, role, display_name)
   VALUES ('[YOUR-USER-UUID]', 'admin', 'admin', 'Administrator');
   ```

#### Step 2.7: Setup Storage bucket untuk upload foto
- Supabase Dashboard → Storage → New bucket
- Name: `mahasiswa-photos`
- Public: false (gunakan signed URL)
- Policies: user bisa upload ke folder sendiri, admin bisa upload ke mana saja

### Phase 3 — Vercel Deploy

#### Step 3.1: Import project ke Vercel
1. https://vercel.com/new
2. Import `raynzz455/Statistika-Untirta-Profile-2025`
3. Framework Preset: Next.js (auto-detect)
4. Root Directory: `./`
5. Build Command: `bun run build` (auto)
6. Output Directory: `.next` (auto)

#### Step 3.2: Set environment variables
Di Vercel → Project Settings → Environment Variables:

| Variable | Value | Sensitive? |
|----------|-------|------------|
| `DATABASE_URL` | `postgresql://...pooler.supabase.com:6543/...` | 🔴 Yes |
| `DIRECT_URL` | `postgresql://...supabase.com:5432/...` | 🔴 Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | 🟢 Public (OK exposed) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGc...` | 🟢 Public (anon, RLS-protected) |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGc...` | 🔴🔴🔴 **NEVER** make NEXT_PUBLIC_ |
| `SESSION_SECRET` | 32+ char random | 🔴 Yes |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | 🟢 Public |
| `NODE_ENV` | `production` | 🟢 |

> ⚠️ **CRITICAL**: Pastikan `SUPABASE_SERVICE_ROLE_KEY` dan `SESSION_SECRET` **TIDAK** diawali `NEXT_PUBLIC_`. Jika diawali, akan ter-bundle ke browser JS dan bisa dilihat siapa pun.

#### Step 3.3: Enable Vercel security features
1. **Vercel Firewalls** (Project → Settings → Firewalls):
   - Rate limit: 100 requests per 10 seconds per IP
   - Block suspicious IPs
2. **Vercel WAF** (Web Application Firewall):
   - SQL injection rules
   - XSS rules
3. **DDoS Protection** (built-in, auto-enabled)
4. **HSTS** (Project → Settings → HTTPS):
   - "HSTS" toggle = ON
   - max-age: 63072000 (2 years)
   - includeSubDomains: ON
   - preload: ON

#### Step 3.4: Domain setup
- Tambah custom domain (e.g. `statistika25.untirta.ac.id`)
- Vercel auto-generate SSL cert (Let's Encrypt)
- Update Supabase redirect URLs dengan domain custom

### Phase 4 — Post-deploy Ongoing

#### Step 4.1: Setup monitoring
- **Vercel Analytics** — traffic & performance
- **Vercel Speed Insights** — Core Web Vitals
- **Supabase Logs** — DB query logs, auth events
- **Sentry** (optional) — error tracking & performance

#### Step 4.2: Backup database
- Supabase Free tier: daily backups, 7-day retention
- Pro tier: PITR (Point-in-Time Recovery), 30-day retention
- Manual export via Supabase Dashboard → Database → Backup

#### Step 4.3: Rotate secrets (quarterly)
- `SESSION_SECRET` — generate baru, update di Vercel, restart serverless
- `SUPABASE_SERVICE_ROLE_KEY` — via Supabase Dashboard → Project Settings → API → Reset
- GitHub PAT (jika pakai untuk CI/CD)

#### Step 4.4: Update dependencies (monthly)
- Enable Dependabot untuk GitHub repo
- Atau `bun update` manual
- Audit dengan `bun audit` (Bun) atau `npm audit`

#### Step 4.5: Monitor Supabase Auth activity
- Dashboard → Authentication → Logs
- Watch untuk: failed login spikes, suspicious IPs, new user signups

---

## 4. Checklist Deploy Vercel + Supabase

Gunakan checklist ini sebelum go-live:

### Pre-deploy
- [ ] **V-01 FIXED**: Password hashing pakai bcrypt (cost ≥ 10)
- [ ] **V-02 FIXED**: Login rate limiting via Upstash Redis (5 attempts / 15 min)
- [ ] **V-03 FIXED**: Aspirasi rate limit migrated ke Redis (bukan in-memory)
- [ ] **V-04 SAFE**: Service Role Key tidak pernah di-import di client code
- [ ] **V-05 FIXED**: Security headers (CSP, X-Frame-Options, HSTS, dll) di next.config.ts
- [ ] **V-06 FIXED**: `ignoreBuildErrors: false`
- [ ] **V-07 FIXED**: `reactStrictMode: true`
- [ ] **V-09 FIXED**: Server-side file upload validation (magic bytes, MIME, size)
- [ ] **V-13 FIXED**: Default admin/admin credentials changed
- [ ] Lint pass: `bun run lint` (0 errors)

### Supabase
- [ ] Project Supabase dibuat (region Singapore)
- [ ] API keys tersalin ke `.env` lokal dan Vercel env vars
- [ ] Prisma provider switched: `sqlite` → `postgresql`
- [ ] `bun run db:push` sukses (17 tables created)
- [ ] `bun run db:seed` sukses (test data inserted)
- [ ] RLS enabled di semua 17 tables
- [ ] RLS policies dibuat (public read, user own-data, admin full)
- [ ] OAuth providers dikonfigurasi (Google, GitHub minimal)
- [ ] Redirect URLs di-set (localhost + domain Vercel)
- [ ] Admin user pertama dibuat via Dashboard + SQL set role = 'admin'
- [ ] Storage bucket `mahasiswa-photos` dibuat

### Vercel
- [ ] Repo di-import ke Vercel
- [ ] Semua env vars di-set (8 variabel)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` TIDAK diawali `NEXT_PUBLIC_`
- [ ] `SESSION_SECRET` TIDAK diawali `NEXT_PUBLIC_`
- [ ] Domain custom ditambah (jika ada)
- [ ] HTTPS / HSTS auto-enabled (Vercel default)
- [ ] Vercel Firewalls: rate limit configured
- [ ] Preview deployments enabled untuk testing

### Post-deploy
- [ ] Test login flow (manual) di production URL
- [ ] Test OAuth Google login
- [ ] Test admin can delete aspirasi
- [ ] Test public user TIDAK bisa delete aspirasi (403)
- [ ] Test rate limit login (5 attempts → 429)
- [ ] Vercel Analytics + Speed Insights enabled
- [ ] Backup DB first-run (test restore juga)
- [ ] Document runbook untuk incident response

---

## Ringkasan Prioritas

| Prioritas | Jumlah | Kategori |
|-----------|--------|----------|
| 🔴 CRITICAL | 5 | Wajib fix sebelum deploy |
| 🟠 HIGH | 5 | Fix dalam 1 minggu post-deploy |
| 🟡 MEDIUM | 5 | Fix dalam 1 bulan |
| 🟢 LOW | 5 | Best practice, long-term |

**Estimasi effort**:
- Phase 1 (Pre-deploy hardening): 4-6 jam
- Phase 2 (Supabase setup): 2-3 jam
- Phase 3 (Vercel deploy): 1-2 jam
- Phase 4 (Ongoing): 1-2 jam/bulan

---

## Referensi

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Vercel Security Best Practices](https://vercel.com/docs/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Headers](https://nextjs.org/docs/app/building-your-application/configuring/headers)

---

**Lisensi**: Apache 2.0
**Author**: Raynaldi &lt;raynss455x@gmail.com&gt;
