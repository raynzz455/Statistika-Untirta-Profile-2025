-- ============================================================================
-- Statistika '25 — Set Admin User
-- ============================================================================
-- Run AFTER your first user signs up via Supabase Auth (Google, GitHub, or email).
-- This script:
--   1. Lists all users in auth.users
--   2. Lets you set the first user as admin
--   3. Verifies the admin role is set
--
-- Usage:
--   1. Sign up first user via Supabase Auth (e.g. Google OAuth at /api/auth/oauth/google)
--   2. Open Supabase Dashboard → SQL Editor → New query
--   3. Run the FIND section below to see your user ID
--   4. Copy your user ID (UUID)
--   5. Paste it into the SET AS ADMIN section, uncomment, and run
-- ============================================================================

-- ============================================================================
-- STEP 1: FIND YOUR USER (run this first)
-- ============================================================================
-- This shows all users who have signed up via Supabase Auth.

SELECT
  u.id,
  u.email,
  u.created_at,
  u.last_sign_in_at,
  u.raw_user_meta_data->>'full_name' AS full_name,
  u.raw_user_meta_data->>'avatar_url' AS avatar_url,
  COALESCE(p.role, 'user') AS current_role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id::text
ORDER BY u.created_at DESC
LIMIT 10;

-- ============================================================================
-- STEP 2: SET USER AS ADMIN (uncomment + replace USER_ID)
-- ============================================================================
-- Replace 'PASTE_USER_UUID_HERE' with the actual UUID from Step 1.
-- Then uncomment the lines below and run.

-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE id = 'PASTE_USER_UUID_HERE';

-- ============================================================================
-- STEP 3: VERIFY ADMIN ROLE (optional — run after Step 2)
-- ============================================================================

SELECT
  p.id,
  u.email,
  p.username,
  p.role,
  p.display_name,
  p.created_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.id::uuid
ORDER BY p.created_at DESC;

-- ============================================================================
-- STEP 4 (OPTIONAL): ADD MORE ADMINS
-- ============================================================================
-- To make multiple users admin:

-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE id IN (
--   'USER_UUID_1',
--   'USER_UUID_2',
--   'USER_UUID_3'
-- );

-- ============================================================================
-- STEP 5 (OPTIONAL): DEMOTE ADMIN TO REGULAR USER
-- ============================================================================

-- UPDATE public.profiles
-- SET role = 'user'
-- WHERE id = 'USER_UUID_HERE';

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. The first user to sign up is automatically set as 'user' (not admin)
--    by the trigger in supabase/schema.sql (handle_new_user function).
-- 2. You must manually promote users to 'admin' via this SQL or via
--    Supabase Dashboard → Authentication → Users → Edit user app_metadata.
-- 3. Admin role grants full CRUD access to all tables (via RLS policies
--    in supabase/rls-policies.sql — see "Admin full access" policies).
-- 4. The is_admin() SQL function (defined in rls-policies.sql) checks
--    profiles.role = 'admin' for the current authenticated user.
-- ============================================================================
