// ============================================================================
// POST /api/upload — Image upload with server-side validation
// ============================================================================
// Handles multipart file uploads for images (profile photos, gallery, etc.)
// - Validates MIME type via whitelist (not just client-side check)
// - Validates file size (max 5 MB)
// - Optional: validates magic bytes (file signature) for extra security
// - Uses Supabase Storage if configured, falls back to local filesystem
// - Requires authentication (any logged-in user can upload)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { uploadFile, MAX_FILE_SIZE, ALLOWED_MIME_TYPES } from '@/lib/storage'

// Magic bytes (file signatures) for allowed image types
// Reference: https://en.wikipedia.org/wiki/List_of_file_signatures
const MAGIC_BYTES: Record<string, number[]> = {
  jpg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47],
  gif: [0x47, 0x49, 0x46, 0x38],
  webp: [0x52, 0x49, 0x46, 0x46], // RIFF
  svg: [0x3c], // < (XML start)
}

function checkMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const ext = ALLOWED_MIME_TYPES[mimeType]
  if (!ext) return false
  const expected = MAGIC_BYTES[ext]
  if (!expected) return true // Skip if no signature defined

  // SVG is text-based, special case
  if (ext === 'svg') {
    const start = buffer.subarray(0, 5).toString('ascii').toLowerCase()
    return start.startsWith('<?xml') || start.startsWith('<svg')
  }

  // For RIFF (webp), also check format identifier
  if (ext === 'webp') {
    if (buffer.subarray(0, 4).toString('ascii') !== 'RIFF') return false
    return buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  }

  for (let i = 0; i < expected.length; i++) {
    if (buffer[i] !== expected[i]) return false
  }
  return true
}

export async function POST(req: NextRequest) {
  // === Auth check ===
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { error: 'Anda harus login untuk upload file.' },
      { status: 401 }
    )
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'File tidak ditemukan dalam request.' },
        { status: 400 }
      )
    }

    // === Validate file size (server-side) ===
    if (file.size > MAX_FILE_SIZE) {
      const maxMB = (MAX_FILE_SIZE / 1024 / 1024).toFixed(1)
      return NextResponse.json(
        { error: `Ukuran file melebihi ${maxMB} MB.` },
        { status: 413 }
      )
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: 'File kosong.' },
        { status: 400 }
      )
    }

    // === Validate MIME type (whitelist) ===
    if (!ALLOWED_MIME_TYPES[file.type]) {
      return NextResponse.json(
        {
          error: `Tipe file ${file.type} tidak diizinkan. Yang diizinkan: ${Object.keys(ALLOWED_MIME_TYPES).join(', ')}`,
        },
        { status: 415 }
      )
    }

    // === Validate magic bytes (file signature) ===
    const buffer = Buffer.from(await file.arrayBuffer())
    if (!checkMagicBytes(buffer, file.type)) {
      return NextResponse.json(
        {
          error: 'File signature tidak cocok dengan tipe yang dideklarasikan. Kemungkinan file di-rename.',
        },
        { status: 415 }
      )
    }

    // === Upload to storage ===
    const result = await uploadFile(file, {
      folder: session.userId,
    })

    return NextResponse.json({
      ok: true,
      url: result.url,
      path: result.path,
      storage: result.storage,
      size: result.size,
      mimeType: result.mimeType,
      originalName: file.name,
    })
  } catch (e: any) {
    console.error('[upload] error', e?.message)
    return NextResponse.json(
      { error: e?.message || 'Gagal upload file.' },
      { status: 500 }
    )
  }
}

// GET endpoint for documentation / health check
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/upload',
    method: 'POST',
    description: 'Upload image file (JPG, PNG, GIF, WebP, SVG)',
    maxSize: `${(MAX_FILE_SIZE / 1024 / 1024).toFixed(1)} MB`,
    allowedTypes: Object.keys(ALLOWED_MIME_TYPES),
    authRequired: true,
  })
}
