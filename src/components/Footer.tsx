'use client'

import { useState } from 'react'
import { Mail, Instagram, MapPin, Send } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

export function Footer() {
  const setView = useAppStore((s) => s.setView)
  const [email, setEmail] = useState('')

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    toast.success('Terima kasih! Email Anda terdaftar untuk update.', {
      description: 'Kami akan mengirim info terbaru angkatan Statistika 25.',
    })
    setEmail('')
  }

  return (
    <footer className="mt-auto border-t border-[var(--brand-border)] bg-[var(--brand-surface-2)]">
      {/* Top strip with newsletter */}
      <div className="bg-[var(--brand-ink)] text-white py-8 px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div>
            <h3 className="font-condensed text-2xl md:text-3xl uppercase tracking-wide font-bold mb-1">
              Berlangganan <span className="text-[var(--brand-orange)]">Info Angkatan</span>
            </h3>
            <p className="font-sans text-sm text-white/70">
              Dapatkan pengumuman, jadwal UTS, dan info event langsung ke email Anda.
            </p>
          </div>
          <form onSubmit={subscribe} className="flex gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alamat@email.anda"
              className="flex-grow bg-[var(--brand-surface)]/10 border border-white/20 px-4 py-3 text-sm placeholder:text-white/40 focus:outline-none focus:border-[var(--brand-orange)]"
            />
            <button
              type="submit"
              className="bg-[var(--brand-orange)] text-[var(--brand-ink)] font-condensed uppercase tracking-widest text-sm font-bold px-6 py-3 hover:bg-[var(--brand-surface)] transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" /> Daftar
            </button>
          </form>
        </div>
      </div>

      {/* Main footer content */}
      <div className="py-12 px-4 md:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
        <div className="col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 border border-[var(--brand-ink)] rounded-full flex flex-col items-center justify-center p-1 flex-shrink-0">
              <span className="font-condensed text-[8px] uppercase leading-none">EST. 2023</span>
              <span className="font-condensed text-sm leading-none tracking-tight my-0.5">UNTIRTA</span>
              <span className="font-condensed text-[6px] uppercase leading-none">BANTEN</span>
            </div>
            <div>
              <h4 className="font-condensed text-xl uppercase tracking-tight leading-none mb-1">
                Statistika <span className="text-[var(--brand-orange)]">'25</span>
              </h4>
              <p className="font-sans text-xs text-[var(--brand-ink-muted)]">Profil Angkatan Universitas Sultan Ageng Tirtayasa</p>
            </div>
          </div>
          <p className="font-serif italic text-sm text-[var(--brand-ink-muted)] mb-4 max-w-md">
            "Data • Analisis • Probabilitas — bersama mengukir jejak angkatan 2025 di kampus Cilegon."
          </p>
          <div className="flex items-center gap-3 text-xs text-[var(--brand-ink-muted)]">
            <MapPin className="w-4 h-4" />
            <span>Kampus Cilegon, Fakultas Teknik, Untirta</span>
          </div>
        </div>

        <div>
          <h4 className="font-condensed text-sm uppercase tracking-widest font-bold mb-3 pb-2 border-b border-[var(--brand-border)]">
            Navigasi
          </h4>
          <ul className="space-y-2 text-sm">
            {[
              { label: 'Beranda', v: 'home' as const },
              { label: 'Direktori Mahasiswa', v: 'directory' as const },
              { label: 'Rotasi Kelas', v: 'classes' as const },
              { label: 'Galeri Momen', v: 'gallery' as const },
              { label: 'Aspirasi Mahasiswa', v: 'aspirasi' as const },
              { label: 'Tentang Prodi', v: 'about' as const },
            ].map((link) => (
              <li key={link.v}>
                <button
                  onClick={() => setView(link.v)}
                  className="font-sans text-[var(--brand-ink-muted)] hover:text-[var(--brand-ink)] hover:underline transition-colors"
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-condensed text-sm uppercase tracking-widest font-bold mb-3 pb-2 border-b border-[var(--brand-border)]">
            Kontak
          </h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2 text-[var(--brand-ink-muted)]">
              <Mail className="w-4 h-4 flex-shrink-0" />
              <span>statistika25@untirta.ac.id</span>
            </li>
            <li className="flex items-center gap-2 text-[var(--brand-ink-muted)]">
              <Instagram className="w-4 h-4 flex-shrink-0" />
              <span>@statistika25.untirta</span>
            </li>
            <li className="flex items-center gap-2 text-[var(--brand-ink-muted)]">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span>Gedung Cilegon, Cilegon</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[var(--brand-border)] py-4 px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-[var(--brand-ink-muted)]">
        <p className="font-sans">
          © {new Date().getFullYear()} Statistika '25 Untirta. Dibuat dengan dedikasi angkatan.
        </p>
        <p className="font-condensed uppercase tracking-widest text-[10px]">
          Data is the new oil • and we are the refinery
        </p>
      </div>
    </footer>
  )
}
