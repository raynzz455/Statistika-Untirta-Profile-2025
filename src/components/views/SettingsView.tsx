'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { PlaceholderImage } from '@/components/PlaceholderImage'
import { ImageUploader } from '@/components/ImageUploader'
import { SavedArticles } from '@/components/SavedArticles'
import { toast } from 'sonner'
import { User as UserIcon, Save, Image as ImageIcon, UserCheck, Trash2, Music2, Youtube, Play } from 'lucide-react'

export function SettingsView() {
  const user = useAppStore((s) => s.user)
  const setView = useAppStore((s) => s.setView)
  const [profile, setProfile] = useState({
    name: '',
    tagline: 'Mencari makna di balik data.',
    bio: 'Saya adalah mahasiswa Statistika Untirta yang sedang belajar.',
    instagram: '',
    asalDaerah: '',
    imageUrl: '',
    lagu: '',
    laguArtis: '',
    laguUrl: '',
  })
  const [saved, setSaved] = useState(false)
  const [studentId, setStudentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    // Try to find a student linked to this user
    fetch('/api/students')
      .then((r) => r.json())
      .then((d) => {
        const mine = (d.students || []).find((s: any) => s.ownerId === user.id)
        if (mine) {
          setStudentId(mine.id)
          setProfile({
            name: mine.name,
            tagline: mine.tagline || '',
            bio: mine.bio || '',
            instagram: mine.instagram || '',
            asalDaerah: mine.asalDaerah || '',
            imageUrl: mine.imageUrl || '',
            lagu: mine.lagu || '',
            laguArtis: mine.laguArtis || '',
            laguUrl: mine.laguUrl || '',
          })
        } else {
          setProfile((p) => ({ ...p, name: user.displayName || user.username }))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-20 border border-[var(--brand-ink)] bg-[var(--brand-surface-2)] p-8">
        <h2 className="font-serif text-3xl mb-2">Login Diperlukan</h2>
        <p className="text-sm text-[var(--brand-ink-muted)] mb-6">Silakan login untuk mengatur profil Anda.</p>
        <button
          onClick={() => setView('login')}
          className="inline-flex items-center gap-2 bg-[var(--brand-ink)] text-white px-6 py-3 font-condensed uppercase tracking-widest text-xs font-bold hover:bg-[var(--brand-maroon)]"
        >
          Ke Halaman Login
        </button>
      </div>
    )
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(false)

    // If we have a student profile linked, update it via API
    if (studentId) {
      // IMPORTANT: send imageUrl as the ACTUAL string value (even if empty).
      // Previously we sent `imageUrl: profile.imageUrl || undefined` which
      // converted empty string → undefined → backend skipped the field →
      // photo was never cleared in DB when user clicked the X remove button.
      // Now: empty string reaches the PUT handler, which calls
      // db.student.update({ data: { imageUrl: '' } }) — clears the field.
      const res = await fetch(`/api/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        // cache: 'no-store' ensures the PUT itself isn't cached (defensive)
        cache: 'no-store',
        body: JSON.stringify({
          tagline: profile.tagline,
          bio: profile.bio,
          instagram: profile.instagram,
          asalDaerah: profile.asalDaerah,
          imageUrl: profile.imageUrl, // empty string is intentional — clears DB field
          lagu: profile.lagu || null,
          laguArtis: profile.laguArtis || null,
          laguUrl: profile.laguUrl || null,
        }),
      })
      const d = await res.json()
      if (d.error) return toast.error(d.error)
      toast.success('Profil berhasil diperbarui!')
      // Force a refetch of /api/students so any other view (DirectoryView)
      // gets fresh data when user navigates there. The backend now sets
      // Cache-Control: no-store, but in case the browser still has an old
      // response cached from before, this busts it.
      // (We don't await — fire and forget.)
      fetch('/api/students', { cache: 'no-store' }).catch(() => {})
    } else {
      // No linked student - just simulate save (could be extended to create student profile)
      toast.success('Profil pengguna disimpan (belum tertaut ke direktori mahasiswa).')
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="max-w-2xl mx-auto my-8 page-enter">
      <div className="mb-8 pb-4 border-b border-[var(--brand-ink)]">
        <h1 className="font-condensed text-4xl uppercase tracking-tight">Pengaturan Profil</h1>
        <p className="font-body text-sm text-[var(--brand-ink-muted)] mt-1">
          Perbarui informasi yang akan tampil di halaman direktori. Akun: <strong>{user.username}</strong> ({user.role}).
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-[var(--brand-surface)] border border-[var(--brand-ink)] p-6 md:p-10 shadow-hard flex flex-col gap-6">
        {saved && (
          <div className="bg-[var(--brand-navy)]/15 text-[var(--brand-ink)] border border-[var(--brand-ink)] p-3 text-sm font-bold font-body flex items-center gap-2">
            <Save className="w-4 h-4" /> Profil berhasil diperbarui!
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="w-32 h-32 flex-shrink-0 border border-[var(--brand-ink)] bg-[var(--brand-surface-2)] relative overflow-hidden">
            <PlaceholderImage
              alt="Foto Profil"
              src={profile.imageUrl || undefined}
              grayscale
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors cursor-pointer">
              <ImageIcon className="w-5 h-5 text-white opacity-0 hover:opacity-100" />
            </div>
          </div>
          <div className="flex-grow w-full flex flex-col gap-4">
            <div>
              <label className="block text-xs font-condensed uppercase font-bold mb-1 flex items-center gap-1">
                <UserIcon className="w-3 h-3" /> Nama Tampilan
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                disabled={user.role !== 'admin'}
                className="w-full border border-[var(--brand-ink)] p-2.5 text-sm bg-[var(--brand-surface-2)] disabled:opacity-60"
              />
              {user.role !== 'admin' && (
                <p className="text-[10px] text-[var(--brand-ink-muted)] mt-1">
                  Nama resmi hanya dapat diubah admin. Hubungi admin untuk perubahan.
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-condensed uppercase font-bold mb-1">Instagram</label>
              <input
                type="text"
                value={profile.instagram}
                onChange={(e) => setProfile({ ...profile, instagram: e.target.value })}
                className="w-full border border-[var(--brand-ink)] p-2.5 text-sm bg-[var(--brand-surface-2)]"
                placeholder="@username"
              />
            </div>
            <div>
              <ImageUploader
                value={profile.imageUrl}
                onChange={(url) => setProfile({ ...profile, imageUrl: url })}
                label="Foto Profil"
                hint="Upload file atau tempel URL. Foto profil akan tampil di direktori."
                altText={`Foto ${profile.name || 'profil'}`}
                grayscale
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-condensed uppercase font-bold mb-1">Tagline (Quote)</label>
          <input
            type="text"
            value={profile.tagline}
            onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
            className="w-full border border-[var(--brand-ink)] p-2.5 text-sm bg-[var(--brand-surface-2)]"
          />
        </div>

        <div>
          <label className="block text-xs font-condensed uppercase font-bold mb-1">Biografi Singkat</label>
          <textarea
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            rows={4}
            className="w-full border border-[var(--brand-ink)] p-2.5 text-sm resize-none bg-[var(--brand-surface-2)]"
          />
        </div>

        <div>
          <label className="block text-xs font-condensed uppercase font-bold mb-1">Asal Daerah</label>
          <input
            type="text"
            value={profile.asalDaerah}
            onChange={(e) => setProfile({ ...profile, asalDaerah: e.target.value })}
            className="w-full border border-[var(--brand-ink)] p-2.5 text-sm bg-[var(--brand-surface-2)]"
            placeholder="Serang, Banten"
          />
        </div>

        {/* === LAGU TEMA === */}
        <div className="border-t border-[var(--brand-border)] pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-condensed uppercase font-bold text-[var(--brand-navy)]">
              Lagu Tema
            </h3>
            {profile.laguUrl && (
              <button
                type="button"
                onClick={() => setProfile({ ...profile, lagu: '', laguArtis: '', laguUrl: '' })}
                className="text-[10px] font-condensed uppercase tracking-widest text-[var(--brand-orange)] hover:text-red-600 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Hapus Lagu
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-[10px] font-condensed uppercase tracking-widest text-[var(--brand-ink-muted)] mb-1">
                Judul Lagu
              </label>
              <input
                type="text"
                value={profile.lagu}
                onChange={(e) => setProfile({ ...profile, lagu: e.target.value })}
                className="w-full border-b-2 border-[var(--brand-border)] py-1.5 text-sm bg-transparent focus:outline-none focus:border-[var(--brand-navy)]"
                placeholder="cth: Karnadi Anem Karnak"
              />
            </div>
            <div>
              <label className="block text-[10px] font-condensed uppercase tracking-widest text-[var(--brand-ink-muted)] mb-1">
                Artis / Penyanyi
              </label>
              <input
                type="text"
                value={profile.laguArtis}
                onChange={(e) => setProfile({ ...profile, laguArtis: e.target.value })}
                className="w-full border-b-2 border-[var(--brand-border)] py-1.5 text-sm bg-transparent focus:outline-none focus:border-[var(--brand-navy)]"
                placeholder="cth: NDX A.K.A."
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-condensed uppercase tracking-widest text-[var(--brand-ink-muted)] mb-1">
              URL Lagu
            </label>
            <input
              type="url"
              value={profile.laguUrl}
              onChange={(e) => setProfile({ ...profile, laguUrl: e.target.value })}
              className="w-full border-b-2 border-[var(--brand-border)] py-1.5 text-sm font-mono bg-transparent focus:outline-none focus:border-[var(--brand-navy)]"
              placeholder="https://..."
            />
            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-[10px]">
              <div className="border border-[var(--brand-border)] bg-[var(--brand-surface-2)] p-2">
                <p className="font-condensed uppercase tracking-widest text-[#1DB954] mb-0.5 flex items-center gap-1">
                  <Music2 className="w-3 h-3" /> Spotify
                </p>
                <p className="text-[9px] text-[var(--brand-ink-muted)] font-mono truncate">
                  open.spotify.com/track/...
                </p>
              </div>
              <div className="border border-[var(--brand-border)] bg-[var(--brand-surface-2)] p-2">
                <p className="font-condensed uppercase tracking-widest text-[#FF0000] mb-0.5 flex items-center gap-1">
                  <Youtube className="w-3 h-3" /> YouTube
                </p>
                <p className="text-[9px] text-[var(--brand-ink-muted)] font-mono truncate">
                  youtu.be/... atau watch?v=...
                </p>
              </div>
              <div className="border border-[var(--brand-border)] bg-[var(--brand-surface-2)] p-2">
                <p className="font-condensed uppercase tracking-widest text-[var(--brand-navy)] mb-0.5 flex items-center gap-1">
                  <Play className="w-3 h-3" /> File MP3
                </p>
                <p className="text-[9px] text-[var(--brand-ink-muted)] font-mono truncate">
                  link langsung .mp3 / .ogg
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--brand-ink)] pt-6 flex flex-col md:flex-row justify-between gap-2">
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setView('profile', studentId || undefined)}
              disabled={!studentId}
              className="text-xs uppercase font-condensed text-[var(--brand-ink-muted)] hover:text-[var(--brand-ink)] disabled:opacity-50"
            >
              Lihat Profil Saya →
            </button>
            {!studentId && (
              <button
                type="button"
                onClick={() => setView('claim-profile')}
                className="text-xs uppercase font-condensed text-[var(--brand-navy)] hover:text-[var(--brand-orange)] border border-[var(--brand-navy)] px-3 py-1.5 hover:border-[var(--brand-orange)] transition-colors inline-flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5" /> Klaim Profil Mahasiswa (via NIM)
              </button>
            )}
          </div>
          <button
            type="submit"
            className="bg-[var(--brand-ink)] text-white px-8 py-3 font-condensed uppercase tracking-widest text-sm hover:bg-[var(--brand-maroon)] transition-colors inline-flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Simpan Perubahan
          </button>
        </div>
      </form>

      {/* Saved articles section */}
      <SavedArticles />
    </div>
  )
}
