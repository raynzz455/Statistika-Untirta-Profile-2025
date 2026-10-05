// ============================================================================
// Supabase Storage Helper
// ============================================================================
// Server-side utilities for uploading, retrieving, and deleting files
// in Supabase Storage. Falls back to local filesystem (/public/uploads/)
// when Supabase is not configured (for local dev without Supabase project).
//
// Bucket: `mahasiswa-photos` (PUBLIC — stable public URLs)
// Folder structure: {userId}/{timestamp}-{random}.webp
//
// Usage:
//   import { uploadFile, uploadBuffer, getPublicUrl, deleteFile } from '@/lib/storage'
//   const { url, path } = await uploadFile(file, userId)
//   const publicUrl = getPublicUrl(path)
//   await deleteFile(path)
// ============================================================================

import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { randomBytes } from 'crypto'
import path from 'path'
import { promises as fs } from 'fs'

const BUCKET_NAME = 'mahasiswa-photos'
const LOCAL_UPLOAD_DIR = 'public/uploads'

// Allowed MIME types for uploads (whitelist approach)
const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/avif': 'avif',
}

// Max file size: 8 MB (matches frontend validation in ImageUploader.tsx)
const MAX_FILE_SIZE = 8 * 1024 * 1024

interface UploadResult {
  url: string // public URL (Supabase) or /uploads/... path (local) — STABLE, no expiry
  path: string // storage path (for Supabase) or filename (for local)
  storage: 'supabase' | 'local'
  size: number
  mimeType: string
}

interface UploadOptions {
  /** Folder to upload to (e.g. user ID) */
  folder?: string
  /** Override filename (default: auto-generated) */
  filename?: string
  /** Max size in bytes (default: 8 MB) */
  maxSize?: number
  /** Allowed MIME types (default: image/* whitelist) */
  allowedMimes?: string[]
}

function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

function generateFilename(originalName: string, ext?: string): string {
  // If explicit extension provided (e.g. '.webp' after sharp conversion), use it
  const finalExt = ext ?? path.extname(originalName).toLowerCase()
  const random = randomBytes(8).toString('hex')
  const timestamp = Date.now()
  return `${timestamp}-${random}${finalExt}`
}

function validateFile(
  file: File | Buffer,
  mimeType: string,
  size: number,
  options?: UploadOptions
): { valid: boolean; error?: string } {
  const maxSize = options?.maxSize ?? MAX_FILE_SIZE
  const allowed = options?.allowedMimes ?? Object.keys(ALLOWED_MIME_TYPES)

  if (size > maxSize) {
    const maxMB = (maxSize / 1024 / 1024).toFixed(1)
    return { valid: false, error: `Ukuran file melebihi ${maxMB} MB` }
  }

  if (!allowed.includes(mimeType)) {
    return { valid: false, error: `Tipe file ${mimeType} tidak diizinkan` }
  }

  return { valid: true }
}

/**
 * Upload a Buffer to Supabase Storage (or local filesystem as fallback).
 * Used when you need to preprocess the file (e.g. resize with sharp) before
 * uploading — the /api/upload route uses this after sharp conversion.
 *
 * @param buffer - File contents as Buffer
 * @param mimeType - MIME type (e.g. 'image/webp' after sharp conversion)
 * @param originalName - Original filename (used for extension fallback)
 * @param options - Upload options (folder, filename, etc.)
 */
export async function uploadBuffer(
  buffer: Buffer,
  mimeType: string,
  originalName: string,
  options?: UploadOptions
): Promise<UploadResult> {
  const size = buffer.length

  const validation = validateFile(buffer, mimeType, size, options)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  // Force .webp extension if mimeType is webp (after sharp conversion)
  const forcedExt = mimeType === 'image/webp' ? '.webp'
    : mimeType === 'image/avif' ? '.avif'
    : undefined
  const filename = options?.filename ?? generateFilename(originalName, forcedExt)
  const folder = options?.folder ?? 'misc'

  // === LOCAL FALLBACK === (when Supabase not configured — local dev only)
  if (!isSupabaseConfigured()) {
    const localPath = `${LOCAL_UPLOAD_DIR}/${folder}`
    await fs.mkdir(localPath, { recursive: true })
    const fullLocalPath = `${localPath}/${filename}`
    await fs.writeFile(fullLocalPath, buffer)
    return {
      url: `/uploads/${folder}/${filename}`,
      path: `${folder}/${filename}`,
      storage: 'local',
      size,
      mimeType,
    }
  }

  // === SUPABASE STORAGE ===
  // Uses admin client (service role) to bypass RLS — the route handler has
  // already authenticated the user via getSession() / getCurrentUser().
  const supabase = await createSupabaseAdminClient()
  const storagePath = `${folder}/${filename}`

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, buffer, {
      contentType: mimeType,
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    throw new Error(`Supabase Storage error: ${error.message}`)
  }

  // Bucket is PUBLIC — return stable public URL (no signed URL, no expiry).
  // Format: https://[project].supabase.co/storage/v1/object/public/mahasiswa-photos/{folder}/{filename}
  const { data: publicData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(storagePath)

  return {
    url: publicData.publicUrl,
    path: storagePath,
    storage: 'supabase',
    size,
    mimeType,
  }
}

/**
 * Upload a File object to Supabase Storage (or local filesystem as fallback).
 * Thin wrapper around uploadBuffer() — converts File to Buffer first.
 *
 * @param file - File object from FormData
 * @param options - Upload options (folder, filename, etc.)
 */
export async function uploadFile(
  file: File,
  options?: UploadOptions
): Promise<UploadResult> {
  const buffer = Buffer.from(await file.arrayBuffer())
  return uploadBuffer(buffer, file.type, file.name, options)
}

/**
 * Get the public URL for a stored file (Supabase) or local path (dev).
 * Use this to resolve stored `path` values back to URLs without re-uploading.
 *
 * @param storagePath - Path returned from uploadFile() / uploadBuffer()
 */
export function getPublicUrl(storagePath: string): string {
  if (!isSupabaseConfigured()) {
    // Local fallback — files are public via /uploads/...
    return `/uploads/${storagePath}`
  }

  // Build public URL manually (avoid needing an async Supabase client for this)
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  return `${projectUrl}/storage/v1/object/public/${BUCKET_NAME}/${storagePath}`
}

/**
 * Delete a file from Supabase Storage (or local filesystem as fallback).
 *
 * @param storagePath - Path returned from uploadFile() / uploadBuffer()
 */
export async function deleteFile(storagePath: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    // Local fallback
    try {
      await fs.unlink(`${LOCAL_UPLOAD_DIR}/${storagePath}`)
      return true
    } catch {
      return false
    }
  }

  const supabase = await createSupabaseAdminClient()
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([storagePath])

  return !error
}

/**
 * List files in a folder (admin only).
 *
 * @param folder - Folder to list (e.g. user ID or 'misc')
 */
export async function listFiles(folder?: string) {
  if (!isSupabaseConfigured()) {
    // Local fallback
    try {
      const dir = folder ? `${LOCAL_UPLOAD_DIR}/${folder}` : LOCAL_UPLOAD_DIR
      const files = await fs.readdir(dir)
      return files.map((name) => ({ name, path: `${folder ?? ''}/${name}` }))
    } catch {
      return []
    }
  }

  const supabase = await createSupabaseAdminClient()
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(folder ?? '', { limit: 100, offset: 0 })

  if (error) return []
  return data ?? []
}

export { BUCKET_NAME, ALLOWED_MIME_TYPES, MAX_FILE_SIZE }
