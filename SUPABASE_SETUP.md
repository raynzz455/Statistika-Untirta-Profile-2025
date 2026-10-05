# 🗄️ Panduan Setup Supabase untuk Statistika '25

Panduan lengkap untuk migrasi dari SQLite lokal ke Supabase PostgreSQL + Auth.

---

## Daftar Isi

1. [Kenapa Supabase?](#kenapa-supabase)
2. [Auth: Supabase vs NextAuth.js](#auth-supabase-vs-nextauthjs)
3. [Step 1 — Buat Project Supabase](#step-1--buat-project-supabase)
4. [Step 2 — Setup Database PostgreSQL](#step-2--setup-database-postgresql)
5. [Step 3 — Aktifkan Supabase Auth](#step-3--aktifkan-supabase-auth)
6. [Step 4 — Konfigurasi OAuth Providers](#step-4--konfigurasi-oauth-providers)
7. [Step 5 — Update .env](#step-5--update-env)
8. [Step 6 — Push Schema via Prisma](#step-6--push-schema-via-prisma)
9. [Step 7 — Setup Row Level Security (RLS)](#step-7--setup-row-level-security-rls)
10. [Step 8 — Test Login Flow](#step-8--test-login-flow)
11. [Step 9 — Deploy ke Vercel](#step-9--deploy-ke-vercel)
12. [Troubleshooting](#troubleshooting)

---

## Kenapa Supabase?

Supabase adalah **alternative open-source untuk Firebase** yang dibangun di atas PostgreSQL. Untuk proyek Statistika '25, Supabase memberikan:

- ✅ **PostgreSQL managed** — DB production-grade, tidak perlu self-host
- ✅ **Auth built-in** — OAuth (Google, GitHub, Apple, dll), magic link, phone OTP, email
- ✅ **Row-Level Security** — keamanan per-row di DB level, bukan di app code
- ✅ **Realtime** — subscriptions untuk fitur live (notifikasi, chat)
- ✅ **Storage** — upload file gambar langsung ke Supabase (untuk galeri/foto mahasiswa)
- ✅ **Free tier generous** — 500MB DB, 50,000 MAU auth, 1GB storage

---

## Auth: Supabase vs NextAuth.js

Untuk proyek ini, **rekomendasi: gunakan Supabase Auth** (built-in).

| Aspek | Supabase Auth ✅ | NextAuth.js ❌ |
|-------|-------------------|------------------|
| Integrasi DB | Zero-config (RLS otomatis) | Perlu adapter manual |
| OAuth providers | Built-in (Google, GitHub, Apple, Discord, dll) | 100+ tapi konfigurasi manual |
| Row-Level Security | ✅ Built-in di PostgreSQL level | ❌ Tidak ada |
| Magic link / OTP | ✅ Built-in | Perlu implementasi sendiri |
| Sesi management | ✅ JWT auto-refresh | Perlu configure session strategy |
| Free tier | 50,000 MAU | Open source (hosting sendiri) |
| Boilerplate code | Sangat sedikit | Banyak |
| Vendor lock-in | PostgreSQL standard (bisa pindah) | Framework-agnostic |

**Keputusan**: Pakai **Supabase Auth** karena sudah pakai Supabase DB → integrasi zero-config. NextAuth.js tetap ada di dependencies sebagai backup (jika ingin pindah auth provider di masa depan, code migration lebih mudah).

---

## Step 1 — Buat Project Supabase

1. Buka https://supabase.com dan login (bisa pakai GitHub)
2. Klik **New Project**
3. Isi:
   - **Name**: `statistika-25-untirta` (atau bebas)
   - **Database Password**: buat password kuat, **simpan** di password manager
   - **Region**: `Southeast Asia (Singapore)` — paling dekat ke Indonesia
   - **Pricing Plan**: Free (cukup untuk development & portofolio)
4. Tunggu ~2 menit hingga project siap

---

## Step 2 — Setup Database PostgreSQL

1. Di dashboard Supabase, buka **Project Settings** (gear icon kiri bawah)
2. Buka tab **Database**
3. Di section **Connection string**, pilih **Transaction** mode (pooler)
4. Salin URL berbentuk:
   ```
   postgresql://postgres.[PROJECT_REF]:[YOUR_PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```
5. Juga ambil **Direct connection** (untuk migration):
   ```
   postgresql://postgres.[PROJECT_REF]:[YOUR_PASSWORD]@aws-0-ap-southeast-1.supabase.com:5432/postgres
   ```

---

## Step 3 — Aktifkan Supabase Auth

Supabase Auth sudah aktif secara default. Untuk konfigurasi:

1. Buka tab **Authentication** di dashboard
2. **Sign In / Providers** — aktifkan provider yang ingin dipakai:
   - ✅ Email (default, jangan dimatikan)
   - ✅ Google (recommended untuk mahasiswa)
   - ✅ GitHub (recommended untuk developer)
   - (Opsional) Apple, Discord, Facebook, dst.
3. **URL Configuration**:
   - **Site URL**: `http://localhost:3000` (dev) atau domain production
   - **Redirect URLs**: tambahkan:
     - `http://localhost:3000/auth/callback`
     - `https://[YOUR_DOMAIN]/auth/callback`

---

## Step 4 — Konfigurasi OAuth Providers

### Google OAuth

1. Buka https://console.cloud.google.com
2. Buat project baru (atau pakai existing)
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
4. Application type: **Web application**
5. **Authorized JavaScript origins**: `http://localhost:3000`
6. **Authorized redirect URIs**:
   ```
   https://[PROJECT_REF].supabase.co/auth/v1/callback
   ```
7. Salin **Client ID** + **Client Secret**
8. Kembali ke Supabase Dashboard → Authentication → Providers → Google:
   - Paste Client ID + Client Secret
   - Save

### GitHub OAuth

1. Buka https://github.com/settings/developers
2. **OAuth Apps → New OAuth App**
3. Isi:
   - **Application name**: Statistika '25 Untirta (Dev)
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**:
     ```
     https://[PROJECT_REF].supabase.co/auth/v1/callback
     ```
4. Register → generate client secret
5. Copy Client ID + Client Secret
6. Paste ke Supabase Dashboard → Authentication → Providers → GitHub

---

## Step 5 — Update .env

Edit `.env` di root proyek:

```bash
# Ganti SQLite dengan Supabase
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[YOUR_PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[YOUR_PASSWORD]@aws-0-ap-southeast-1.supabase.com:5432/postgres"

# Ambil dari Supabase Dashboard → Project Settings → API
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...."

# Tetap sama
SESSION_SECRET="[strong-random-string]"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

> ⚠️ Jangan commit `.env`! File ini sudah ada di `.gitignore`.

---

## Step 6 — Push Schema via Prisma

Edit `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // ★ ubah dari "sqlite"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  // ★ untuk migration
}
```

Lalu jalankan:

```bash
# Generate Prisma client untuk PostgreSQL
bun run db:generate

# Push schema ke Supabase (membuat semua tabel)
bun run db:push

# Isi data seed
bun run db:seed
```

Verifikasi di Supabase Dashboard → **Table Editor** — semua 17 tabel harus terlihat.

---

## Step 7 — Setup Row Level Security (RLS)

Untuk keamanan, aktifkan RLS di tabel sensitif. Contoh policy:

```sql
-- Aktifkan RLS di tabel profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: user hanya bisa baca profile sendiri
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: user bisa update profile sendiri
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Public bisa baca tabel publik (students, articles, events)
CREATE POLICY "Public read access on students"
  ON students FOR SELECT
  USING (true);
```

Jalankan policy di Supabase Dashboard → **SQL Editor**.

> Note: Saat ini, aplikasi masih pakai Prisma untuk query, bukan Supabase client langsung. RLS otomatis aktif tapi belum dipakai penuh. Untuk migrasi penuh ke Supabase client (lebih aman), ganti query Prisma di route handlers dengan `supabaseServer().from('table').select()`.

---

## Step 8 — Test Login Flow

1. Start dev server:
   ```bash
   bun run dev
   ```
2. Buka http://localhost:3000
3. Klik **Login** → pilih **"Masuk dengan Google"** atau **"Masuk dengan GitHub"**
4. OAuth flow → redirect ke Google/GitHub → consent → balik ke `/auth/callback`
5. Sesi tersimpan di cookie, user redirect ke Beranda

Untuk sign out:
```ts
import { supabaseBrowser } from '@/lib/supabase-browser'
await supabaseBrowser.auth.signOut()
```

---

## Post-Login Routing Workflow (Wajib dipahami)

Setelah login berhasil (baik via Google OAuth maupun custom session),
sistem akan mengarahkan user ke halaman yang sesuai berdasarkan status
mereka. Routing ini dijalankan di **dua tempat** untuk redundansi:

### 1. Server-side redirect (`src/app/auth/callback/route.ts`)

Setelah OAuth callback berhasil, server menentukan URL tujuan akhir:

| Kondisi User | URL Tujuan | Alasan |
|---|---|---|
| `role === 'admin'` (Google OAuth + profile.role='admin') | `/#/` (Beranda) | Admin tidak perlu klaim NIM, panel admin tersedia di Header |
| Sudah ada student yang ter-link (`students.owner_id = user.id`) | `/#/profile/<studentId>` | Langsung ke profil mahasiswa yang sudah diklaim |
| Belum ada student ter-link (first-time Google OAuth user) | `/#/claim-profile` | Form input NIM untuk klaim profil |

### 2. Client-side safety net (`src/app/page.tsx`)

Setelah `fetch('/api/auth/me')`, frontend juga cek hash URL:
- Jika user mendarat di `/#/claim-profile` tapi sudah punya `studentId`
  → auto-redirect ke `/#/profile/<studentId>` (mis: dari tombol back)
- Jika user mendarat di `/#/claim-profile` tapi `role === 'admin'`
  → auto-redirect ke `/#/` (Beranda)

### 3. Custom session login (`src/components/views/LoginView.tsx`)

Untuk login username/password (akun demo admin/admin, user/user, fauzi/fauzi):
- Admin → `/#/admin` (panel admin)
- Sudah ada student ter-link → `/#/profile/<studentId>`
- Belum ada student ter-link → `/#/settings` (kelola akun)

### ClaimProfileView Behavior (`src/components/views/ClaimProfileView.tsx`)

View ini juga pintar — tidak selalu menampilkan form NIM:

| Kondisi | Yang ditampilkan |
|---|---|
| `user.studentId` ada | Banner "Profil Anda Sudah Ter-link" + tombol "Lihat Profil Saya" |
| `user.role === 'admin'` | Banner "Anda adalah Admin" + tombol "Buka Panel Admin" |
| Lainnya (first-time Google OAuth user) | Form input NIM |

### Critical Fix: Cookie Loss Bug

Sebelumnya, `auth/callback` membuat `res = NextResponse.redirect(<next>)`,
membiarkan Supabase set cookies via `setAll()`, lalu membuat
`NextResponse.redirect(<claim-profile>, { headers: res.headers })`.
Cookies yang di-set via `res.cookies.set()` disimpan di cookie store
terpisah — TIDAK otomatis ter-merge ke `headers` map biasa.
Akibatnya: redirect ke claim-profile tapi session cookie hilang,
frontend baca `user: null`, lalu redirect ke Beranda.

**Fix:** Buat SATU response redirect dengan URL final upfront,
set semua cookies (Supabase + stat_session) di response itu,
return langsung. Jika perlu ganti URL final (mis: admin → home),
rebuild response baru TAPI copy semua cookies via `res.cookies.getAll()`.

### Critical Fix: FK Constraint pada students.owner_id

Sebelumnya, Prisma schema mendeklarasikan `Student.owner User? @relation(...)`,
yang membuat FK constraint `students.owner_id → users.id`. Masalahnya:
- Google OAuth user → `session.userId = Supabase UUID` (e.g. `a1b2c3d4-...`)
- Prisma `users` table hanya berisi custom-session test users (CUID `clxxxx`)
- Saat `db.student.update({ ownerId: <UUID> })` → FK violation → **500 error**

**Fix:**
1. Hapus `owner User? @relation(...)` dari Prisma schema → `owner_id`
   menjadi plain String column tanpa FK
2. Tambah `@unique` di `ownerId` (relasi 1:1 — satu user hanya punya
   satu student profile)
3. Run `bun run db:generate` untuk regenerasi Prisma client
4. Untuk produksi Supabase: run `scripts/drop-students-owner-fk.sql`
   (drop FK constraint + add unique constraint — idempotent)

---

## Step 9 — Deploy ke Vercel

1. Push repo ke GitHub (sudah dilakukan)
2. Login ke https://vercel.com
3. **New Project → Import** repo `raynzz455/Statistika-Untirta-Profile-2025`
4. Framework preset: **Next.js** (auto-detect)
5. **Environment Variables** — isi semua dari `.env`:
   - `DATABASE_URL`, `DIRECT_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SESSION_SECRET`
   - `NEXT_PUBLIC_APP_URL` = `https://[your-vercel-domain].vercel.app`
6. **Deploy**
7. Update Supabase Dashboard → Authentication → URL Configuration:
   - Site URL: `https://[your-vercel-domain].vercel.app`
   - Redirect URLs: tambahkan production domain

---

## Troubleshooting

### Error: "Invalid API key" / "supabaseUrl is required"
- Pastikan `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` terisi
- Restart dev server setelah ubah `.env`

### Error: "Row Level Security is enabled but no policy exists"
- Buat policy minimal `SELECT` untuk tabel publik
- Atau disable RLS sementara: `ALTER TABLE [nama_tabel] DISABLE ROW LEVEL SECURITY;`

### OAuth: "redirect_uri_mismatch"
- Cek **Redirect URLs** di Supabase Dashboard → Authentication → URL Configuration
- Pastikan `http://localhost:3000/auth/callback` ada di daftar (untuk dev)
- Untuk prod, pastikan domain Vercel ada di daftar

### Prisma: "P1001: Can't reach database server"
- Cek format URL — harus pakai **pooler URL** (port 6543), bukan direct (port 5432)
- Pooler URL pakai format `postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:6543/postgres`

### Migration: "database is locked" (SQLite)
- Stop dev server sebelum run `db:push`
- Hapus file `db/custom.db` lalu push ulang

### Email tidak terkirim (forgot password)
- Free tier Supabase punya limit 4 email/jam
- Untuk produksi: pakai custom SMTP di Authentication → Email Templates → SMTP

### Claim NIM gagal: 500 "Gagal meng-update profil. Coba lagi atau hubungi admin."
- **Penyebab:** FK constraint `students.owner_id → users.id` menolak Google
  OAuth UUID (karena Google OAuth user tidak ada di Prisma `users` table,
  hanya di `auth.users` + `profiles`).
- **Fix:** Run `scripts/drop-students-owner-fk.sql` di Supabase SQL Editor.
  Script ini drop FK constraint + add unique constraint (idempotent).
- Setelahnya, login ulang Google OAuth, lalu coba claim NIM lagi.

### Setelah Google OAuth login, redirect ke Beranda (bukan claim-profile)
- **Penyebab:** Cookie loss bug di `/auth/callback` — dua `NextResponse.redirect`
  tidak share cookie store otomatis.
- **Fix:** Sudah diperbaiki di commit terbaru. Pastikan code di
  `src/app/auth/callback/route.ts` membuat SATU response redirect dengan
  URL final upfront, lalu re-apply cookies via `res.cookies.getAll()`
  jika perlu ganti URL final.

---

## FAQ

**Q: Bisakah pakai NextAuth.js alih-alih Supabase Auth?**
A: Bisa, tapi tidak direkomendasikan. NextAuth.js perlu adapter manual untuk Supabase + tidak ada RLS otomatis + lebih banyak boilerplate. Untuk proyek ini, Supabase Auth adalah pilihan terbaik.

**Q: Bagaimana jika ingin pindah dari Supabase ke DB lain?**
A: Karena Prisma dipakai sebagai ORM, ganti DATABASE_URL saja sudah cukup. Code aplikasi tetap sama. Hanya code Supabase Auth yang perlu refactor (jika pakai Supabase Auth).

**Q: Bisakah migrasi data dari SQLite lokal ke Supabase?**
A: Ya, dengan `pgloader` atau dump CSV → import via Supabase Dashboard. Atau pakai script custom:
```bash
bunx prisma db pull   # ambil schema dari SQLite
bunx prisma db push   # push ke PostgreSQL
# Untuk data, pakai script migration manual atau csv export/import
```

**Q: Berapa batas free tier Supabase?**
A: 500MB database, 1GB storage, 50,000 monthly active users (auth), 2GB bandwidth. Cukup untuk portofolio/angkatan.

---

## Ringkasan Files Supabase di Proyek Ini

| File | Kegunaan |
|------|----------|
| `.env.example` | Template semua env vars (DB + Supabase + Auth) |
| `prisma/schema.prisma` | Skema 17 model (SQLite default, bisa switch PostgreSQL) |
| `src/lib/supabase-browser.ts` | Client-side Supabase (untuk 'use client' components) |
| `src/lib/supabase-server.ts` | Server-side Supabase (untuk Server Components & Route Handlers) |
| `src/lib/supabase-types.ts` | Type definitions (replace dengan auto-generated types) |
| `src/app/auth/callback/route.ts` | OAuth callback handler |
| `src/lib/session.ts` | Custom cookie session (fallback, masih dipakai) |

---

Terakhir diperbarui: 2025-2026 • Statistika '25 Untirta • Lisensi Apache 2.0
