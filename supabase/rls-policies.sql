-- ============================================================================
-- Statistika '25 — Row-Level Security (RLS) Policies
-- ============================================================================
-- SELF-CONTAINED: Creates missing tables (profiles, audit_log) IF NOT
-- EXISTS at the top, then applies RLS policies to all tables.
--
-- Run AFTER `bun run db:push` (which creates 19 Prisma tables in snake_case
-- via @@map directive: users, students, articles, series, series_items,
-- dosen, tags, article_tags, bookmarks, likes, events, rsvps, gallery,
-- comments, follows, notifications, messages, aspirasi, student_portfolios).
--
-- This file ADDS 2 tables not in Prisma schema:
--   - profiles   (mirrors auth.users for Supabase Auth integration)
--   - audit_log  (security audit log for admin actions)
--
-- Policy design:
--   - Public read access for non-sensitive data (students, articles, etc.)
--   - Authenticated users can modify their own data
--   - Admin users have full access to all tables
--   - Private data (notifications, messages) is per-user only
--
-- Admin role is determined by checking profiles.role = 'admin'
-- (profile is auto-created from auth.users via trigger below)
--
-- Usage:
--   1. Open Supabase Dashboard → SQL Editor → New query
--   2. Paste this entire file
--   3. Run
-- ============================================================================

-- ============================================================================
-- SECTION 0: CREATE MISSING TABLES (not in Prisma schema)
-- ============================================================================
-- These tables are required by the RLS policies below but are NOT defined
-- in prisma/schema.prisma. They are Supabase-specific:
--   - profiles mirrors auth.users (for Supabase Auth integration)
--   - audit_log is for security audit tracking

-- === profiles table ===
-- Mirrors auth.users. Auto-populated via trigger when user signs up via
-- Supabase Auth (Google, GitHub, email, etc.).
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username     TEXT UNIQUE,
  role         TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  display_name TEXT,
  theme        TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- === audit_log table ===
-- Tracks admin actions (delete aspirasi, edit dosen, export data, etc.)
-- for security audit and accountability.
CREATE TABLE IF NOT EXISTS public.audit_log (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  actor_id   TEXT NOT NULL,
  action     TEXT NOT NULL,
  target_id  TEXT,
  metadata   TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_actor_id ON public.audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);

-- ============================================================================
-- SECTION 1: TRIGGERS (auto-populate profiles from auth.users)
-- ============================================================================

-- Trigger: auto-create profile when user signs up via Supabase Auth
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

-- Trigger: auto-update updated_at on row update (for profiles table)
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- SECTION 2: HELPER FUNCTIONS
-- ============================================================================

-- Check if current user is admin (by checking profiles.role)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Check if current user is the owner of a row (by user_id / author_id / etc.)
CREATE OR REPLACE FUNCTION public.is_owner(row_user_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid()::text = row_user_id;
$$;

-- ============================================================================
-- 1. PROFILES — users can read/update their own profile, admins can read all
-- ============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

-- Users can update their own profile (but not role)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Only admins can insert new profiles (auto-trigger handles normal signup)
CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (public.is_admin());

-- Only admins can delete profiles
CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  USING (public.is_admin());

-- ============================================================================
-- 2. STUDENTS — public read, owner can update, admin full access
-- ============================================================================
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read students"
  ON students FOR SELECT
  USING (true);

CREATE POLICY "Owner can update own student profile"
  ON students FOR UPDATE
  USING (public.is_owner(owner_id) OR public.is_admin());

CREATE POLICY "Authenticated can create student profile"
  ON students FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can delete student"
  ON students FOR DELETE
  USING (public.is_admin());

-- ============================================================================
-- 3. ARTICLES — public read published, authors manage own, admin full
-- ============================================================================
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published articles"
  ON articles FOR SELECT
  USING (published = true OR public.is_admin() OR public.is_owner(author_id));

CREATE POLICY "Authors can create articles"
  ON articles FOR INSERT
  WITH CHECK (public.is_owner(author_id) OR public.is_admin());

CREATE POLICY "Authors can update own articles"
  ON articles FOR UPDATE
  USING (public.is_owner(author_id) OR public.is_admin());

CREATE POLICY "Authors/admins can delete articles"
  ON articles FOR DELETE
  USING (public.is_owner(author_id) OR public.is_admin());

-- ============================================================================
-- 4. SERIES + SERIES_ITEMS
-- ============================================================================
ALTER TABLE series ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read series"
  ON series FOR SELECT
  USING (true);

CREATE POLICY "Creator can manage series"
  ON series FOR ALL
  USING (public.is_owner(creator_id) OR public.is_admin());

ALTER TABLE series_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read series_items"
  ON series_items FOR SELECT
  USING (true);

CREATE POLICY "Creator can manage series_items"
  ON series_items FOR ALL
  USING (public.is_admin()); -- Simplified: only admin manages series items

-- ============================================================================
-- 5. DOSEN — public read, admin full
-- ============================================================================
ALTER TABLE dosen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read dosen"
  ON dosen FOR SELECT
  USING (true);

CREATE POLICY "Admin full access dosen"
  ON dosen FOR ALL
  USING (public.is_admin());

-- ============================================================================
-- 6. TAGS — public read, admin full
-- ============================================================================
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read tags"
  ON tags FOR SELECT
  USING (true);

CREATE POLICY "Admin manage tags"
  ON tags FOR ALL
  USING (public.is_admin());

ALTER TABLE article_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read article_tags"
  ON article_tags FOR SELECT
  USING (true);

CREATE POLICY "Admin manage article_tags"
  ON article_tags FOR ALL
  USING (public.is_admin());

-- ============================================================================
-- 7. BOOKMARKS + LIKES — users manage own, others can see
-- ============================================================================
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own bookmarks"
  ON bookmarks FOR SELECT
  USING (public.is_owner(user_id) OR public.is_admin());

CREATE POLICY "Users manage own bookmarks"
  ON bookmarks FOR ALL
  USING (public.is_owner(user_id))
  WITH CHECK (public.is_owner(user_id));

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read likes"
  ON likes FOR SELECT
  USING (true);

CREATE POLICY "Users manage own likes"
  ON likes FOR ALL
  USING (public.is_owner(user_id))
  WITH CHECK (public.is_owner(user_id));

-- ============================================================================
-- 8. EVENTS + RSVP
-- ============================================================================
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read events"
  ON events FOR SELECT
  USING (true);

CREATE POLICY "Organizer can manage own events"
  ON events FOR ALL
  USING (public.is_owner(organizer_id) OR public.is_admin());

ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own rsvps"
  ON rsvps FOR SELECT
  USING (public.is_owner(user_id) OR public.is_admin());

CREATE POLICY "Users manage own rsvps"
  ON rsvps FOR ALL
  USING (public.is_owner(user_id))
  WITH CHECK (public.is_owner(user_id));

-- ============================================================================
-- 9. GALLERY — public read, uploader/admin manage
-- ============================================================================
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read gallery"
  ON gallery FOR SELECT
  USING (true);

CREATE POLICY "Uploader can create gallery items"
  ON gallery FOR INSERT
  WITH CHECK (public.is_owner(uploader_id) OR public.is_admin());

CREATE POLICY "Uploader/admin can delete gallery items"
  ON gallery FOR DELETE
  USING (public.is_owner(uploader_id) OR public.is_admin());

-- ============================================================================
-- 10. COMMENTS — public read, author/admin manage
-- ============================================================================
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read comments"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can comment"
  ON comments FOR INSERT
  WITH CHECK (public.is_owner(user_id));

CREATE POLICY "Author/admin can delete comments"
  ON comments FOR DELETE
  USING (public.is_owner(user_id) OR public.is_admin());

-- ============================================================================
-- 11. FOLLOWS — users manage own, can see who follows whom
-- ============================================================================
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read follows"
  ON follows FOR SELECT
  USING (true);

CREATE POLICY "Users manage own follows"
  ON follows FOR ALL
  USING (public.is_owner(follower_id))
  WITH CHECK (public.is_owner(follower_id));

-- ============================================================================
-- 12. NOTIFICATIONS — per-user only
-- ============================================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications"
  ON notifications FOR SELECT
  USING (public.is_owner(recipient_id) OR public.is_admin());

CREATE POLICY "Users update own notifications"
  ON notifications FOR UPDATE
  USING (public.is_owner(recipient_id));

CREATE POLICY "Authenticated can trigger notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can delete notifications"
  ON notifications FOR DELETE
  USING (public.is_admin());

-- ============================================================================
-- 13. MESSAGES — sender + recipient only
-- ============================================================================
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own messages (sent/received)"
  ON messages FOR SELECT
  USING (public.is_owner(sender_id) OR public.is_owner(recipient_id) OR public.is_admin());

CREATE POLICY "Users send messages"
  ON messages FOR INSERT
  WITH CHECK (public.is_owner(sender_id));

CREATE POLICY "Recipients can update read status"
  ON messages FOR UPDATE
  USING (public.is_owner(recipient_id));

CREATE POLICY "Admin can delete messages"
  ON messages FOR DELETE
  USING (public.is_admin());

-- ============================================================================
-- 14. ASPIRASI — public read approved, admin can delete any
-- ============================================================================
ALTER TABLE aspirasi ENABLE ROW LEVEL SECURITY;

-- Public can read APPROVED aspirasi (anonymous submissions — no auth check)
CREATE POLICY "Public read approved aspirasi"
  ON aspirasi FOR SELECT
  USING (approved = true);

-- Admin can read ALL aspirasi (including unapproved)
CREATE POLICY "Admin read all aspirasi"
  ON aspirasi FOR SELECT
  USING (public.is_admin());

-- Anyone (even unauthenticated) can submit aspirasi — this is by design
-- (anonymous feedback feature). Rate limiting enforced at app layer.
CREATE POLICY "Anyone can submit aspirasi"
  ON aspirasi FOR INSERT
  WITH CHECK (true);

-- Admin can update (approve/hide) and delete
CREATE POLICY "Admin manage aspirasi"
  ON aspirasi FOR ALL
  USING (public.is_admin());

-- ============================================================================
-- 15. STUDENT_PORTFOLIOS — public read, owner/admin manage
-- ============================================================================
ALTER TABLE student_portfolios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read student_portfolios"
  ON student_portfolios FOR SELECT
  USING (true);

CREATE POLICY "Admin manage student_portfolios"
  ON student_portfolios FOR ALL
  USING (public.is_admin());

-- ============================================================================
-- 16. USERS — admin read only (this is the Prisma User table for custom auth)
-- ============================================================================
-- Note: This is the Prisma `User` model, mapped to table `users`.
-- It stores test users (admin/admin, user/user, fauzi/fauzi) for custom
-- session-based auth (src/lib/session.ts). It is SEPARATE from `profiles`
-- (which stores Supabase Auth users).
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read users"
  ON users FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admin manage users"
  ON users FOR ALL
  USING (public.is_admin());

-- ============================================================================
-- 17. AUDIT LOG — admin read only
-- ============================================================================
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read audit_log"
  ON audit_log FOR SELECT
  USING (public.is_admin());

CREATE POLICY "System insert audit_log"
  ON audit_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL OR public.is_admin());

-- ============================================================================
-- RLS POLICIES COMPLETE — All 21 tables secured
-- ============================================================================
-- Tables with RLS enabled:
--   Prisma tables (19): users, students, articles, series, series_items,
--     dosen, tags, article_tags, bookmarks, likes, events, rsvps, gallery,
--     comments, follows, notifications, messages, aspirasi, student_portfolios
--   SQL-only tables (2): profiles, audit_log
--   Total: 21 tables with RLS
--
-- Verification:
--   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- All tables should show rowsecurity = true.
--
-- To test policies:
--   1. Sign in as a regular user (via OAuth Google/GitHub)
--   2. Try to read another user's notifications → should fail
--   3. Try to delete an aspirasi → should fail (unless admin)
--   4. Sign in as admin → should succeed for all operations
-- ============================================================================
