# 🚀 SETUP RUNBOOK — Statistika '25 Untirta Profile

Panduan lengkap end-to-end untuk setup database, storage, dan auth dari awal hingga akhir. 10 tahap, ± 30 menit total.

---

## Daftar Isi

- [Tahap 1: Buat Supabase Project](#tahap-1--buat-supabase-project-2-menit)
- [Tahap 2: Ambil API Credentials](#tahap-2--ambil-api-credentials-2-menit)
- [Tahap 3: Konfigurasi .env](#tahap-3--konfigurasi-env-2-menit)
- [Tahap 4: Run Setup Script (otomatis)](#tahap-4--run-setup-script-otomatis-2-menit)
- [Tahap 5: Run SQL Files (RLS + Storage)](#tahap-5--run-sql-files-rls--storage-5-menit)
- [Tahap 6: Konfigurasi OAuth Providers](#tahap-6--konfigurasi-oauth-providers-10-menit)
- [Tahap 7: Set Admin User](#tahap-7--set-admin-user-2-menit)
- [Tahap 8: Verifikasi Setup](#tahap-8--verifikasi-setup-1-menit)
- [Tahap 9: Deploy ke Vercel](#tahap-9--deploy-ke-vercel-5-menit)
- [Tahap 10: Post-Deploy Checklist](#tahap-10--post-deploy-checklist-5-menit)
- [Alternative: Local SQLite Mode](#alternative--local-sqlite-mode-no-supabase)

---

## Tahap 1 — Buat Supabase Project (2 menit)

1. Buka https://supabase.com dan klik **Sign In** (atau Sign Up dengan GitHub)
2. Klik **New Project**
3. Isi form:
   - **Name**: `statistika-25-untirta` (atau bebas)
   - **Database Password**: generate password kuat → **SIMPAN di password manager**
     - Generate: `bun -e "console.log(require('crypto').randomBytes(16).toString('hex'))"`
   - **Region**: `Southeast Asia (Singapore)` ← paling dekat Indonesia
   - **Pricing Plan**: `Free` (cukup untuk portofolio)
4. Klik **Create new project**, tunggu ± 2 menit hingga status = `Ready`

**Hasil**: Project Supabase aktif dengan PostgreSQL managed + Auth + Storage.

---

## Tahap 2 — Ambil API Credentials (2 menit)

1. Buka Supabase Dashboard → **Project Settings** (gear icon kiri bawah)
2. Buka tab **API**
3. Salin 3 values berikut:

| Nama | Nilai (format) | Untuk apa |
|------|----------------|-----------|
| **Project URL** | `https://[PROJECT_REF].supabase.co` | URL basis API |
| **anon public** key | `eyJhbGciOi...` (panjang, JWT) | Untuk browser (RLS-protected, aman di-expose) |
| **service_role** key | `eyJhbGciOi...` (panjang, JWT) | **SERVER-ONLY**, bypass RLS |

4. Buka tab **Database** (di sidebar kiri)
5. Di section **Connection string**, pilih mode **Transaction** (pooler) — port 6543

> ⚠️ **CRITICAL — IPv6 + Pooler Mode Issue**: Supabase free tier has 3 connection options. Use the right one for each env var:
>
> | Var | URL | Port | Why |
> |-----|-----|------|-----|
> | `DATABASE_URL` | `aws-0-REGION.pooler.supabase.com` | 6543 | Transaction mode pooler — IPv4 OK, for app runtime |
> | `DIRECT_URL` | `aws-0-REGION.pooler.supabase.com` | **5432** | **Session mode pooler** — IPv4 OK, for Prisma migrations |
>
> ⚠️ DO NOT use:
> - `db.PROJECT_REF.supabase.co:5432` (Direct connection — IPv6-only, fails in Indonesia with P1001)
> - `aws-0-REGION.pooler.supabase.com:6543` for DIRECT_URL (Transaction mode doesn't support Prisma migrations — will HANG on db:push)

6. Salin 2 URLs dari Dashboard (atau modify 1 URL dengan ganti port):

| Var | URL yang dipakai | Port | Untuk apa |
|-----|------------------|------|-----------|
| `DATABASE_URL` | **Connection pooling → Transaction mode** | 6543 | App runtime (Supavisor transaction pooler) |
| `DIRECT_URL` | **Connection pooling → Session mode** | 5432 | Prisma migrations (db:push, db:migrate) — IPv4 + full features |

> ⚠️ Ganti `[PASS]` dengan password yang Anda buat di Tahap 1.

**Hasil**: 5 credentials siap untuk dimasukkan ke `.env`.

---

## Tahap 3 — Konfigurasi .env (2 menit)

1. Clone repo + masuk folder:
   ```bash
   git clone https://github.com/raynzz455/Statistika-Untirta-Profile-2025.git
   cd Statistika-Untirta-Profile-2025
   ```

2. Copy template env:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` dengan credentials dari Tahap 2:

   ```bash
   # 1. DATABASE (from Supabase → Project Settings → Database → Connection string)
   DATABASE_URL="postgresql://postgres.[REF]:[PASS]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
   DIRECT_URL="postgresql://postgres.[REF]:[PASS]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

   # 2. SESSION SECRET (generate new)
   SESSION_SECRET="REPLACE_WITH_32_PLUS_CHAR_RANDOM_HEX_STRING"
   # Generate: bun -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

   # 3. SUPABASE (from Supabase → Project Settings → API)
   NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_REF].supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOi...[ANON_KEY]"
   SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi...[SERVICE_ROLE_KEY]"

   # 4. APP METADATA
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   NEXT_PUBLIC_APP_NAME="Statistika '25 — Profil Angkatan Untirta"
   NODE_ENV="development"
   ```

4. Generate SESSION_SECRET yang kuat:
   ```bash
   bun -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   # Copy output, paste into .env as SESSION_SECRET
   ```

**Hasil**: File `.env` lengkap dengan 6 credentials. Tidak akan di-commit ke git (sudah di-gitignore).

---

## Tahap 4 — Run Setup Script (otomatis, 2 menit)

Script ini otomatis: install deps, push schema, seed data, dan print commands untuk tahap selanjutnya.

```bash
bash scripts/setup.sh
```

**Yang dilakukan script:**

| Stage | Action | Output |
|-------|--------|--------|
| 0 | Cek prerequisites (bun, .env) | ✓ |
| 1 | Validasi 6 env vars | ✓ (atau error) |
| 2 | `bun install` | installs deps |
| 3 | `bun run db:generate` | generates Prisma client |
| 4 | `bun run db:push` | creates 18 tables in Supabase |
| 5 | `bun run db:seed` | seeds 49 records |
| 6 | Print SQL Editor URLs + which files to run | (manual step) |
| 7 | Print OAuth config instructions | (manual step) |
| 8 | Print admin setup SQL | (manual step) |
| 9 | Print verify commands | (manual step) |
| 10 | Print Vercel deploy commands | (manual step) |

**Skip seed** (jika ingin data kosong):
```bash
bash scripts/setup.sh --skip-seed
```

**Verify only** (tidak modify apa-apa, hanya cek status):
```bash
bash scripts/setup.sh --verify-only
```

**Hasil**: 18 tabel + 49 records ada di Supabase PostgreSQL. Tinggal jalankan SQL files (Tahap 5).

---

## Tahap 5 — Run SQL Files (RLS + Storage, 5 menit)

Script `setup.sh` sudah membuat schema tabel via Prisma `db:push`. Tahap ini hanya untuk:
1. **RLS policies** — security (WAJIB)
2. **Storage bucket** — untuk upload foto

### 5.1 — Buka Supabase SQL Editor

1. Buka https://supabase.com/dashboard/`[PROJECT_REF]`/sql/new
2. Atau klik **SQL Editor** di sidebar Supabase Dashboard

### 5.2 — Run RLS Policies (WAJIB)

1. Buka file `supabase/rls-policies.sql` di editor lokal, copy semua isi
2. Paste ke Supabase SQL Editor
3. Klik **Run** (Ctrl+Enter)
4. Expected output: `Success. No rows returned.` (itulah yang diharapkan)

**Yang dilakukan SQL ini:**
- Enable RLS di semua 18 tabel
- Buat helper function `is_admin()` dan `is_owner()`
- Buat ~30 policies (public read, owner manage, admin full)

### 5.3 — Run Storage Policies (untuk upload foto)

1. Buka file `supabase/storage-policies.sql`, copy semua
2. Paste ke Supabase SQL Editor
3. Klik **Run**

**Yang dilakukan SQL ini:**
- Buat bucket `mahasiswa-photos` (private, 5MB limit)
- Whitelist MIME types: JPG, PNG, GIF, WebP, SVG
- Buat storage policies (users manage own folder, admin full access)

### 5.4 — (Alternative) Run Full Schema via SQL

Jika Anda tidak ingin pakai Prisma `db:push`, Anda bisa buat semua tabel via SQL:
1. Open `supabase/schema.sql`
2. Paste ke SQL Editor → Run
3. Skip Tahap 4 (db:push sudah tidak perlu)

Tapi setelah itu tetap perlu run Tahap 5.2 + 5.3.

**Hasil**: RLS aktif di semua tabel + Storage bucket siap pakai.

---

## Tahap 6 — Konfigurasi OAuth Providers (10 menit)

### 6.1 — Set Site URL + Redirect URLs

1. Buka Supabase Dashboard → **Authentication** → **URL Configuration**
2. Set **Site URL**:
   - Dev: `http://localhost:3000`
   - Prod: `https://[your-vercel-domain].vercel.app`
3. Tambah **Redirect URLs** (klik Add URL):
   - `http://localhost:3000/auth/callback`
   - `https://[your-vercel-domain].vercel.app/auth/callback`
   - `https://[your-vercel-domain]-*.vercel.app/auth/callback` (untuk preview deploys)
4. Klik **Save**

### 6.2 — Enable Google OAuth

**Di Google Cloud Console:**
1. Buka https://console.cloud.google.com
2. Buat project baru (atau pakai existing) → misal `Statistika25 OAuth`
3. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**
4. Application type: **Web application**
5. Authorized JavaScript origins:
   - `http://localhost:3000`
   - `https://[your-vercel-domain].vercel.app`
6. Authorized redirect URIs:
   ```
   https://[PROJECT_REF].supabase.co/auth/v1/callback
   ```
7. Klik **Create** → salin **Client ID** + **Client Secret**

**Di Supabase Dashboard:**
1. Buka **Authentication** → **Providers** → **Google**
2. Toggle **Enable** = ON
3. Paste **Client ID** + **Client Secret**
4. Klik **Save**

### 6.3 — Enable GitHub OAuth

**Di GitHub:**
1. Buka https://github.com/settings/developers
2. **OAuth Apps** → **New OAuth App**
3. Isi:
   - Application name: `Statistika '25 Untirta (Dev)`
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL:
     ```
     https://[PROJECT_REF].supabase.co/auth/v1/callback
     ```
4. Klik **Register application**
5. Generate client secret → salin **Client ID** + **Client Secret**

**Di Supabase Dashboard:**
1. **Authentication** → **Providers** → **GitHub**
2. Toggle **Enable** = ON
3. Paste **Client ID** + **Client Secret**
4. Klik **Save**

### 6.4 — Test OAuth Flow (optional)

1. Start dev server: `bun run dev`
2. Buka http://localhost:3000/#/login
3. Klik tombol "Masuk dengan Google" / "Masuk dengan GitHub"
4. OAuth flow: Google/GitHub consent → balik ke `/auth/callback` → redirect ke home
5. Anda sudah logged in!

**Hasil**: Login via Google/GitHub berfungsi. User otomatis terdaftar di `auth.users` + `profiles`.

---

## Tahap 7 — Set Admin User (2 menit)

Setelah user pertama signup via OAuth (Tahap 6.4), user tersebut masih role = `user`. Naikkan ke `admin`:

### 7.1 — Find User ID

1. Buka Supabase SQL Editor
2. Run file `scripts/set-admin.sql` (atau copy-paste baris ini):

```sql
SELECT id, email, created_at, raw_user_meta_data->>'full_name' AS full_name
FROM auth.users
ORDER BY created_at DESC;
```

3. Copy **id** (UUID format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### 7.2 — Set as Admin

1. Edit query, replace `PASTE_USER_UUID_HERE` dengan UUID Anda:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE id = 'PASTE_USER_UUID_HERE';
```

2. Klik **Run**

### 7.3 — Verify

```sql
SELECT id, email, role FROM public.profiles WHERE role = 'admin';
```

Expected: 1 row dengan email Anda, role = `admin`.

**Hasil**: User pertama adalah admin → bisa kelola semua (artikel, dosen, aspirasi, export, dll).

---

## Tahap 8 — Verifikasi Setup (1 menit)

```bash
bun run scripts/verify-setup.ts
```

**Yang dicek:**

| Check | Status | Pesan |
|-------|--------|-------|
| Env vars | ✓ / ✗ | 6 required vars set dengan nilai real |
| DB connection | ✓ / ✗ | Koneksi ke PostgreSQL berhasil |
| Tables (18) | ✓ / ✗ | Semua tabel queryable |
| Seed data (8 kategori) | ✓ / ⚠ | Records ≥ expected minimum |
| Supabase Auth | ✓ / ⚠ | Auth service reachable |
| OAuth providers | ✓ / ⚠ | Enabled providers count |
| Storage bucket | ✓ / ✗ | `mahasiswa-photos` bucket exists |
| RLS policies | ✓ / ⚠ | Tables with RLS enabled count |

**Expected output:**
```
✓ Pass: 8    ⚠ Warn: 0    ✗ Fail: 0
✅ All checks passed — setup is complete and ready for production
```

---

## Tahap 9 — Deploy ke Vercel (5 menit)

### 9.1 — Push ke GitHub (jika belum)

```bash
git add .
git commit -m "feat: setup complete"
git push origin main
```

### 9.2 — Import di Vercel

1. Buka https://vercel.com/new
2. Klik **Import** di repo `raynzz455/Statistika-Untirta-Profile-2025`
3. Framework Preset: **Next.js** (auto-detect)
4. Build Command: `bun run build` (auto)
5. Output Directory: `.next` (auto)
6. Klik **Deploy**

### 9.3 — Set Environment Variables

Di Vercel → Project Settings → **Environment Variables**, tambahkan 8 vars:

| Variable | Value | Scope |
|----------|-------|-------|
| `DATABASE_URL` | (sama seperti .env lokal) | Production + Preview |
| `DIRECT_URL` | (sama seperti .env lokal) | Production + Preview |
| `SESSION_SECRET` | (sama seperti .env lokal) | Production + Preview |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://[PROJECT_REF].supabase.co` | All environments |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGc...` | All environments |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGc...` | Production + Preview |
| `NEXT_PUBLIC_APP_URL` | `https://[your-app].vercel.app` | All environments |
| `NODE_ENV` | `production` | Production |

> ⚠️ **CRITICAL**: Variabel tanpa prefix `NEXT_PUBLIC_` (seperti `SUPABASE_SERVICE_ROLE_KEY`, `SESSION_SECRET`) **TIDAK BOLEH** diberi prefix `NEXT_PUBLIC_` — kalau dikasih, akan ter-bundle ke browser dan bocor.

### 9.4 — Update Supabase Redirect URLs

1. Buka Supabase Dashboard → Authentication → URL Configuration
2. Tambah domain Vercel ke Redirect URLs:
   - `https://[your-app].vercel.app/auth/callback`
3. Set Site URL = `https://[your-app].vercel.app`

### 9.5 — Redeploy

1. Buka Vercel → Deployments → latest → **Redeploy**

**Hasil**: Aplikasi live di domain Vercel, koneksi ke Supabase production.

---

## Tahap 10 — Post-Deploy Checklist (5 menit)

Hapus checklist setelah selesai:

### Smoke Tests
- [ ] Buka domain Vercel → home page render OK
- [ ] Login via Google → redirect back, user ter-authenticated
- [ ] Login via GitHub → redirect back, user ter-authenticated
- [ ] Logout → session cleared
- [ ] Buka /#/directory → 12 students visible
- [ ] Buka /#/aspirasi → 20 aspirasi visible + word cloud
- [ ] Buka /#/classes → 2 kelas (A, B) dengan 6 anggota masing-masing
- [ ] Buka /#/dosen → 3 dosen (Dr. Budi/Siti/Ahmad)
- [ ] Login sebagai admin → tombol "Admin" muncul di navbar
- [ ] Admin dapat: delete aspirasi, edit dosen, export CSV

### Security
- [ ] Buka DevTools → Console → tidak ada error CSP
- [ ] Buka DevTools → Application → Cookies → lihat `stat_session` → `httpOnly: true`
- [ ] Curl test: `curl -I https://[domain]` → ada header `Strict-Transport-Security`
- [ ] Curl test: `curl -I https://[domain]` → ada header `Content-Security-Policy`

### Performance
- [ ] Vercel Analytics enabled (Project → Analytics tab)
- [ ] Vercel Speed Insights enabled (Project → Speed Insights tab)

### Backup & Monitoring
- [ ] Supabase Dashboard → Database → Backups → first backup completed
- [ ] Supabase Dashboard → Authentication → Logs → cek aktivitas signup/login
- [ ] (Optional) Setup Sentry untuk error tracking

### Ongoing
- [ ] Set reminder: rotate `SESSION_SECRET` tiap 90 hari
- [ ] Enable Dependabot di repo GitHub
- [ ] Set Vercel Firewalls: rate limit 100 req/10s per IP

---

## Alternative — Local SQLite Mode (No Supabase)

Untuk development tanpa Supabase (e.g. offline, no internet):

### Switch Prisma ke SQLite

1. Edit `prisma/schema.prisma`:
   ```prisma
   datasource db {
     // === LOCAL DEV (SQLite) ===
     provider = "sqlite"
     url      = env("DATABASE_URL")

     // Comment out PostgreSQL config
     // provider   = "postgresql"
     // url        = env("DATABASE_URL")
     // directUrl  = env("DIRECT_URL")
   }
   ```

2. Edit `.env`:
   ```bash
   DATABASE_URL="file:./db/custom.db"
   # Kosongkan DIRECT_URL, NEXT_PUBLIC_SUPABASE_URL, dll
   ```

3. Run setup:
   ```bash
   bun run db:push
   bun run db:seed
   bun run dev
   ```

### Limitations SQLite mode

| Fitur | SQLite | Supabase |
|-------|--------|----------|
| Tables | ✓ (all 18) | ✓ |
| Auth | Custom session.ts (SHA-256) | Supabase Auth (OAuth, magic link, RLS) |
| Storage | Local /public/uploads/ (ephemeral di Vercel) | Supabase Storage (persistent, signed URLs) |
| RLS | Tidak ada (app-level only) | ✓ built-in di PostgreSQL |
| Realtime | Tidak ada | ✓ Supabase Realtime |
| Scaling | Single process | Auto-scale via Supabase pooler |

> SQLite OK untuk dev, tapi **tidak bisa deploy ke Vercel** (filesystem ephemeral). Untuk deploy, gunakan Supabase.

---

## Troubleshooting

### Error: "P1001: Can't reach database server"

**Most common cause (90% of cases): IPv6 issue**

Supabase free tier direct connection (port 5432 at `db.PROJECT_REF.supabase.co`) is IPv6-only in some regions (including Southeast Asia Singapore). Indonesian ISPs generally don't support IPv6 → connection fails.

**Fix**: Use the POOLER hostname (`aws-0-REGION.pooler.supabase.com`) for BOTH env vars — it supports IPv4.

```bash
# Wrong (causes P1001 in Indonesia — uses direct IPv6-only URL):
DATABASE_URL="postgresql://...@db.PROJECT_REF.supabase.co:5432/postgres"
DIRECT_URL="postgresql://...@db.PROJECT_REF.supabase.co:5432/postgres"

# Correct (uses pooler — IPv4 + IPv6 support):
DATABASE_URL="postgresql://...@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"  # Transaction mode (app)
DIRECT_URL="postgresql://...@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"     # Session mode (migrations)
```

### Error: db:push HANGS (no output, no error)

**Most common cause: Wrong port for DIRECT_URL**

Supabase pooler has TWO modes at the same hostname — different PORT:
- Port 6543 = Transaction mode (limited features, doesn't support Prisma migrations)
- Port 5432 = Session mode (full features, supports Prisma migrations)

If `DIRECT_URL` uses port 6543 (transaction mode), Prisma can connect but `db:push` will HANG because transaction mode doesn't support the SQL features Prisma needs.

**Fix**: Use port 5432 for DIRECT_URL (Session mode pooler):

```bash
# Wrong (causes hang — transaction mode doesn't support migrations):
DATABASE_URL="postgresql://...@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://...@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"  # ← WRONG PORT

# Correct (DIRECT_URL uses Session mode port 5432):
DATABASE_URL="postgresql://...@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"  # Transaction (app runtime)
DIRECT_URL="postgresql://...@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"     # Session (migrations)
```

Test connectivity (PowerShell):
```powershell
Test-NetConnection -ComputerName aws-0-ap-southeast-1.pooler.supabase.com -Port 5432
# Expected: TcpTestSucceeded: True
```

**Other causes:**
- Cek password di URL → encode URL special chars (e.g. `@` → `%40`)
- Cek project region (Dashboard → Settings → General). Kalau bukan Singapore, ganti `ap-southeast-1` di URL pooler
- Cek apakah project Supabase paused (free tier auto-pause after 1 week idle)
  - Dashboard → Overview → kalau "Paused", klik "Restore project"

### Error: "P3009: Migration failed"
- Reset database: `bun run db:reset` (WARNING: hapus semua data)
- Atau: di Supabase SQL Editor, run `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` lalu ulang `db:push`

### Error: "supabaseUrl is required"
- Cek `.env` → `NEXT_PUBLIC_SUPABASE_URL` terisi
- Restart dev server setelah edit `.env`
- Atau set via Vercel env vars

### OAuth: "redirect_uri_mismatch"
- Cek **Redirect URLs** di Supabase Dashboard → Authentication → URL Configuration
- Tambah: `http://localhost:3000/auth/callback` (dev) + domain Vercel (prod)

### RLS blocks everything (semua query return empty)
- Run `supabase/rls-policies.sql` di SQL Editor (Tahap 5.2)
- Atau temporary disable: `ALTER TABLE [nama] DISABLE ROW LEVEL SECURITY;`

---

## Quick Reference

| File | Fungsi |
|------|--------|
| `scripts/setup.sh` | Automation: install + db:push + seed + print commands |
| `scripts/verify-setup.ts` | Verifikasi: 7 checks (env, db, tables, seed, auth, storage, RLS) |
| `scripts/set-admin.sql` | SQL: lihat users + set admin role |
| `supabase/schema.sql` | SQL: 17 tabel + triggers + indexes |
| `supabase/rls-policies.sql` | SQL: RLS untuk semua tabel |
| `supabase/storage-policies.sql` | SQL: storage bucket + policies |
| `SECURITY_AUDIT.md` | Audit keamanan + mitigasi |
| `.env.example` | Template env vars |

## External Resources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth Next.js Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Vercel Deploy Next.js](https://vercel.com/docs/frameworks/nextjs)
- [Prisma PostgreSQL Guide](https://www.prisma.io/docs/concepts/database-connectors/postgresql)

---

**Lisensi**: Apache 2.0 — lihat [LICENSE](./LICENSE)
**Author**: Raynaldi &lt;raynss455x@gmail.com&gt;
