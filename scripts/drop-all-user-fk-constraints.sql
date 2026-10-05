-- ============================================================================
-- Statistika '25 — Drop ALL FK constraints to users.id
-- ============================================================================
-- Background:
--   The Prisma schema declares @relation directives on multiple models
--   that reference users.id via FK constraints. This breaks POST for
--   Google OAuth users because:
--     - Google OAuth user's session.userId = Supabase UUID (e.g. "a1b2-...")
--     - Prisma `users` table only holds custom-session test users (CUIDs)
--     - INSERT with non-existent user_id violates FK constraint → 500 error
--       ("Failed to execute 'json' on 'Response': Unexpected end of JSON input"
--        because the route handler crashes with no JSON body)
--
-- Affected endpoints (all POST/PUT that set a user_*_id field):
--   - POST /api/gallery      → gallery.uploader_id      → gallery_uploader_id_fkey
--   - POST /api/articles     → articles.author_id       → articles_author_id_fkey
--   - POST /api/events       → events.organizer_id      → events_organizer_id_fkey
--   - POST /api/series       → series.creator_id        → series_creator_id_fkey
--   - POST /api/bookmarks    → bookmarks.user_id        → bookmarks_user_id_fkey
--   - POST /api/articles/[id]/like → likes.user_id      → likes_user_id_fkey
--   - POST /api/articles/[id]/comments → comments.user_id → comments_user_id_fkey
--   - POST /api/events/[id]/rsvp → rsvps.user_id         → rsvps_user_id_fkey
--   - POST /api/users/[id]/follow → follows.follower_id  → follows_follower_id_fkey
--                                  → follows.following_id → follows_following_id_fkey
--   - POST /api/messages     → messages.sender_id       → messages_sender_id_fkey
--                            → messages.recipient_id    → messages_recipient_id_fkey
--   - INSERT notifications   → notifications.recipient_id → notifications_recipient_id_fkey
--                            → notifications.actor_id    → notifications_actor_id_fkey
--   - POST /api/students/claim → students.owner_id      → students_owner_id_fkey
--                                (already covered by drop-students-owner-fk.sql,
--                                 but re-included here for completeness)
--
-- Fix:
--   Drop ALL FK constraints to users.id in one script. Idempotent — safe
--   to run multiple times. After running, Google OAuth users can POST to
--   any endpoint without 500 FK violation.
--
-- IMPORTANT:
--   Do NOT run `bun run db:push` after running this script. db:push would
--   re-add the FK constraints because the Prisma schema still has the
--   @relation directives. If you must run db:push (e.g. to add a new field),
--   re-run this script AFTER db:push to drop the FKs again.
--
-- Usage:
--   1. Open Supabase Dashboard → SQL Editor → New query
--   2. Paste this entire file
--   3. Run
--   4. Verify with the verification query at the bottom
-- ============================================================================

-- ============================================================================
-- DROP ALL FK CONSTRAINTS TO users.id
-- ============================================================================
-- Idempotent: uses IF EXISTS so safe to run multiple times.
-- Each constraint name follows Prisma's default naming convention:
--   {table}_{column}_fkey
-- Exception: follows + notifications + messages use named relations
--   (e.g. "Follower", "Following", "NotificationRecipient") — the FK
--   constraint name is still {table}_{column}_fkey (Prisma default).

-- Gallery
ALTER TABLE public.gallery DROP CONSTRAINT IF EXISTS gallery_uploader_id_fkey;

-- Articles
ALTER TABLE public.articles DROP CONSTRAINT IF EXISTS articles_author_id_fkey;

-- Events
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_organizer_id_fkey;

-- Series
ALTER TABLE public.series DROP CONSTRAINT IF EXISTS series_creator_id_fkey;

-- Bookmarks
ALTER TABLE public.bookmarks DROP CONSTRAINT IF EXISTS bookmarks_user_id_fkey;

-- Likes
ALTER TABLE public.likes DROP CONSTRAINT IF EXISTS likes_user_id_fkey;

-- Rsvps
ALTER TABLE public.rsvps DROP CONSTRAINT IF EXISTS rsvps_user_id_fkey;

-- Comments
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_user_id_fkey;

-- Follows (two FKs: follower_id + following_id)
ALTER TABLE public.follows DROP CONSTRAINT IF EXISTS follows_follower_id_fkey;
ALTER TABLE public.follows DROP CONSTRAINT IF EXISTS follows_following_id_fkey;

-- Notifications (two FKs: recipient_id + actor_id)
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_recipient_id_fkey;
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_actor_id_fkey;

-- Messages (two FKs: sender_id + recipient_id)
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_recipient_id_fkey;

-- Students (owner_id — also covered by drop-students-owner-fk.sql, but
-- included here for one-shot completeness)
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_owner_id_fkey;

-- ============================================================================
-- ADD INDEXES FOR PERFORMANCE (idempotent)
-- ============================================================================
-- Without the FK constraint, Postgres doesn't automatically create an
-- index on the user_id column. These indexes speed up lookups like
-- "find all articles by user X" or "find all gallery items by user X".
-- IF NOT EXISTS so safe to run multiple times.

CREATE INDEX IF NOT EXISTS idx_articles_author_id     ON public.articles(author_id);
CREATE INDEX IF NOT EXISTS idx_events_organizer_id     ON public.events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_gallery_uploader_id    ON public.gallery(uploader_id);
CREATE INDEX IF NOT EXISTS idx_series_creator_id      ON public.series(creator_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id      ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id          ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_user_id          ON public.rsvps(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id       ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id    ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id  ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id    ON public.notifications(actor_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id    ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id  ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_students_owner_id     ON public.students(owner_id);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running, this query should return ZERO rows:
--   SELECT conname, conrelid::regclass AS table_name
--   FROM pg_constraint
--   WHERE contype = 'f'
--     AND conrelid::regclass::text IN (
--       'public.gallery', 'public.articles', 'public.events', 'public.series',
--       'public.bookmarks', 'public.likes', 'public.rsvps', 'public.comments',
--       'public.follows', 'public.notifications', 'public.messages',
--       'public.students'
--     );
--
-- If it returns any rows, those FK constraints still exist — re-run this
-- script (it's idempotent).
-- ============================================================================
