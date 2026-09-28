-- ============================================================================
-- Statistika '25 — Supabase Storage Bucket + Policies
-- ============================================================================
-- Run AFTER schema.sql and rls-policies.sql.
-- Creates the storage bucket for student photos + gallery images,
-- and sets up RLS policies for upload/retrieve/delete.
--
-- Bucket: `mahasiswa-photos` (private — uses signed URLs)
-- ============================================================================

-- ============================================================================
-- 1. CREATE STORAGE BUCKET
-- ============================================================================
-- Insert into storage.buckets (Supabase internal storage schema)
-- Bucket is PRIVATE (public = false) — signed URLs required for access
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'mahasiswa-photos',
  'mahasiswa-photos',
  false, -- private bucket — signed URLs required
  5242880, -- 5 MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- 2. STORAGE POLICIES
-- ============================================================================
-- Storage policies are separate from table RLS — they have their own schema.
-- Reference: https://supabase.com/docs/guides/storage/security/storage-policies

-- === READ POLICIES ===

-- Users can read their own uploads (via signed URL — owner only)
CREATE POLICY "Users read own uploads"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'mahasiswa-photos'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin())
  );

-- Admins can read all uploads
CREATE POLICY "Admins read all uploads"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'mahasiswa-photos'
    AND public.is_admin()
  );

-- === WRITE POLICIES (INSERT) ===

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

-- === UPDATE POLICIES ===

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

-- === DELETE POLICIES ===

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
--   SELECT * FROM storage.policies WHERE bucket_id = 'mahasiswa-photos';
--
-- To test:
--   1. Sign in as user A
--   2. Upload image → goes to /mahasiswa-photos/{userA-id}/{filename}
--   3. Try to read user B's image → should fail (signed URL only for owner)
--   4. Sign in as admin → can read all images
-- ============================================================================

-- ============================================================================
-- OPTIONAL: Public bucket for logos/svgs (if needed for public assets)
-- ============================================================================
-- INSERT INTO storage.buckets (id, name, public, allowed_mime_types)
-- VALUES (
--   'public-assets',
--   'public-assets',
--   true, -- public bucket
--   ARRAY['image/svg+xml', 'image/png', 'image/jpeg']
-- )
-- ON CONFLICT (id) DO NOTHING;
--
-- CREATE POLICY "Public read public-assets"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'public-assets');
--
-- CREATE POLICY "Admin manage public-assets"
--   ON storage.objects FOR ALL
--   USING (bucket_id = 'public-assets' AND public.is_admin());
-- ============================================================================
