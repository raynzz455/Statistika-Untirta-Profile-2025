'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Check, X as XIcon, HelpCircle, Users, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface RsvpUser {
  id: string
  username: string
  displayName: string | null
}

interface Rsvp {
  id: string
  status: 'hadir' | 'mungkin' | 'tidak'
  user: RsvpUser
}

interface RsvpCounts {
  hadir: number
  mungkin: number
  tidak: number
  total: number
}

type Status = 'hadir' | 'mungkin' | 'tidak'

const STATUS_CONFIG: Record<Status, { label: string; icon: any; color: string; bg: string }> = {
  hadir: { label: 'Hadir', icon: Check, color: 'text-[#0a7a3f]', bg: 'bg-[#d4f0d4] border-[#0a7a3f]' },
  mungkin: { label: 'Mungkin', icon: HelpCircle, color: 'text-[#b58200]', bg: 'bg-[#fff3cc] border-[#b58200]' },
  tidak: { label: 'Tidak Hadir', icon: XIcon, color: 'text-[var(--brand-maroon)]', bg: 'bg-[var(--brand-orange)]/15 border-[var(--brand-maroon)]' },
}

export function EventRSVP({ eventId }: { eventId: string }) {
  const user = useAppStore((s) => s.user)
  const [myStatus, setMyStatus] = useState<Status | null>(null)
  const [counts, setCounts] = useState<RsvpCounts>({ hadir: 0, mungkin: 0, tidak: 0, total: 0 })
  const [rsvps, setRsvps] = useState<Rsvp[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showAttendees, setShowAttendees] = useState(false)
  const [rsvpError, setRsvpError] = useState<string | null>(null)

  const load = () => {
    if (!user) {
      setLoading(false)
      return
    }
    setLoading(true)
    setRsvpError(null)
    // CRITICAL: cache: 'no-store' — without this, the browser caches the
    // GET response. After POST creates a new RSVP, load() is called but
    // the browser serves the CACHED old response (with 0 counts).
    // This was THE root cause of "pesertanya tidak bertambah sama sekali".
    fetch(`/api/events/${eventId}/rsvp`, { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) {
          console.warn('[EventRSVP] GET not ok:', r.status)
        }
        return r.json()
      })
      .then((d) => {
        console.log('[EventRSVP] load response:', { myStatus: d.myStatus, counts: d.counts, rsvpCount: d.rsvps?.length })
        setMyStatus(d.myStatus as Status | null)
        setCounts(d.counts || { hadir: 0, mungkin: 0, tidak: 0, total: 0 })
        setRsvps(Array.isArray(d.rsvps) ? d.rsvps : [])
      })
      .catch((err) => {
        console.error('[EventRSVP] load error:', err)
        setRsvpError('Gagal memuat data RSVP.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, user])

  const setStatus = async (status: Status) => {
    if (!user) {
      toast.error('Anda harus login untuk RSVP.')
      return
    }
    setSubmitting(true)
    setRsvpError(null)
    try {
      console.log('[EventRSVP] POST status:', status, 'eventId:', eventId)
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store', // bypass browser cache on POST too
        body: JSON.stringify({ status }),
      })
      const d = await res.json()
      console.log('[EventRSVP] POST response:', { ok: res.ok, status: res.status, data: d })

      if (d.error) {
        // Show error toast with LONGER duration (10s) so user actually sees it
        toast.error(d.error, { duration: 10000 })
        setRsvpError(d.error)
        return
      }

      // POST succeeded — update local state + reload fresh data
      setMyStatus(status)
      // Use setTimeout(0) to ensure the POST transaction is committed
      // before the GET fetch (defensive — PgBouncer transaction mode
      // might have slight visibility delay)
      setTimeout(() => load(), 100)
      toast.success(`Anda ${STATUS_CONFIG[status].label.toLowerCase()} event ini.`)
    } catch (err) {
      console.error('[EventRSVP] POST exception:', err)
      toast.error('Gagal terhubung ke server. Coba lagi.', { duration: 10000 })
      setRsvpError('Gagal memperbarui RSVP. Coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-[var(--brand-ink-muted)] py-2">
        <span className="w-4 h-4 border-2 border-[var(--brand-orange)] border-t-transparent rounded-full animate-spin" />
        Memuat RSVP...
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-xs text-[var(--brand-ink-muted)] italic py-1">
        Login untuk RSVP ke event ini.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Error banner — shows if POST or GET fails (visible, not just a toast) */}
      {rsvpError && (
        <div className="border border-[var(--brand-maroon)] bg-[var(--brand-orange)]/10 p-2 text-xs text-[var(--brand-maroon)] flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="flex-grow">{rsvpError}</span>
          <button
            onClick={() => { setRsvpError(null); load() }}
            className="text-[10px] uppercase tracking-widest font-condensed underline hover:no-underline"
          >
            Coba lagi
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {(['hadir', 'mungkin', 'tidak'] as Status[]).map((s) => {
          const cfg = STATUS_CONFIG[s]
          const Icon = cfg.icon
          const active = myStatus === s
          return (
            <button
              key={s}
              onClick={() => setStatus(s)}
              disabled={submitting}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-condensed uppercase tracking-widest border transition-all ${
                active
                  ? `${cfg.bg} ${cfg.color} scale-105`
                  : 'bg-transparent border-[var(--brand-ink)]/30 text-[var(--brand-ink-muted)] hover:border-[var(--brand-ink)] hover:text-[var(--brand-ink)]'
              } ${submitting ? 'opacity-50' : ''}`}
            >
              <Icon className="w-3 h-3" />
              {cfg.label}
              {counts[s] > 0 && (
                <span className="ml-1 bg-[var(--brand-ink)] text-[var(--brand-surface)] px-1 rounded-full text-[10px]">
                  {counts[s]}
                </span>
              )}
            </button>
          )
        })}

        <button
          onClick={() => setShowAttendees(!showAttendees)}
          className="ml-auto inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-[var(--brand-ink-muted)] hover:text-[var(--brand-ink)] font-condensed"
        >
          <Users className="w-3 h-3" /> {counts.total} peserta
        </button>
      </div>

      {showAttendees && rsvps.length > 0 && (
        <div className="border border-[var(--brand-border)] bg-[var(--brand-surface-2)] p-3 mt-1">
          <p className="text-[10px] uppercase tracking-widest font-condensed text-[var(--brand-ink-muted)] mb-2">
            Daftar Peserta
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['hadir', 'mungkin', 'tidak'] as Status[]).map((s) => {
              const cfg = STATUS_CONFIG[s]
              const Icon = cfg.icon
              const list = rsvps.filter((r) => r.status === s)
              if (list.length === 0) return null
              return (
                <div key={s} className={`border ${cfg.bg} p-2`}>
                  <p className={`text-[10px] uppercase tracking-widest font-condensed ${cfg.color} flex items-center gap-1 mb-1`}>
                    <Icon className="w-3 h-3" /> {cfg.label} ({list.length})
                  </p>
                  <ul className="text-xs space-y-0.5">
                    {list.map((r) => (
                      <li key={r.id} className="text-[var(--brand-ink)] truncate">
                        {/* Defensive: r.user may be null for Google OAuth users
                            not in Prisma users table. Use optional chaining. */}
                        {r.user?.displayName || r.user?.username || 'Anggota'}
                        {r.user?.id === user?.id && (
                          <span className="ml-1 text-[9px] uppercase tracking-widest font-condensed text-[var(--brand-orange)]">
                            Anda
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {showAttendees && rsvps.length === 0 && (
        <p className="text-xs italic text-[var(--brand-ink-muted)] py-2">Belum ada peserta yang RSVP.</p>
      )}
    </div>
  )
}
