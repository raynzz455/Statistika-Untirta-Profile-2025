// ============================================================================
// Supabase Storage Helper
// ============================================================================
// Server-side utilities for uploading, retrieving, and deleting files
// in Supabase Storage. Falls back to local filesystem (/public/uploads/)
// when Supabase is not configured (for local dev without Supabase project).
//
// Bucket: `mahasiswa-photos` (private — uses signed URLs)
// Folder structure: {userId}/{timestamp}-{random}.{ext}
//
// Usage:
//   import { uploadFile, getSignedUrl, deleteFile } from '@/lib/storage'
//   const { url, path } = await uploadFile(file, userId)
//   const signedUrl = await getSignedUrl(path, 60) // 60 seconds
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
}

// Max file size: 5 MB
const MAX_FILE_SIZE = 5 * 1024 * 1024

interface UploadResult {
  url: string // public URL or signed URL (Supabase) or /uploads/... path (local)
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
  /** Max size in bytes (default: 5 MB) */
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

function generateFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase()
  const random = randomBytes(8).toString('hex')
  const timestamp = Date.now()
  return `${timestamp}-${random}${ext}`
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
 * Upload a file to Supabase Storage (or local filesystem as fallback).
 *
 * @param file - File object from FormData
 * @param folder - Optional folder (e.g. user ID) to organize files
 * @returns UploadResult with public URL or local path
 */
export async function uploadFile(
  file: File,
  options?: UploadOptions
): Promise<UploadResult> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const mimeType = file.type
  const size = file.size

  const validation = validateFile(file, mimeType, size, options)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const filename = options?.filename ?? generateFilename(file.name)
  const folder = options?.folder ?? 'misc'

  // === LOCAL FALLBACK === (when Supabase not configured)
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
  const supabase = await createSupabaseAdminClient()
  const storagePath = `${folder}/${filename}`

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, buffer, {
      contentType: mimeType,
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    throw new Error(`Supabase Storage error: ${error.message}`)
  }

  // For private buckets, generate signed URL (expires in 1 hour)
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(storagePath, 3600)

  if (signedUrlError || !signedUrlData?.signedUrl) {
    // Fall back to public URL if bucket is public
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

  return {
    url: signedUrlData.signedUrl,
    path: storagePath,
    storage: 'supabase',
    size,
    mimeType,
  }
}

/**
 * Get a fresh signed URL for a file (used when the old signed URL expires).
 *
 * @param storagePath - Path returned from uploadFile()
 * @param expiresIn - Seconds until URL expires (default: 3600 = 1 hour)
 */
export async function getSignedUrl(
  storagePath: string,
  expiresIn: number = 3600
): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    // Local fallback — files are public via /uploads/...
    return `/uploads/${storagePath}`
  }

  const supabase = await createSupabaseAdminClient()
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(storagePath, expiresIn)

  if (error || !data?.signedUrl) {
    return null
  }

  return data.signedUrl
}

/**
 * Delete a file from Supabase Storage (or local filesystem as fallback).
 *
 * @param storagePath - Path returned from uploadFile()
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
