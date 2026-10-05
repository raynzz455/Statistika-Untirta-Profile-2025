-- ============================================================================
-- Fix: Signup 400 "Database error saving new user"
-- ============================================================================
-- Run this in Supabase SQL Editor to fix the signup database error.
--
-- The error is caused by the `handle_new_user()` trigger function on
-- auth.users. When a new user signs up, the trigger tries to INSERT into
-- public.profiles. If the profiles table doesn't exist, or has a column
-- mismatch, or any other error occurs — the trigger FAILS and blocks
-- the entire signup → "Database error saving new user" → 400 on
-- /api/auth/signup.
--
-- This fix makes the trigger SILENTLY IGNORE any errors. The INSERT is
-- wrapped in a nested BEGIN/EXCEPTION block. If it fails, the exception
-- is caught and the function returns NEW anyway — signup proceeds
-- successfully. The profile can be created later.
-- ============================================================================

-- Drop and recreate the trigger function (defensive version)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, username, display_name)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Silently ignore — don't block signup!
    RAISE WARNING 'handle_new_user: failed to insert profile for user %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the trigger exists
SELECT tgname, tgrelid::regclass, tgenabled
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- If the trigger doesn't exist, create it:
-- (This is safe to run — DROP IF EXISTS first)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- ALSO: Make sure the profiles table exists
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID PRIMARY KEY,
  username     TEXT UNIQUE,
  role         TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  display_name TEXT,
  theme        TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- VERIFICATION: After running this, try signup again.
-- The trigger should no longer block signup even if profiles table
-- has issues. The error will be logged as a WARNING (visible in
-- Supabase Dashboard → Logs → Postgres) but won't block the user.
-- ============================================================================
