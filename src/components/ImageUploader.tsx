'use client'

import { useRef, useState } from 'react'
import { Upload, X, Loader2, Check, Link2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ImageUploaderProps {
  /** Current image URL (controlled) */
  value: string
  /** Called when image URL changes (upload success or URL input) */
  onChange: (url: string) => void
  /** Label text */
  label?: string
  /** Hint shown under the input */
  hint?: string
  /** Alt text for the preview */
  altText?: string
  /** Optional class for the wrapper */
  className?: string
  /** Apply grayscale filter to preview */
  grayscale?: boolean
}

/**
 * Combined image uploader:
 * - Drag-and-drop / click to upload (multipart → /api/upload with sharp resize)
 * - OR paste a URL directly
 *
 * Uploads produce a local /uploads/... URL saved to the DB.
 */
export function ImageUploader({
  value,
  onChange,
  label = 'Gambar',
  hint,
  altText = 'Pratinjau gambar',
  className,
  grayscale = false,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const urlInputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)

  const upload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar.')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 8 MB.')
      return
    }

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const d = await res.json()
      if (d.error) {
        toast.error(d.error)
        return
      }
      onChange(d.url)
      toast.success('Gambar berhasil diupload!', {
        description: `${(file.size / 1024).toFixed(1)} KB → /uploads/${d.url.split('/').pop()}`,
      })
    } catch (e) {
      toast.error('Gagal upload gambar.')
    } finally {
      setUploading(false)
    }
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) upload(file)
    // Reset input so the same file can be re-selected
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) upload(file)
  }

  const handlePasteUrl = () => {
    const url = urlInputRef.current?.value.trim()
    if (!url) return
    onChange(url)
    setShowUrlInput(false)
    if (urlInputRef.current) urlInputRef.current.value = ''
    toast.success('URL gambar disimpan.')
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && (
        <label className="text-xs font-condensed uppercase font-bold flex items-center gap-2">
          <Upload className="w-3 h-3" /> {label}
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="ml-auto text-[10px] text-[var(--brand-ink-muted)] hover:text-[var(--brand-ink)] normal-case tracking-normal flex items-center gap-1"
          >
            <Link2 className="w-3 h-3" /> {showUrlInput ? 'Upload file' : 'Atau pakai URL'}
          </button>
        </label>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        onChange={handleFile}
        className="hidden"
      />

      {/* URL input mode */}
      {showUrlInput ? (
        <div className="flex gap-2">
          <input
            ref={urlInputRef}
            type="url"
            defaultValue={value}
            placeholder="https://contoh.com/gambar.jpg"
            className="flex-grow border border-[var(--brand-ink)] p-2 text-sm bg-[var(--brand-surface)] focus:outline-none focus:border-[var(--brand-maroon)]"
          />
          <button
            type="button"
            onClick={handlePasteUrl}
            className="px-3 py-2 bg-[var(--brand-ink)] text-[var(--brand-surface)] text-xs uppercase font-condensed hover:bg-[var(--brand-maroon)]"
          >
            Simpan
          </button>
        </div>
      ) : value ? (
        // Preview with replace/remove actions
        <div className="border border-[var(--brand-ink)] bg-[var(--brand-surface-2)] p-2">
          <div className="relative aspect-[4/3] overflow-hidden border border-[var(--brand-border)] bg-[var(--brand-surface)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt={altText}
              className={cn('w-full h-full object-cover', grayscale && 'grayscale')}
              onError={(e) => {
                // If image fails to load, show fallback
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
            <div className="absolute top-1 right-1 flex gap-1">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="bg-[var(--brand-ink)] text-[var(--brand-surface)] p-1.5 hover:bg-[var(--brand-maroon)] transition-colors"
                title="Ganti gambar"
              >
                {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
              </button>
              <button
                type="button"
                onClick={() => onChange('')}
                disabled={uploading}
                className="bg-[var(--brand-maroon)] text-white p-1.5 hover:bg-red-700 transition-colors"
                title="Hapus gambar"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="absolute bottom-1 left-1 bg-[var(--brand-ink)]/80 text-[var(--brand-surface)] px-1.5 py-0.5 text-[9px] uppercase tracking-widest font-condensed flex items-center gap-1">
              <Check className="w-2.5 h-2.5" /> Terunggah
            </div>
          </div>
          <p className="text-[10px] text-[var(--brand-ink-muted)] mt-1 truncate font-mono">
            {value}
          </p>
        </div>
      ) : (
        // Drop zone
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          disabled={uploading}
          className={cn(
            'border-2 border-dashed p-6 text-center transition-all flex flex-col items-center justify-center gap-2 min-h-[120px]',
            dragOver
              ? 'border-[var(--brand-orange)] bg-[var(--brand-orange)]/15 scale-[1.01]'
              : 'border-[var(--brand-ink)]/40 bg-[var(--brand-surface-2)] hover:border-[var(--brand-ink)] hover:bg-[var(--brand-surface)]',
            uploading && 'opacity-70 cursor-wait'
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin text-[var(--brand-orange)]" />
              <p className="text-xs font-condensed uppercase tracking-widest text-[var(--brand-ink-muted)]">
                Mengupload & meresize...
              </p>
            </>
          ) : (
            <>
              <Upload className="w-6 h-6 text-[var(--brand-ink-muted)]" />
              <p className="text-xs font-condensed uppercase tracking-widest">
                Klik atau drag & drop gambar
              </p>
              <p className="text-[10px] text-[var(--brand-ink-muted)]">
                JPG, PNG, WebP, GIF • maks 8 MB
              </p>
            </>
          )}
        </button>
      )}

      {hint && <p className="text-[10px] text-[var(--brand-ink-muted)]">{hint}</p>}
    </div>
  )
}
