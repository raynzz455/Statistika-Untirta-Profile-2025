-- ============================================================================
-- Statistika '25 — Drop FK constraint on students.owner_id
-- ============================================================================
-- Background:
--   The Prisma schema originally declared `Student.owner User? @relation(...)`,
--   which created a FK constraint `students_owner_id_fkey` referencing
--   `users(id)`. This breaks NIM claim for Google OAuth users because:
--     - Google OAuth user's session.userId = Supabase UUID (e.g. "a1b2-...")
--     - Prisma `users` table only holds custom-session test users (CUID ids)
--     - Setting students.owner_id = <Supabase UUID> violates the FK constraint
--       (no matching row in users table) → 500 error from /api/students/claim
--
-- Fix:
--   The Prisma schema has been updated to remove the @relation. Locally,
--   run `bun run db:push`. For production Supabase, run this SQL instead
--   (safer than re-running db:push with --accept-data-loss).
--
-- Usage:
--   1. Open Supabase Dashboard → SQL Editor → New query
--   2. Paste this file
--   3. Run
--   4. Verify: \d students  (constraint should no longer list students_owner_id_fkey)
-- ============================================================================

-- Drop the FK constraint if it exists (idempotent)
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_owner_id_fkey;

-- Add a UNIQUE constraint on owner_id (matches Prisma schema's @unique).
-- This allows `findUnique({ where: { ownerId } })` to work in the auth
-- callback for smart post-login routing. Multiple NULL owner_id values
-- are allowed (Postgres treats NULL as distinct), so unclaimed students
-- don't conflict.
-- Use DO block so the script is idempotent — won't fail if the constraint
-- was already created by `bun run db:push`.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.students'::regclass
      AND conname = 'students_owner_id_key'
  ) THEN
    ALTER TABLE public.students ADD CONSTRAINT students_owner_id_key UNIQUE (owner_id);
  END IF;
END$$;

-- Optional: add a plain index on owner_id for faster lookup by owner
-- (the UNIQUE constraint above already creates an index, but this is a
--  harmless no-op if the unique index is already present.)
CREATE INDEX IF NOT EXISTS idx_students_owner_id ON public.students(owner_id);

-- Verification query (run in psql / SQL Editor to confirm):
-- SELECT conname, contype FROM pg_constraint
--   WHERE conrelid = 'public.students'::regclass
--   ORDER BY contype;
-- Expected after running this script:
--   students_owner_id_key   u   (unique constraint)
--   students_pkey            p   (primary key)
-- NO row with contype = 'f' (foreign key) should remain.
