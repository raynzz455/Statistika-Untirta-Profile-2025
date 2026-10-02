// ============================================================================
// POST /api/upload — Image upload with sharp resize + Supabase Storage
// ============================================================================
// Accepts multipart/form-data with a `file` field (image only).
// Requires authentication (custom session OR Google OAuth via stat_session).
//
// Pipeline:
//   1. Auth check (getSession)
//   2. Parse FormData → extract `file`
//   3. Validate MIME type + size (max 8 MB, matches ImageUploader.tsx)
//   4. Resize with sharp (max 1200x1200, fit inside, no enlargement)
//   5. Convert to WebP (quality 82) — smaller files, modern format
//   6. Upload to Supabase Storage `mahasiswa-photos` bucket (or local fallback)
//   7. Return { url, path, size, mimeType } — `url` is a STABLE public URL
//
// Response:
//   200: { url, path, size, mimeType }   — upload succeeded
//   400: { error }                        — validation failed (size/MIME)
//   401: { error }                        — not authenticated
//   413: { error }                        — file too large
//   500: { error }                        — server error (sharp/upload failure)
//
// Frontend usage (see src/components/ImageUploader.tsx):
//   const fd = new FormData()
//   fd.append('file', file)
//   const res = await fetch('/api/upload', { method: 'POST', body: fd })
//   const d = await res.json()
//   if (d.error) { toast.error(d.error); return }
//   onChange(d.url) // stable public URL
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { uploadBuffer, MAX_FILE_SIZE } from '@/lib/storage'
import sharp from 'sharp'

// Allowed input MIME types (before sharp conversion to webp)
const ALLOWED_INPUT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/svg+xml',
])

// Sharp resize config — max dimensions, fit inside without enlarging
const MAX_WIDTH = 1200
const MAX_HEIGHT = 1200
const WEBP_QUALITY = 82

export async function POST(req: NextRequest) {
  // === 1. Auth check ===
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { error: 'Anda harus login untuk upload file.' },
      { status: 401 }
    )
  }

  // === 2. Parse FormData ===
  let file: File | null = null
  try {
    const formData = await req.formData()
    file = formData.get('file') as File | null
  } catch {
    return NextResponse.json(
      { error: 'Body harus berupa multipart/form-data dengan field "file".' },
      { status: 400 }
    )
  }

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: 'Field "file" wajib diisi.' },
      { status: 400 }
    )
  }

  // === 3. Validate MIME type + size ===
  const mimeType = file.type
  if (!ALLOWED_INPUT_TYPES.has(mimeType)) {
    return NextResponse.json(
      {
        error: `Tipe file "${mimeType}" tidak diizinkan. Yang diizinkan: JPG, PNG, GIF, WebP, AVIF, SVG.`,
        allowed: Array.from(ALLOWED_INPUT_TYPES),
      },
      { status: 400 }
    )
  }

  if (file.size > MAX_FILE_SIZE) {
    const maxMB = (MAX_FILE_SIZE / 1024 / 1024).toFixed(0)
    return NextResponse.json(
      { error: `Ukuran file melebihi ${maxMB} MB.` },
      { status: 413 }
    )
  }

  // === 4. Read file → Buffer ===
  let inputBuffer: Buffer
  try {
    inputBuffer = Buffer.from(await file.arrayBuffer())
  } catch {
    return NextResponse.json(
      { error: 'Gagal membaca file. Coba lagi.' },
      { status: 500 }
    )
  }

  // === 5. Resize with sharp ===
  // - Max 1200x1200, fit inside, no enlargement
  // - Convert to WebP (quality 82) — smaller files, modern format
  // - Skip SVG (it's vector, sharp can't process it well — store as-is)
  let outputBuffer: Buffer
  let outputMimeType: string

  if (mimeType === 'image/svg+xml') {
    // SVG: store as-is (no resize, no conversion — it's vector)
    outputBuffer = inputBuffer
    outputMimeType = 'image/svg+xml'
  } else {
    try {
      outputBuffer = await sharp(inputBuffer)
        .resize(MAX_WIDTH, MAX_HEIGHT, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer()
      outputMimeType = 'image/webp'
    } catch (e: any) {
      console.error('[api/upload] sharp error:', e?.message?.slice(0, 100))
      return NextResponse.json(
        { error: 'Gagal memproses gambar. File mungkin rusak atau format tidak didukung.' },
        { status: 500 }
      )
    }
  }

  // === 6. Upload to Supabase Storage (or local fallback) ===
  // Folder = user ID (so each user has their own folder — matches RLS policy)
  // For Google OAuth users, session.userId is a Supabase UUID
  // For custom-session users, session.userId is a CUID
  // Both work as folder names — no special handling needed
  try {
    const result = await uploadBuffer(outputBuffer, outputMimeType, file.name, {
      folder: session.userId,
    })

    return NextResponse.json({
      url: result.url,
      path: result.path,
      size: result.size,
      mimeType: result.mimeType,
      originalSize: file.size,
      resized: mimeType !== 'image/svg+xml' && outputMimeType === 'image/webp',
      storage: result.storage,
    })
  } catch (e: any) {
    console.error('[api/upload] upload error:', e?.message?.slice(0, 100))
    return NextResponse.json(
      { error: `Gagal upload ke storage: ${e?.message || 'unknown error'}` },
      { status: 500 }
    )
  }
}

// GET endpoint for documentation
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/upload',
    method: 'POST',
    description: 'Upload gambar dengan sharp resize + Supabase Storage',
    body: 'multipart/form-data with "file" field (image)',
    authRequired: true,
    allowedTypes: Array.from(ALLOWED_INPUT_TYPES),
    maxSize: `${MAX_FILE_SIZE / 1024 / 1024} MB`,
    resize: `${MAX_WIDTH}x${MAX_HEIGHT} (fit inside, no enlargement)`,
    outputFormat: 'image/webp (quality 82) — except SVG which is stored as-is',
    response: {
      url: 'string (stable public URL — no expiry)',
      path: 'string (storage path for delete)',
      size: 'number (bytes)',
      mimeType: 'string (e.g. "image/webp")',
    },
  })
}
