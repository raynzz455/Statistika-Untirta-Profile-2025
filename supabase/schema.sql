-- ============================================================================
-- Statistika '25 — Supabase PostgreSQL Schema (Full)
-- ============================================================================
-- This is the full PostgreSQL schema for direct execution in Supabase
-- SQL Editor. Alternative to running `prisma db:push` against Supabase.
--
-- Usage:
--   1. Open Supabase Dashboard → SQL Editor → New query
--   2. Paste this entire file
--   3. Run
--   4. (Optional) Run rls-policies.sql next for Row-Level Security
--   5. (Optional) Run seed.sql for sample data
--
-- Notes:
--   - Uses PostgreSQL native types (UUID, TIMESTAMPTZ, TEXT, etc.)
--   - Includes proper indexes for query performance
--   - Uses ON DELETE CASCADE for related tables (cleanup on parent delete)
--   - Compatible with Prisma (Prisma Client can read/write these tables)
-- ============================================================================

-- ============================================================================
-- 1. PROFILES TABLE (mirror of auth.users)
-- ============================================================================
-- Auto-synced from auth.users via trigger (see section 8 below)
CREATE TABLE IF NOT EXISTS profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username     TEXT UNIQUE,
  role         TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  display_name TEXT,
  theme        TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ============================================================================
-- 2. STUDENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS students (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name         TEXT NOT NULL,
  nickname     TEXT,
  nim          TEXT NOT NULL UNIQUE,
  kelas        TEXT NOT NULL DEFAULT 'A',
  angkatan     TEXT NOT NULL DEFAULT '2025',
  semester     INTEGER NOT NULL DEFAULT 1,
  tagline      TEXT,
  bio          TEXT,
  instagram    TEXT,
  asal_daerah  TEXT,
  image_url    TEXT,
  owner_id     TEXT, -- nullable, links to profiles.id (but stored as text for legacy compat)
  lagu         TEXT,
  lagu_artis   TEXT,
  lagu_url     TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_kelas ON students(kelas);
CREATE INDEX IF NOT EXISTS idx_students_angkatan ON students(angkatan);
CREATE INDEX IF NOT EXISTS idx_students_owner_id ON students(owner_id);
CREATE INDEX IF NOT EXISTS idx_students_nim ON students(nim);

-- ============================================================================
-- 3. ARTICLES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS articles (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title        TEXT NOT NULL,
  excerpt      TEXT NOT NULL,
  content      TEXT,
  category     TEXT NOT NULL DEFAULT 'Berita',
  date         TEXT NOT NULL,
  author       TEXT NOT NULL,
  image_url    TEXT,
  published    BOOLEAN NOT NULL DEFAULT true,
  author_id    TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);

-- ============================================================================
-- 4. SERIES TABLE (article collections)
-- ============================================================================
CREATE TABLE IF NOT EXISTS series (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title        TEXT NOT NULL,
  description  TEXT,
  image_url    TEXT,
  creator_id   TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_series_creator_id ON series(creator_id);

CREATE TABLE IF NOT EXISTS series_items (
  series_id   TEXT NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  article_id  TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  "order"     INTEGER NOT NULL DEFAULT 0,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (series_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_series_items_series_id ON series_items(series_id);
CREATE INDEX IF NOT EXISTS idx_series_items_article_id ON series_items(article_id);

-- ============================================================================
-- 5. DOSEN TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS dosen (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name         TEXT NOT NULL,
  title        TEXT,
  role         TEXT NOT NULL DEFAULT 'Dosen',
  expertise    TEXT,
  bio          TEXT,
  email        TEXT,
  image_url    TEXT,
  courses      TEXT,
  "order"      INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dosen_order ON dosen("order");

-- ============================================================================
-- 6. TAGS + ARTICLE_TAGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS tags (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name       TEXT NOT NULL UNIQUE,
  color      TEXT NOT NULL DEFAULT '#DD7726',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS article_tags (
  article_id  TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  tag_id      TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (article_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_article_tags_tag_id ON article_tags(tag_id);

-- ============================================================================
-- 7. BOOKMARKS + LIKES
-- ============================================================================
CREATE TABLE IF NOT EXISTS bookmarks (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id    TEXT NOT NULL,
  article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);

CREATE TABLE IF NOT EXISTS likes (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id    TEXT NOT NULL,
  article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_article_id ON likes(article_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);

-- ============================================================================
-- 8. EVENTS + RSVP
-- ============================================================================
CREATE TABLE IF NOT EXISTS events (
  id                 TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title              TEXT NOT NULL,
  description        TEXT,
  location           TEXT,
  start_date         TEXT NOT NULL,
  end_date           TEXT,
  category           TEXT NOT NULL DEFAULT 'Akademik',
  image_url          TEXT,
  organizer_id       TEXT NOT NULL,
  recurrence         TEXT NOT NULL DEFAULT 'none',
  recurrence_end_date TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);

CREATE TABLE IF NOT EXISTS rsvps (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  status     TEXT NOT NULL DEFAULT 'hadir' CHECK (status IN ('hadir', 'mungkin', 'tidak')),
  user_id    TEXT NOT NULL,
  event_id   TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_rsvps_event_id ON rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_user_id ON rsvps(user_id);

-- ============================================================================
-- 9. GALLERY
-- ============================================================================
CREATE TABLE IF NOT EXISTS gallery (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  caption      TEXT NOT NULL,
  category     TEXT NOT NULL DEFAULT 'Umum',
  image_url    TEXT NOT NULL,
  uploader_id  TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gallery_uploader_id ON gallery(uploader_id);
CREATE INDEX IF NOT EXISTS idx_gallery_category ON gallery(category);

-- ============================================================================
-- 10. COMMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS comments (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  content    TEXT NOT NULL,
  article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_article_id ON comments(article_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);

-- ============================================================================
-- 11. FOLLOWS
-- ============================================================================
CREATE TABLE IF NOT EXISTS follows (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  follower_id  TEXT NOT NULL,
  following_id TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);

-- ============================================================================
-- 12. NOTIFICATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  type         TEXT NOT NULL CHECK (type IN ('follow', 'like', 'comment', 'rsvp', 'bookmark')),
  recipient_id TEXT NOT NULL,
  actor_id     TEXT,
  article_id   TEXT,
  event_id     TEXT,
  content      TEXT,
  read         BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read ON notifications(recipient_id, read, created_at DESC);

-- ============================================================================
-- 13. MESSAGES
-- ============================================================================
CREATE TABLE IF NOT EXISTS messages (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  content      TEXT NOT NULL,
  sender_id    TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  read         BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_recipient_read ON messages(recipient_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_recipient ON messages(sender_id, recipient_id, created_at DESC);

-- ============================================================================
-- 14. ASPIRASI (anonymous student feedback)
-- ============================================================================
CREATE TABLE IF NOT EXISTS aspirasi (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name         TEXT NOT NULL,
  content      TEXT NOT NULL,
  category     TEXT NOT NULL DEFAULT 'Umum' CHECK (category IN ('Akademik', 'Fasilitas', 'Organisasi', 'Sosial', 'Umum')),
  approved      BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aspirasi_approved_created ON aspirasi(approved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aspirasi_category_approved ON aspirasi(category, approved);

-- ============================================================================
-- 15. AUDIT LOG (security — track admin actions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  actor_id   TEXT NOT NULL,
  action     TEXT NOT NULL,
  target_id  TEXT,
  metadata   TEXT, -- JSON string
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_actor_id ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

-- ============================================================================
-- 16. TRIGGER: Auto-create profile when user signs up via Supabase Auth
-- ============================================================================
-- This trigger fires when a new user registers via Supabase Auth.
-- It creates a corresponding profile record in the profiles table.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 17. updated_at auto-update trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at column
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT table_name FROM information_schema.columns
    WHERE column_name = 'updated_at' AND table_schema = 'public'
  LOOP
    EXECUTE format('
      CREATE TRIGGER set_updated_at
        BEFORE UPDATE ON %I
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at();
    ', t);
  END LOOP;
END;
$$;

-- ============================================================================
-- SCHEMA COMPLETE — 17 tables + 1 trigger
-- ============================================================================
-- Next steps:
--   1. Run rls-policies.sql to enable Row-Level Security
--   2. Run storage-policies.sql to set up Storage bucket
--   3. (Optional) Run seed.sql for sample data
--   4. Configure OAuth providers in Supabase Dashboard → Authentication
-- ============================================================================
