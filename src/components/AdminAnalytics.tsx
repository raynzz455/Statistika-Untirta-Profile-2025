'use client'

import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts'
import { TrendingUp, BarChart3, Heart, MessageSquare, Calendar, Users, FileText, Image, Bookmark } from 'lucide-react'
import { ScrollReveal } from '@/components/ScrollReveal'

interface Analytics {
  articlesByCategory: { category: string; count: number }[]
  topArticlesByLikes: { id: string; title: string; likes: number }[]
  topArticlesByComments: { id: string; title: string; comments: number }[]
  eventsByRsvp: { id: string; title: string; rsvps: number }[]
  rsvpBreakdown: { status: string; count: number }[]
  contentOverTime: { label: string; articles: number; events: number; comments: number; likes: number; gallery: number }[]
  totals: {
    articles: number
    events: number
    comments: number
    likes: number
    gallery: number
    users: number
    students: number
    bookmarks: number
  }
}

const PIE_COLORS = ['var(--brand-orange)', '#5d8fb5', 'var(--brand-navy)', '#f9d8e5', '#1a1a1a', '#d4eff9']
const STATUS_COLORS: Record<string, string> = {
  hadir: '#0a7a3f',
  mungkin: '#b58200',
  tidak: 'var(--brand-navy)',
}
const STATUS_LABELS: Record<string, string> = {
  hadir: 'Hadir',
  mungkin: 'Mungkin',
  tidak: 'Tidak Hadir',
}

export function AdminAnalytics() {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/analytics')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error)
        else setData(d)
      })
      .catch(() => setError('Gagal memuat analytics'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border border-[var(--brand-ink)] p-6 bg-[var(--brand-surface-2)] h-64 animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="border border-[var(--brand-maroon)] bg-[var(--brand-orange)]/15 p-4 text-sm">
        {error}
      </div>
    )
  }

  if (!data) return null

  const totalCards = [
    { label: 'Artikel', value: data.totals.articles, icon: FileText, color: 'bg-[var(--brand-orange)]/15' },
    { label: 'Event', value: data.totals.events, icon: Calendar, color: 'bg-[var(--brand-navy)]/15' },
    { label: 'Komentar', value: data.totals.comments, icon: MessageSquare, color: 'bg-[var(--brand-surface-3)]' },
    { label: 'Likes', value: data.totals.likes, icon: Heart, color: 'bg-[var(--brand-orange)]' },
    { label: 'Galeri', value: data.totals.gallery, icon: Image, color: 'bg-[var(--brand-surface-2)]' },
    { label: 'Users', value: data.totals.users, icon: Users, color: 'bg-[var(--brand-orange)]/15' },
    { label: 'Mahasiswa', value: data.totals.students, icon: Users, color: 'bg-[var(--brand-navy)]/15' },
    { label: 'Bookmarks', value: data.totals.bookmarks, icon: Bookmark, color: 'bg-[var(--brand-surface-3)]' },
  ]

  return (
    <div className="mt-12 border-t-2 border-dashed border-[var(--brand-ink)] pt-12">
      <h2 className="font-condensed text-3xl uppercase tracking-tight flex items-center gap-2 mb-2">
        <BarChart3 className="w-6 h-6 text-[var(--brand-orange)]" /> Analytics & Insights
      </h2>
      <p className="font-body text-sm text-[var(--brand-ink-muted)] mb-6">
        Ringkasan aktivitas konten dan engagement angkatan.
      </p>

      {/* Totals grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {totalCards.map((c, i) => {
          const Icon = c.icon
          return (
            <ScrollReveal
              key={c.label}
              delay={((i % 4) + 1) as 1 | 2 | 3 | 4}
              className={`border border-[var(--brand-ink)] p-4 ${c.color} shadow-hard`}
            >
              <Icon className="w-5 h-5 mb-2 text-[var(--brand-maroon)]" />
              <p className="font-condensed text-3xl uppercase leading-none pop-in">{c.value}</p>
              <p className="font-condensed text-[10px] uppercase tracking-widest text-[var(--brand-ink)]/70 mt-1 font-bold">{c.label}</p>
            </ScrollReveal>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content over time (last 7 days) */}
        <ScrollReveal className="border border-[var(--brand-ink)] p-5 bg-[var(--brand-surface-2)] shadow-hard" delay={1}>
          <h3 className="font-condensed text-lg uppercase mb-1 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[var(--brand-orange)]" /> Aktivitas 7 Hari Terakhir
          </h3>
          <p className="text-[10px] uppercase tracking-widest text-[var(--brand-ink-muted)] mb-4">Artikel, event, komentar, likes, galeri per hari</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data.contentOverTime} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--brand-border)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--brand-ink-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--brand-ink-muted)' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--brand-surface)',
                  border: '1px solid var(--brand-ink)',
                  borderRadius: 0,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="articles" stroke="var(--brand-orange)" strokeWidth={2} name="Artikel" dot={{ r: 3 }} />
              <Line type="monotone" dataKey="comments" stroke="#5d8fb5" strokeWidth={2} name="Komentar" dot={{ r: 3 }} />
              <Line type="monotone" dataKey="likes" stroke="var(--brand-navy)" strokeWidth={2} name="Likes" dot={{ r: 3 }} />
              <Line type="monotone" dataKey="events" stroke="#1a1a1a" strokeWidth={2} name="Event" dot={{ r: 3 }} />
              <Line type="monotone" dataKey="gallery" stroke="#b58200" strokeWidth={2} name="Galeri" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ScrollReveal>

        {/* Articles by category */}
        <ScrollReveal className="border border-[var(--brand-ink)] p-5 bg-[var(--brand-surface-2)] shadow-hard" delay={2}>
          <h3 className="font-condensed text-lg uppercase mb-1 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[var(--brand-orange)]" /> Artikel per Kategori
          </h3>
          <p className="text-[10px] uppercase tracking-widest text-[var(--brand-ink-muted)] mb-4">Distribusi artikel berdasarkan kategori</p>
          {data.articlesByCategory.length === 0 ? (
            <p className="text-sm italic text-[var(--brand-ink-muted)] py-12 text-center">Belum ada artikel.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={data.articlesByCategory}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry: any) => `${entry.category}: ${entry.count}`}
                  labelLine={false}
                >
                  {data.articlesByCategory.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="var(--brand-ink)" strokeWidth={1} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--brand-surface)',
                    border: '1px solid var(--brand-ink)',
                    borderRadius: 0,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ScrollReveal>

        {/* Top articles by likes */}
        <ScrollReveal className="border border-[var(--brand-ink)] p-5 bg-[var(--brand-surface-2)] shadow-hard" delay={3}>
          <h3 className="font-condensed text-lg uppercase mb-1 flex items-center gap-2">
            <Heart className="w-4 h-4 text-[var(--brand-orange)]" /> Artikel Terpopuler (by Likes)
          </h3>
          <p className="text-[10px] uppercase tracking-widest text-[var(--brand-ink-muted)] mb-4">Top 5 artikel dengan likes terbanyak</p>
          {data.topArticlesByLikes.length === 0 ? (
            <p className="text-sm italic text-[var(--brand-ink-muted)] py-12 text-center">Belum ada likes.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.topArticlesByLikes} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--brand-border)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--brand-ink-muted)' }} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="title"
                  tick={{ fontSize: 10, fill: 'var(--brand-ink-muted)' }}
                  width={120}
                  tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 18) + '…' : v}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--brand-surface)',
                    border: '1px solid var(--brand-ink)',
                    borderRadius: 0,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="likes" fill="var(--brand-orange)" name="Likes" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ScrollReveal>

        {/* RSVP breakdown */}
        <ScrollReveal className="border border-[var(--brand-ink)] p-5 bg-[var(--brand-surface-2)] shadow-hard" delay={4}>
          <h3 className="font-condensed text-lg uppercase mb-1 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[var(--brand-orange)]" /> Status RSVP Event
          </h3>
          <p className="text-[10px] uppercase tracking-widest text-[var(--brand-ink-muted)] mb-4">Distribusi konfirmasi kehadiran</p>
          {data.rsvpBreakdown.length === 0 ? (
            <p className="text-sm italic text-[var(--brand-ink-muted)] py-12 text-center">Belum ada RSVP.</p>
          ) : (
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={data.rsvpBreakdown.map((r) => ({ ...r, label: STATUS_LABELS[r.status] || r.status }))}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={(entry: any) => `${entry.label}: ${entry.count}`}
                    labelLine={false}
                  >
                    {data.rsvpBreakdown.map((r, i) => (
                      <Cell key={i} fill={STATUS_COLORS[r.status] || '#999'} stroke="var(--brand-ink)" strokeWidth={1} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--brand-surface)',
                      border: '1px solid var(--brand-ink)',
                      borderRadius: 0,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Events with most RSVPs */}
              {data.eventsByRsvp.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-condensed text-[var(--brand-ink-muted)] mb-2">Event dengan RSVP terbanyak:</p>
                  <ul className="text-xs space-y-1">
                    {data.eventsByRsvp.slice(0, 3).map((e, i) => (
                      <li key={e.id} className="flex justify-between gap-2">
                        <span className="truncate">{i + 1}. {e.title}</span>
                        <span className="font-bold text-[var(--brand-orange)]">{e.rsvps}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </ScrollReveal>
      </div>

      {/* Top articles by comments (full width) */}
      {data.topArticlesByComments.length > 0 && (
        <ScrollReveal className="border border-[var(--brand-ink)] p-5 bg-[var(--brand-surface-2)] shadow-hard mt-6" delay={1}>
          <h3 className="font-condensed text-lg uppercase mb-1 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[var(--brand-orange)]" /> Artikel Paling Banyak Dikomentari
          </h3>
          <p className="text-[10px] uppercase tracking-widest text-[var(--brand-ink-muted)] mb-4">Top 5 artikel dengan komentar terbanyak</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.topArticlesByComments} margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--brand-border)" />
              <XAxis
                dataKey="title"
                tick={{ fontSize: 10, fill: 'var(--brand-ink-muted)' }}
                tickFormatter={(v: string) => v.length > 15 ? v.slice(0, 15) + '…' : v}
              />
              <YAxis tick={{ fontSize: 11, fill: 'var(--brand-ink-muted)' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--brand-surface)',
                  border: '1px solid var(--brand-ink)',
                  borderRadius: 0,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="comments" fill="#5d8fb5" name="Komentar" />
            </BarChart>
          </ResponsiveContainer>
        </ScrollReveal>
      )}
    </div>
  )
}
