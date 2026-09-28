# DESIGN.md — Anti AI-Slop Design System

> **Prinsip utama**: Setiap keputusan design harus intentional, bukan default.
> Jika sesuatu terlihat seperti "bisa dihasilkan AI dalam 5 detik", ubah.

---

## 🚫 Dilarang (AI Slop Tells)

### Typography
- ❌ **Inter, Roboto, Arial, Helvetica** sebagai font utama (AI "factory fonts")
- ❌ **Em dash (—)** dalam user-facing text (AI loves to overuse ini)
  - Pakai sebagai gantinya: titik dua (`:`), koma (`,`), tanda kurung `()`, atau pecah jadi 2 kalimat
  - Em dash di code comments OK (tidak visible ke user)
- ❌ **Fraunces** atau font "trendy" lain yang overused
- ❌ Font weight `900` atau ultra-bold (terlalu "AI-slop heavy")
- ❌ Forced bold pada condensed fonts (Bebas Neue weight 400 saja, JANGAN `font-bold`)

### Color
- ❌ **Purple gradients** everywhere (classic AI slop)
- ❌ Blue/purple sebagai default color scheme
- ❌ Color decoratively (pakai color semantically: navy = primary, orange = accent/CTA)

### Layout
- ❌ Overuse of cards (terlalu banyak card = generic template look)
- ❌ Side shadows pada boxes (brutalist AI default)
- ❌ Cluttered tanpa whitespace
- ❌ Bento grids (2025 AI default)
- ❌ Glassmorphism / "liquid glass" (AI trend-chasing)

### Content
- ❌ Generic, template-like copy
- ❌ Japanese-style overly polite UX writing
- ❌ Predictable layout patterns

---

## ✅ Yang Dipakai (Intentional Choices)

### Font System (4 families — editorial newspaper aesthetic)

| Font | CSS Class | Variable | Weight | Untuk apa |
|------|----------|----------|--------|-----------|
| **Playfair Display** | `font-serif` | `--font-serif` | 700 (NOT 900) | Headlines, judul artikel, profil nama |
| **Bebas Neue** | `font-condensed` | `--font-condensed` | 400 only | Navbar, labels, section headers, badges |
| **Lora** | `font-body` | `--font-body` | 400, 500, 600, 700 | Body text, deskripsi, konten artikel |
| **IBM Plex Mono** | `font-mono` | `--font-mono` | 400, 500, 600 | Metadata, tanggal, NIM, timestamps |

> ⚠️ **Penting**: Lora adalah SERIF font, bukan sans-serif. CSS variable namanya `--font-body` (bukan `--font-sans`) supaya tidak misleading. Class `font-body` untuk body text.

### Color System (HIMASTA UNTIRTA palette)

| Variable | Light Mode | Dark Mode | Untuk apa |
|----------|------------|-----------|-----------|
| `--brand-navy` | `#1B3A6B` | `#3d6a9f` | Primary: headlines, buttons, badges |
| `--brand-orange` | `#DD7726` | `#e89050` | Accent: CTAs, highlights, active states |
| `--brand-silver` | `#C0C0C0` | `#6a6a6a` | Muted accents |
| `--brand-surface` | `#faf7ed` | `#161b22` | Card backgrounds (warm paper) |
| `--brand-surface-2` | `#f0ebde` | `#1c232c` | Secondary surfaces |
| `--brand-ink` | `#1a1a1a` | `#e6e0d4` | Primary text (letterpress ink) |
| `--brand-ink-muted` | `#5c5346` | `#8b8579` | Muted text |
| `--brand-bg` | `#f4f1e8` | `#0d1117` | Page background (aged paper) |

### Layout Principles
- ✅ Generous whitespace (newspaper column feel)
- ✅ Subtle retro shadows (2px opacity 8%, NOT brutalist 6px offset)
- ✅ Paper texture noise overlay (3% opacity)
- ✅ Border-based separation (not shadows)
- ✅ Asymmetric editorial layouts (not symmetric grid)

---

## 📝 Rules of Thumb

1. **Typography is the fastest way to escape AI slop** — fix fonts first
2. **Use 2 colors semantically** — navy (primary) + orange (accent), not decoratively
3. **Rewrite every line in a real person's voice** — Indonesian, authentic, not template
4. **No em dash in visible text** — use `:`, `,`, `()`, or split sentences
5. **Font weight 700 max for headlines** — not 800 or 900 (too heavy = AI slop)
6. **Bebas Neue weight 400 only** — never `font-bold` (CSS override: `.font-condensed { font-weight: 400 !important }`)
7. **When in doubt, add whitespace** — cluttered = AI slop

---

## 🔍 Self-Check Checklist

Before committing UI changes:
- [ ] No em dash (—) in user-facing text (OK in code comments)
- [ ] No Inter/Roboto/Arial/Helvetica as primary font
- [ ] No purple gradients
- [ ] No glassmorphism/liquid glass
- [ ] No `font-bold` on `font-condensed` elements
- [ ] No `font-weight: 900` anywhere
- [ ] Color used semantically (navy = primary, orange = accent)
- [ ] Generous whitespace (not cluttered)
- [ ] Content in authentic Indonesian voice
