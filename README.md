# Statistika '25 — Profil Angkatan Untirta

> Website profil angkatan Statistika 2025 — Universitas Sultan Ageng Tirtayasa.
> Dibangun dengan Next.js 16, React 19, TypeScript, Tailwind CSS 4, dan Prisma ORM.

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-149eca.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8.svg)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2d3748.svg)](https://www.prisma.io/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth+DB-3FCF8E.svg)](https://supabase.com/)
[![Bun](https://img.shields.io/badge/Bun-runtime-fbf0df.svg)](https://bun.sh/)

---

## Daftar Isi

- [Tentang Proyek](#tentang-proyek)
- [Fitur Utama](#fitur-utama)
- [Teknologi yang Digunakan](#teknologi-yang-digunakan)
- [Struktur Proyek](#struktur-proyek)
- [Prasyarat Sistem](#prasyarat-sistem)
- [Instalasi & Setup](#instalasi--setup)
- [Variabel Lingkungan](#variabel-lingkungan)
- [Basis Data](#basis-data)
- [Autentikasi](#autentikasi)
- [Endpoint API](#endpoint-api)
- [Perintah Pengembangan](#perintah-pengembangan)
- [Akun Demo](#akun-demo)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [Kontribusi](#kontribusi)
- [Lisensi](#lisensi)

---

## Tentang Proyek

**Statistika '25** adalah situs web profil angkatan untuk Program Studi Statistika, Fakultas Teknik, Universitas Sultan Ageng Tirtayasa (UNTIRTA) — kampus Cilegon. Dibangun dengan estetika **retro newspaper / editorial** (warna navy + burnt orange + aged paper), mengadopsi tipografi serif Playfair Display + Bebas Neue + Lora + IBM Plex Mono.

Aplikasi ini berperan sebagai:
- **Direktori mahasiswa** angkatan 2025 (foto, nama, lagu tema, panggilan)
- **Publikasi artikel & berita angkatan** dengan rich-text editor
- **Galeri dokumentasi** kegiatan (Ospek, Makrab, Kuliah Tamu, dll)
- **Manajemen event & RSVP** untuk acara angkatan
- **Aspirasi mahasiswa** — word cloud dari suara mahasiswa (tanpa login, cukup nama)
- **Halaman dosen** — profil Kaprodi & dosen pengajar
- **Sistem autentikasi** dengan 2 peran (admin & user) + OAuth social login via Supabase
- **Notifikasi, komentar, like, bookmark, follow** antar anggota

## Fitur Utama

| Kategori | Fitur |
|----------|-------|
| **Autentikasi** | Custom cookie session (SHA-256) + Supabase Auth (OAuth Google/GitHub, magic link), sesi 7 hari, 2 peran (`admin`, `user`) |
| **Direktori** | Grid mahasiswa + filter angkatan & kelas, badge nama panggilan, music player per profil |
| **Rotasi Kelas** | Tabel rotasi kelas A/B per semester, info rotasi semester 3 & 5 |
| **Artikel** | Rich-text editor (MDX), kategori, tag, series, komentar, like, bookmark |
| **Galeri** | Grid foto + modal pop-up + lightbox fullscreen + filter kategori |
| **Event** | Kalender event + RSVP + pengulangan (harian/mingguan/bulanan) |
| **Aspirasi** | Word cloud otomatis (tokenize + stopwords ID), form anonim (cukup nama), kategori 5 topik |
| **Dosen** | Profil Kaprodi + daftar dosen + bidang keahlian + mata kuliah |
| **Notifikasi** | Real-time notification bell untuk like, comment, follow, RSVP |
| **Search** | Pencarian global lintas entitas (mahasiswa, artikel, event, galeri) |
| **Tema** | Light / Dark / System mode via `next-themes` |
| **Aksesibilitas** | Semantic HTML, ARIA labels, keyboard navigation, focus-visible ring |

## Teknologi yang Digunakan

### Core Stack
- **[Next.js 16.1.3](https://nextjs.org/)** — React framework (App Router, Turbopack)
- **[React 19.0.0](https://react.dev/)** — UI library
- **[TypeScript 5](https://www.typescriptlang.org/)** — type safety
- **[Tailwind CSS 4](https://tailwindcss.com/)** — utility-first styling
- **[shadcn/ui (New York)](https://ui.shadcn.com/)** — component library (Radix UI primitives)
- **[Prisma 6.11.1](https://www.prisma.io/)** — ORM (SQLite local, PostgreSQL production-ready via Supabase)

### Backend & Database
- **[Supabase](https://supabase.com/)** — PostgreSQL managed + Auth (OAuth, magic link, RLS) + Storage + Realtime
- **[@supabase/ssr 0.12.7](https://github.com/supabase/supabase-js)** — server-side auth helpers for Next.js App Router
- **[Bun 1.3+](https://bun.sh/)** — runtime & package manager
- **[Sharp](https://sharp.pixelplumbing.com/)** — image processing (resize, optimize)
- **[Zod](https://zod.dev/)** — schema validation

### State & Data
- **[Zustand 5](https://github.com/pmndrs/zustand)** — client state management (URL hash-synced routing)
- **[TanStack Query 5](https://tanstack.com/query)** — server state (caching, mutations)
- **[TanStack Table 8](https://tanstack.com/table)** — table virtualization (Rotasi Kelas 30+ mahasiswa)

### UI / UX
- **[Framer Motion 12](https://www.framer.com/motion/)** — animations & transitions
- **[Lucide React](https://lucide.dev/)** — icon system
- **[next-themes](https://github.com/pacocoursey/next-themes)** — dark mode
- **[Sonner](https://sonner.emilkowal.ski/)** — toast notifications
- **[cmdk](https://cmdk.paco.me/)** — command palette
- **[Embla Carousel](https://www.embla-carousel.com/)** — image carousels

### Editor & Visualisasi
- **[@mdxeditor/editor](https://mdxeditor.com/)** — rich-text editor untuk artikel
- **[Recharts 2.15](https://recharts.org/)** — chart untuk analytics (scatter, line, bar)
- **[react-syntax-highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter)** — code blocks
- **[react-markdown](https://github.com/remarkjs/react-markdown)** — markdown rendering

### Fonts (Google Fonts)
- **Playfair Display** — headline serif (weight 700)
- **Bebas Neue** — nav & label condensed (weight 400, no forced bold)
- **Lora** — body text serif
- **IBM Plex Mono** — metadata & tanggal (typewriter retro)

### AI Capabilities (via z-ai-web-dev-sdk)
- **LLM** — chatbot, content generation
- **VLM** — image understanding, OCR
- **TTS** — text-to-speech
- **ASR** — speech-to-text
- **Image Generation** — custom poster/image creation
- **Web Search & Page Reader** — real-time info retrieval

## Struktur Proyek

```
statistika-untirta-profile-2025/
├── prisma/
│   ├── schema.prisma          # Skema database (17 model)
│   └── seed.ts                # Seed data (3 user, 12 mhs, 20 aspirasi, 3 dosen)
├── public/                    # Static assets (logo, robots.txt, uploads)
├── src/
│   ├── app/
│   │   ├── api/               # Route handlers (REST API)
│   │   │   ├── aspirasi/      # GET/POST aspirasi + [id] DELETE
│   │   │   ├── articles/      # CRUD artikel + [id] + like/comment/bookmark
│   │   │   ├── auth/         # /me, /login, /logout (custom session)
│   │   │   ├── dosen/         # CRUD dosen
│   │   │   ├── events/        # CRUD event + RSVP
│   │   │   ├── gallery/       # CRUD galeri
│   │   │   ├── students/      # CRUD mahasiswa
│   │   │   ├── notifications/ # List & mark-read
│   │   │   ├── search/        # Global search
│   │   │   ├── series/        # Article series CRUD
│   │   │   ├── stats/         # Dashboard analytics
│   │   │   ├── tags/          # Tag CRUD
│   │   │   ├── users/         # User management (admin)
│   │   │   ├── activity/      # Activity feed
│   │   │   ├── analytics/     # Visit & engagement tracking
│   │   │   ├── bookmarks/     # User bookmarks
│   │   │   ├── leaderboard/   # Top contributors
│   │   │   ├── recommendations/ # Content recommendations
│   │   │   └── export/        # CSV/Excel export (admin)
│   │   ├── auth/
│   │   │   └── callback/      # OAuth callback handler (Supabase)
│   │   ├── globals.css        # Design system (warna, tipografi, animasi)
│   │   ├── layout.tsx         # Root layout (font loader, metadata)
│   │   └── page.tsx           # Single-page router (hash-synced)
│   ├── components/
│   │   ├── ui/                # shadcn/ui primitives (40+ komponen)
│   │   ├── views/             # Page-level views (HomeView, DirectoryView, dll)
│   │   ├── Header.tsx         # Navbar + stats bar + search overlay
│   │   ├── Footer.tsx         # Footer + newsletter
│   │   ├── MusicPlayer.tsx    # HTML5 audio player (lagu tema mahasiswa)
│   │   ├── OpeningAnimation.tsx # Scatter-plot intro (5-menit session)
│   │   ├── NotificationBell.tsx # Real-time notif dropdown
│   │   ├── BackToTop.tsx
│   │   ├── ThemeToggle.tsx    # Light/Dark/System
│   │   └── PlaceholderImage.tsx # Fallback image renderer
│   └── lib/
│       ├── db.ts              # Prisma client singleton
│       ├── session.ts        # Custom cookie session utils (sign/verify/get/set)
│       ├── supabase-browser.ts # Supabase browser client (@supabase/ssr)
│       ├── supabase-server.ts # Supabase server client (RLS-aware + admin)
│       ├── supabase-types.ts  # TypeScript types for Supabase schema
│       ├── store.ts          # Zustand store (view, user, introSeen, tagFilter)
│       ├── utils.ts          # cn() class merge helper
│       └── supabase-setup.md # Legacy migration guide (now superseded by SUPABASE_SETUP.md)
├── SUPABASE_SETUP.md          # Panduan lengkap setup Supabase (DB + Auth + OAuth)
├── .env.example               # Template semua env vars
├── .gitignore
├── package.json
├── tsconfig.json
├── eslint.config.mjs
├── tailwind.config.ts
├── postcss.config.mjs
├── next.config.ts
├── components.json            # shadcn/ui config
└── README.md
```

## Prasyarat Sistem

Pastikan sistem Anda memiliki:

- **Node.js** ≥ 20.0.0 (rekomendasi: v24+)
- **Bun** ≥ 1.3.0 ([instalasi](https://bun.sh/docs/installation))
- **Git** (untuk cloning & versioning)
- **OS**: Linux/macOS/Windows (WSL direkomendasikan untuk Windows)

## Instalasi & Setup

```bash
# 1. Clone repository
git clone https://github.com/raynzz455/Statistika-Untirta-Profile-2025.git
cd Statistika-Untirta-Profile-2025

# 2. Install dependencies (gunakan bun untuk performa terbaik)
bun install

# 3. Salin template env dan sesuaikan
cp .env.example .env
# Edit .env, isi DATABASE_URL dan SESSION_SECRET
# Untuk Supabase (production): isi juga NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, dll.

# 4. Generate Prisma client
bun run db:generate

# 5. Push skema ke database (membuat tabel)
bun run db:push

# 6. Jalankan seed data
bun run db:seed

# 7. Jalankan dev server
bun run dev
```

Buka `http://localhost:3000` di browser. Selesai!

## Variabel Lingkungan

Buat file `.env` di root proyek. Lihat `.env.example` untuk template lengkap.

| Variabel | Wajib | Deskripsi | Contoh |
|----------|:-----:|-----------|--------|
| `DATABASE_URL` | ✅ | Connection string database | `file:./db/custom.db` (SQLite) atau `postgresql://user:pass@host:5432/db` (Supabase) |
| `SESSION_SECRET` | ✅ | Secret key untuk signing session cookie | string acak 32+ karakter |
| `DIRECT_URL` | ⚠️ | Direct connection string (Supabase connection pooler, untuk migration) | `postgresql://...` |
| `NEXT_PUBLIC_SUPABASE_URL` | ⚠️ | Supabase project URL (untuk Supabase Auth) | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ⚠️ | Supabase anon public key (safe for browser) | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | ⚠️ | Supabase service role key (server-only, NEVER expose!) | `eyJhbGciOi...` |
| `NEXT_PUBLIC_APP_URL` | — | Public-facing site URL (untuk OAuth redirects) | `http://localhost:3000` |
| `NODE_ENV` | — | Environment mode | `development` \| `production` |

> ⚠️ **Jangan pernah commit file `.env` ke repository!** File ini sudah ada di `.gitignore`.

## Basis Data

Skema Prisma memiliki **17 model**:

| Model | Deskripsi |
|-------|-----------|
| `User` | Akun login (admin/user), passwordHash SHA-256 |
| `Student` | Profil mahasiswa (nim, kelas A/B, angkatan, nickname, lagu tema) |
| `Article` | Artikel/berita dengan MDX content, kategori, tags, series |
| `Series` | Kumpulan artikel (seri editorial) |
| `SeriesItem` | Junction table artikel ↔ series |
| `Dosen` | Profil dosen (Kaprodi/Dosen/Lab) + courses + expertise |
| `Tag` | Tag artikel (warna kustom) |
| `ArticleTag` | Junction table artikel ↔ tag |
| `Event` | Acara dengan start/end date, kategori, recurrence |
| `Gallery` | Foto galeri (caption, kategori, imageUrl) |
| `Rsvp` | RSVP event (hadir/mungkin/tidak) |
| `Comment` | Komentar artikel |
| `Like` | Like artikel (unique constraint per user) |
| `Bookmark` | Bookmark artikel (unique constraint per user) |
| `Follow` | Sistem follow antar user (follower/following) |
| `Notification` | Notifikasi (like/comment/follow/rsvp/bookmark) |
| `Aspirasi` | Aspirasi mahasiswa anonim (name, content, category, approved) |

### Switch Database (SQLite → Supabase PostgreSQL)

Lihat panduan lengkap di **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)**. Ringkasnya:

1. Buat project di [Supabase](https://supabase.com)
2. Settings → Database → ambil connection string (pooler URL)
3. Update `DATABASE_URL` & `DIRECT_URL` di `.env`
4. Edit `prisma/schema.prisma`, ganti `provider = "sqlite"` → `provider = "postgresql"`
5. Jalankan:
   ```bash
   bun run db:push
   bun run db:seed
   ```

## Autentikasi

Proyek ini mendukung **dua mode autentikasi** yang dapat dipakai bersamaan:

### Mode 1: Custom Cookie Session (default, untuk local dev)
- File: `src/lib/session.ts`
- Mekanisme: SHA-256 + base64 signed cookies, 7-day expiry, httpOnly
- Cocok untuk: development tanpa setup Supabase
- Test credentials: admin/admin, user/user, fauzi/fauzi

### Mode 2: Supabase Auth (rekomendasi untuk production)
- Files: `src/lib/supabase-browser.ts`, `src/lib/supabase-server.ts`, `src/app/auth/callback/route.ts`
- Mekanisme: JWT-based session, auto-refresh, RLS-aware
- Provider OAuth built-in:
  - ✅ Google
  - ✅ GitHub
  - ✅ Apple
  - ✅ Discord
  - ✅ Magic link (email)
  - ✅ Phone OTP
  - ✅ Anonymous sign-in
- Keunggulan: Row-Level Security otomatis di DB level

> **Rekomendasi**: Pakai **Supabase Auth** untuk production karena:
> 1. Integrasi zero-config dengan Supabase DB
> 2. RLS otomatis melindungi setiap row di PostgreSQL level
> 3. OAuth providers built-in (Google, GitHub, dll) tanpa boilerplate
> 4. Free tier 50,000 MAU
>
> NextAuth.js masih ada di dependencies sebagai fallback jika ingin pindah auth provider di masa depan.

Lihat **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** untuk panduan setup OAuth Google & GitHub.

## Endpoint API

Semua endpoint di bawah prefix `/api/` dan return JSON.

### Public (tanpa auth)

| Method | Path | Deskripsi |
|--------|------|-----------|
| `GET` | `/api/articles?limit=N` | List artikel published |
| `GET` | `/api/articles/[id]` | Detail artikel + tags + series |
| `GET` | `/api/events` | List event (recurrence expanded) |
| `GET` | `/api/gallery` | List galeri |
| `GET` | `/api/students` | List mahasiswa + filter |
| `GET` | `/api/dosen` | List dosen |
| `GET` | `/api/aspirasi?category=X` | List aspirasi + stats |
| `POST` | `/api/aspirasi` | Kirim aspirasi baru (cukup nama, no-auth) |
| `GET` | `/api/search?q=...&limit=N` | Global search |
| `GET` | `/api/activity` | Activity feed |
| `GET` | `/api/recommendations` | Rekomendasi konten |
| `GET` | `/api/stats` | Statistik dashboard |
| `GET` | `/api/leaderboard` | Top contributors |

### Authenticated (perlu login)

| Method | Path | Deskripsi |
|--------|------|-----------|
| `POST` | `/api/auth/login` | Login (username + password, custom session) |
| `POST` | `/api/auth/logout` | Logout (clear session) |
| `GET` | `/api/auth/me` | Cek sesi saat ini |
| `POST` | `/api/articles` | Buat artikel (user/admin) |
| `PUT` | `/api/articles/[id]` | Update artikel (pemilik/admin) |
| `DELETE` | `/api/articles/[id]` | Hapus artikel |
| `POST` | `/api/articles/[id]/like` | Like/unlike artikel |
| `POST` | `/api/articles/[id]/bookmark` | Bookmark/unbookmark |
| `POST` | `/api/articles/[id]/comments` | Tambah komentar |
| `GET` | `/api/notifications` | List notifikasi user |
| `POST` | `/api/notifications/[id]/read` | Tandai sudah dibaca |

### Admin Only

| Method | Path | Deskripsi |
|--------|------|-----------|
| `POST` | `/api/dosen` | Tambah dosen |
| `PUT` | `/api/dosen/[id]` | Update dosen |
| `DELETE` | `/api/dosen/[id]` | Hapus dosen |
| `DELETE` | `/api/aspirasi/[id]` | Hapus aspirasi |
| `GET` | `/api/export?type=X` | Export CSV (users/articles/events) |
| `GET` | `/api/users` | List semua user |
| `PUT` | `/api/users/[id]` | Update role user |

### Supabase Auth Endpoints (jika mode Supabase Auth aktif)

| Method | Path | Deskripsi |
|--------|------|-----------|
| `GET` | `/auth/callback` | OAuth callback handler (exchange code for session) |

## Perintah Pengembangan

```bash
# Development
bun run dev            # Start dev server di port 3000 (auto-reload)

# Kualitas kode
bun run lint           # ESLint check (eslint-config-next)

# Database
bun run db:push        # Push skema → DB ( destructive, --accept-data-loss)
bun run db:generate    # Regenerate Prisma Client (jika skema berubah)
bun run db:migrate     # Buat & apply migration (development)
bun run db:reset       # Reset DB & apply semua migration
bun run db:seed        # Isi data seed (3 user, 12 mhs, 20 aspirasi, 3 dosen, dll)

# Production build
bun run build          # next build + copy static + copy public
bun run start          # Start production server (port 3000)
```

## Akun Demo

Setelah `bun run db:seed`, akun berikut tersedia untuk testing (mode custom session):

| Username | Password | Peran | Catatan |
|----------|----------|-------|---------|
| `admin` | `admin` | `admin` | Akses penuh ke Admin Panel, export, kelola semua |
| `user` | `user` | `user` | User biasa, bisa buat artikel & event |
| `fauzi` | `fauzi` | `user` | Member dengan profil mahasiswa ter-link |

> ⚠️ Ganti password semua akun ini di production!
> Untuk Supabase Auth mode, akun dibuat otomatis di `auth.users` saat user sign-up/login via OAuth.

## Deployment

### Opsi 1: Vercel + Supabase (direkomendasikan)
1. Fork repo ini ke akun GitHub Anda
2. Buat project Supabase + setup OAuth (lihat **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)**)
3. Login ke [Vercel](https://vercel.com)
4. Import repo → otomatis detect Next.js
5. Tambahkan env vars: `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SESSION_SECRET`
6. Deploy
7. Update Supabase Dashboard → Authentication → URL Configuration dengan domain Vercel

### Opsi 2: Self-hosted (VPS/Docker)
1. Clone repo di server
2. `bun install`
3. Setup `.env` dengan production DB
4. `bun run build`
5. `bun run start` (atau gunakan PM2 / systemd)
6. Reverse proxy dengan Caddy/Nginx + SSL

## Roadmap

- [ ] Integrasi WebSocket real-time (socket.io mini-service)
- [ ] Mobile app (React Native / PWA)
- [ ] Email digest mingguan untuk aspirasi & event
- [ ] Sentiment analysis untuk aspirasi (positif/netral/negatif)
- [ ] AI assistant berbasis LLM untuk Q&A angkatan
- [ ] Generative poster otomatis untuk event (image generation)
- [ ] Multi-bahasa (ID/EN) via `next-intl`
- [ ] Advanced analytics dashboard (cohorts, retention)
- [ ] Migrasi penuh ke Supabase client (ganti Prisma query → supabase.from())
- [ ] Supabase Storage untuk upload foto (ganti local uploads)

## Kontribusi

Kontribusi sangat dialu-alukan! Untuk berkontribusi:

1. **Fork** repository ini
2. Buat **branch** fitur: `git checkout -b feature/nama-fitur`
3. **Commit** perubahan dengan pesan konvensional: `feat: ...`, `fix: ...`, `docs: ...`
4. Pastikan `bun run lint` lolos tanpa error
5. Buka **Pull Request** ke branch `main`
6. Jelaskan perubahan dengan jelas di PR description

### Aturan Kontribusi
- Gunakan **TypeScript strict** (jangan `any` kecuali sangat perlu)
- Ikuti pola **shadcn/ui** untuk komponen baru
- Tulis **komentar** untuk logika non-trivial
- Jangan tambah dependency baru tanpa justifikasi kuat
- Test manual flow utama sebelum submit PR

## Lisensi

Dilisensikan di bawah **Apache License 2.0** — lihat file [LICENSE](./LICENSE).

Copyright © 2025–2026 Raynaldi & Kontributor Statistika '25 Untirta.

Lisensi ini memperbolehkan:
- ✅ Penggunaan komersial & non-komersial
- ✅ Modifikasi, distribusi, sublicense, dan penjualan
- ✅ Penggunaan pribadi

Dengan syarat:
- 📋 Sertakan salinan lisensi & copyright notice
- 📋 Sertakan file NOTICE jika ada
- 📋 Dokumentasikan perubahan signifikan
- 🚫 Jangan gunakan trademark pemilik tanpa izin

Lisensi ini juga mencakup **patent grant** eksplisit dari kontributor dan **patent retaliation clause** untuk perlindungan hukum yang lebih baik dibanding MIT.

---

<p align="center">
  <em>Dibuat dengan ☕ &amp; ketelitian di Cilegon, Banten.</em><br>
  <em>HIMASTA UNTIRTA — Himpunan Mahasiswa Statistika</em><br><br>
  <a href="https://untirta.ac.id">Universitas Sultan Ageng Tirtayasa</a> ·
  <a href="https://ft.untirta.ac.id">Fakultas Teknik</a> ·
  <a href="https://statistika.ft.untirta.ac.id">Prodi Statistika</a>
</p>
