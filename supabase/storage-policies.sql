-- ============================================================================
-- Statistika '25 — Supabase Storage Bucket + Policies
-- ============================================================================
-- Run AFTER schema.sql and rls-policies.sql.
-- Creates the storage bucket for student photos + gallery images,
-- and sets up RLS policies for upload/retrieve/delete.
--
-- IDEMPOTENT: Safe to run multiple times. Drops existing policies
-- before recreating them (DROP POLICY IF EXISTS).
--
-- Bucket: `mahasiswa-photos` (PUBLIC — student photos are meant to be
-- visible to anyone viewing the public directory; using a stable public
-- URL means photos stored in the DB never "expire" like signed URLs do.)
-- ============================================================================

-- ============================================================================
-- 1. CREATE OR UPDATE STORAGE BUCKET
-- ============================================================================
-- Insert into storage.buckets (Supabase internal storage schema)
-- Bucket is PUBLIC (public = true) — stable public URLs, no signed URLs needed.
-- This is intentional: student photos in the directory are viewable by all
-- visitors (the directory itself is a public page). For private data, create
-- a separate private bucket.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'mahasiswa-photos',
  'mahasiswa-photos',
  true, -- PUBLIC bucket — stable public URLs (no expiry, no signed URLs)
  8388608, -- 8 MB file size limit (matches frontend validation in ImageUploader)
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- 2. DROP EXISTING POLICIES (idempotent — safe to re-run)
-- ============================================================================
-- Drop all policies we're about to create, in case they already exist
-- from a previous run. This prevents error 42710 (duplicate_object).

DROP POLICY IF EXISTS "Public read all uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users read own uploads" ON storage.objects;
DROP POLICY IF EXISTS "Admins read all uploads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Admins upload anywhere" ON storage.objects;
DROP POLICY IF EXISTS "Users update own uploads" ON storage.objects;
DROP POLICY IF EXISTS "Admins update any upload" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own uploads" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete any upload" ON storage.objects;

-- ============================================================================
-- 3. STORAGE POLICIES (READ)
-- ============================================================================

-- Public can read all uploads (bucket is public — anyone can view student photos)
-- This is the key policy that makes public URLs work without authentication.
CREATE POLICY "Public read all uploads"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'mahasiswa-photos'
  );

-- ============================================================================
-- 4. STORAGE POLICIES (WRITE / INSERT)
-- ============================================================================

-- Authenticated users can upload to their own folder
-- Folder structure: {userId}/{filename}
CREATE POLICY "Authenticated users upload to own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'mahasiswa-photos'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins can upload to any folder
CREATE POLICY "Admins upload anywhere"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'mahasiswa-photos'
    AND public.is_admin()
  );

-- ============================================================================
-- 5. STORAGE POLICIES (UPDATE)
-- ============================================================================

-- Users can update their own uploads
CREATE POLICY "Users update own uploads"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'mahasiswa-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins can update any upload
CREATE POLICY "Admins update any upload"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'mahasiswa-photos'
    AND public.is_admin()
  );

-- ============================================================================
-- 6. STORAGE POLICIES (DELETE)
-- ============================================================================

-- Users can delete their own uploads
CREATE POLICY "Users delete own uploads"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'mahasiswa-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins can delete any upload
CREATE POLICY "Admins delete any upload"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'mahasiswa-photos'
    AND public.is_admin()
  );

-- ============================================================================
-- STORAGE POLICIES COMPLETE
-- ============================================================================
-- Verification:
--   SELECT * FROM storage.buckets WHERE id = 'mahasiswa-photos';
--   -- public column should be true
--   SELECT * FROM storage.policies WHERE bucket_id = 'mahasiswa-photos';
--
-- To test:
--   1. Sign in as user A
--   2. Upload image via /api/upload → goes to mahasiswa-photos/{userA-id}/{filename}
--   3. Open the returned public URL in incognito → should load (no auth required)
--   4. Sign in as user B → cannot delete user A's image (RLS blocks it)
--   5. Sign in as admin → can delete any image
-- ============================================================================
