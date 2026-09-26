'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { PlaceholderImage } from '@/components/PlaceholderImage'
import { ScrollReveal } from '@/components/ScrollReveal'
import { FollowButton } from '@/components/FollowButton'
import { ArrowLeft, Calendar, FileText, Heart, Image, MessageSquare, Users, MapPin, Instagram, Award, TrendingUp, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MemberProfileData {
  user: {
    id: string
    username: string
    displayName: string | null
    role: string
    memberSince: string
  }
  student: {
    id: string
    name: string
    nim: string
    kelas: string
    tagline: string | null
    bio: string | null
    instagram: string | null
    asalDaerah: string | null
    imageUrl: string | null
  } | null
  stats: {
    articles: number
    events: number
    gallery: number
    comments: number
    likesReceived: number
    followers: number
    following: number
  }
  recentActivity: {
    articles: any[]
    events: any[]
    gallery: any[]
    comments: any[]
  }
}

export function MemberProfileView() {
  const selectedId = useAppStore((s) => s.selectedId)
  const setView = useAppStore((s) => s.setView)
  const me = useAppStore((s) => s.user)
  const [data, setData] = useState<MemberProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'articles' | 'events' | 'gallery' | 'comments'>('articles')

  useEffect(() => {
    if (!selectedId) {
      setLoading(false)
      return
    }
    setLoading(true)
    fetch(`/api/users/${selectedId}/profile`)
      .then((r) => r.json())
      .then((d) => setData(d.error ? null : d))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [selectedId])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="h-8 bg-[var(--brand-orange)]/15/40 animate-pulse mb-4 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="aspect-square bg-[var(--brand-orange)]/15/40 animate-pulse" />
          <div className="md:col-span-2 space-y-3">
            <div className="h-6 bg-[var(--brand-orange)]/15/40 animate-pulse" />
            <div className="h-4 bg-[var(--brand-orange)]/15/40 animate-pulse w-2/3" />
            <div className="h-4 bg-[var(--brand-orange)]/15/40 animate-pulse w-1/2" />
          </div>
        </div>
      </div>
    )
  }

  if (!data || !data.user) {
    return (
      <div className="max-w-md mx-auto text-center py-20 border border-[var(--brand-ink)] bg-[var(--brand-surface-2)] p-8">
        <Users className="w-12 h-12 mx-auto mb-4 text-[var(--brand-ink-muted)]" />
        <h2 className="font-serif text-3xl mb-2">Member tidak ditemukan</h2>
        <button
          onClick={() => setView('directory')}
          className="text-[var(--brand-orange)] underline"
        >
          Kembali ke Direktori
        </button>
      </div>
    )
  }

  const { user, student, stats, recentActivity } = data
  const displayName = student?.name || user.displayName || user.username

  const tabs = [
    { key: 'articles' as const, label: 'Artikel', count: stats.articles, icon: FileText },
    { key: 'events' as const, label: 'Event', count: stats.events, icon: Calendar },
    { key: 'gallery' as const, label: 'Galeri', count: stats.gallery, icon: Image },
    { key: 'comments' as const, label: 'Komentar', count: stats.comments, icon: MessageSquare },
  ]

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    } catch { return iso }
  }

  return (
    <div className="max-w-5xl mx-auto page-enter">
      <button
        onClick={() => setView('directory')}
        className="inline-flex items-center text-xs uppercase tracking-widest font-bold mb-8 hover:text-[var(--brand-maroon)] transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
      </button>

      {/* Hero header */}
      <ScrollReveal className="border-2 border-[var(--brand-ink)] bg-[var(--brand-surface-2)] shadow-hard-lg overflow-hidden mb-8">
        <div className="candy-stripe h-3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
          {/* Avatar */}
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 border-4 double border-[var(--brand-ink)] overflow-hidden">
              <PlaceholderImage
                alt={`Foto ${displayName}`}
                src={student?.imageUrl || undefined}
                grayscale
              />
            </div>
            {student && (
              <div className="mt-3 text-center">
                <p className="font-condensed text-[10px] uppercase tracking-widest text-[var(--brand-ink-muted)]">NIM</p>
                <p className="font-condensed">{student.nim}</p>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="md:col-span-2 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] uppercase tracking-widest font-condensed bg-[var(--brand-orange)]/15 border border-[var(--brand-ink)] px-2 py-0.5">
                @{user.username}
              </span>
              {user.role === 'admin' && (
                <span className="text-[10px] uppercase tracking-widest font-condensed bg-[var(--brand-maroon)] text-white px-2 py-0.5 flex items-center gap-1">
                  <Award className="w-3 h-3" /> Admin
                </span>
              )}
              {student && (
                <span className="text-[10px] uppercase tracking-widest font-condensed bg-[var(--brand-navy)]/15 border border-[var(--brand-ink)] px-2 py-0.5">
                  Kelas {student.kelas}
                </span>
              )}
            </div>
            <h1 className="font-serif text-4xl font-bold mb-1 leading-tight">{displayName}</h1>
            {student?.tagline && (
              <p className="font-serif italic text-lg text-[var(--brand-ink-muted)] mb-3">"{student.tagline}"</p>
            )}
            <p className="text-xs text-[var(--brand-ink-muted)] font-condensed uppercase tracking-widest mb-4">
              Member sejak {formatDate(user.memberSince)}
            </p>

            {/* Contact info */}
            <div className="flex flex-wrap gap-3 mb-4">
              {student?.instagram && (
                <span className="inline-flex items-center gap-1 text-xs border border-[var(--brand-ink)] px-2 py-1 bg-[var(--brand-surface)]">
                  <Instagram className="w-3 h-3 text-[var(--brand-maroon)]" /> {student.instagram}
                </span>
              )}
              {student?.asalDaerah && (
                <span className="inline-flex items-center gap-1 text-xs border border-[var(--brand-ink)] px-2 py-1 bg-[var(--brand-surface)]">
                  <MapPin className="w-3 h-3 text-[var(--brand-maroon)]" /> {student.asalDaerah}
                </span>
              )}
            </div>

            {/* Follow button only (no messaging) */}
            <div className="flex flex-wrap items-center gap-3">
              <FollowButton targetUserId={user.id} size="md" />
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Stats row */}
      <ScrollReveal delay={1} className="grid grid-cols-2 md:grid-cols-7 gap-3 mb-8">
        {[
          { label: 'Artikel', value: stats.articles, icon: FileText, color: 'bg-[var(--brand-orange)]/15' },
          { label: 'Event', value: stats.events, icon: Calendar, color: 'bg-[var(--brand-navy)]/15' },
          { label: 'Galeri', value: stats.gallery, icon: Image, color: 'bg-[var(--brand-surface-3)]' },
          { label: 'Komentar', value: stats.comments, icon: MessageSquare, color: 'bg-[var(--brand-surface-2)]' },
          { label: 'Likes', value: stats.likesReceived, icon: Heart, color: 'bg-[var(--brand-orange)] text-white' },
          { label: 'Pengikut', value: stats.followers, icon: UserPlus, color: 'bg-[var(--brand-navy)]/15' },
          { label: 'Mengikuti', value: stats.following, icon: Users, color: 'bg-[var(--brand-surface-3)]' },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className={cn('border border-[var(--brand-ink)] p-4 text-center', s.color, 'shadow-hard')}>
              <Icon className="w-5 h-5 mx-auto mb-2 text-[var(--brand-maroon)]" />
              <p className="font-condensed text-2xl leading-none pop-in">{s.value}</p>
              <p className="font-condensed text-[10px] uppercase tracking-widest font-bold mt-1 text-[var(--brand-ink)]/70">{s.label}</p>
            </div>
          )
        })}
      </ScrollReveal>

      {/* Bio */}
      {student?.bio && (
        <ScrollReveal delay={2} className="border-l-4 border-[var(--brand-orange)] pl-4 mb-8 bg-[var(--brand-surface-2)] py-4 pr-4">
          <p className="text-[10px] uppercase tracking-widest font-condensed text-[var(--brand-ink-muted)] mb-2">Biografi</p>
          <p className="text-sm leading-relaxed">{student.bio}</p>
        </ScrollReveal>
      )}

      {/* Activity tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-[var(--brand-ink)] pb-2">
        {tabs.map((t) => {
          const Icon = t.icon
          const isActive = activeTab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={cn(
                'px-4 py-2 text-xs uppercase tracking-widest font-condensed border transition-all flex items-center gap-2',
                isActive
                  ? 'bg-[var(--brand-ink)] text-[var(--brand-surface)] border-[var(--brand-ink)]'
                  : 'bg-[var(--brand-surface-2)] text-[var(--brand-ink)] border-[var(--brand-ink)]/40 hover:border-[var(--brand-ink)]'
              )}
            >
              <Icon className="w-3.5 h-3.5" /> {t.label}
              <span className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full',
                isActive ? 'bg-[var(--brand-orange)] text-white' : 'bg-[var(--brand-orange)]/15 text-[var(--brand-ink)]'
              )}>{t.count}</span>
            </button>
          )
        })}
      </div>

      {/* Activity content */}
      <div className="min-h-[200px]">
        {activeTab === 'articles' && (
          recentActivity.articles.length === 0 ? (
            <EmptyState text="Belum ada artikel dipublikasi" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentActivity.articles.map((a, i) => (
                <ScrollReveal
                  key={a.id}
                  delay={((i % 3) + 1) as 1 | 2 | 3}
                  className="border border-[var(--brand-ink)] p-3 bg-[var(--brand-surface-2)] hover:shadow-hard transition-shadow cursor-pointer lift-on-hover"
                  onClick={() => setView('article-detail', a.id)}
                >
                  <div className="flex gap-3">
                    <div className="w-20 h-20 flex-shrink-0 border border-[var(--brand-ink)]">
                      <PlaceholderImage alt={a.title} src={a.imageUrl || undefined} grayscale />
                    </div>
                    <div className="flex-grow min-w-0">
                      <span className="text-[9px] uppercase tracking-widest font-condensed bg-[var(--brand-orange)]/15 border border-[var(--brand-ink)] px-1.5 py-0.5 inline-block mb-1">
                        {a.category}
                      </span>
                      <h3 className="font-serif font-bold text-sm leading-tight line-clamp-2 mb-1">{a.title}</h3>
                      <p className="text-[10px] text-[var(--brand-ink-muted)]">{a.date}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          )
        )}

        {activeTab === 'events' && (
          recentActivity.events.length === 0 ? (
            <EmptyState text="Belum ada event dibuat" />
          ) : (
            <div className="space-y-3">
              {recentActivity.events.map((e, i) => (
                <ScrollReveal
                  key={e.id}
                  delay={((i % 4) + 1) as 1 | 2 | 3 | 4}
                  className="border border-[var(--brand-ink)] p-3 bg-[var(--brand-surface-2)] hover:shadow-hard transition-shadow cursor-pointer lift-on-hover flex items-center gap-3"
                  onClick={() => setView('events')}
                >
                  <div className="w-12 h-12 flex-shrink-0 border border-[var(--brand-ink)]">
                    <PlaceholderImage alt={e.title} src={e.imageUrl || undefined} grayscale />
                  </div>
                  <div className="flex-grow min-w-0">
                    <span className="text-[9px] uppercase tracking-widest font-condensed bg-[var(--brand-navy)]/15 border border-[var(--brand-ink)] px-1.5 py-0.5 inline-block mb-1">
                      {e.category}
                    </span>
                    <h3 className="font-serif font-bold text-sm leading-tight line-clamp-1">{e.title}</h3>
                    <p className="text-[10px] text-[var(--brand-ink-muted)]">
                      {e.startDate}{e.location && ` • ${e.location}`}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          )
        )}

        {activeTab === 'gallery' && (
          recentActivity.gallery.length === 0 ? (
            <EmptyState text="Belum ada foto di galeri" />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {recentActivity.gallery.map((g, i) => (
                <ScrollReveal
                  key={g.id}
                  delay={((i % 4) + 1) as 1 | 2 | 3 | 4}
                  className="border border-[var(--brand-ink)] p-2 bg-[var(--brand-surface-2)] lift-on-hover"
                >
                  <div className="aspect-square border border-[var(--brand-ink)] mb-1">
                    <PlaceholderImage alt={g.caption} src={g.imageUrl || undefined} grayscale />
                  </div>
                  <p className="font-serif italic text-xs text-center line-clamp-1">{g.caption}</p>
                </ScrollReveal>
              ))}
            </div>
          )
        )}

        {activeTab === 'comments' && (
          recentActivity.comments.length === 0 ? (
            <EmptyState text="Belum ada komentar" />
          ) : (
            <div className="space-y-3">
              {recentActivity.comments.map((c, i) => (
                <ScrollReveal
                  key={c.id}
                  delay={((i % 4) + 1) as 1 | 2 | 3 | 4}
                  className="border-l-4 border-[var(--brand-orange)] pl-3 py-2 bg-[var(--brand-surface-2)] pr-3"
                >
                  <p className="text-sm leading-relaxed mb-1">{c.content}</p>
                  <p className="text-[10px] text-[var(--brand-ink-muted)]">
                    Pada "{c.article?.title || 'artikel dihapus'}" • {formatDate(c.createdAt)}
                  </p>
                </ScrollReveal>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-12 border border-dashed border-[var(--brand-ink)]/30 bg-[var(--brand-surface-2)]">
      <TrendingUp className="w-10 h-10 mx-auto mb-3 text-[var(--brand-ink-muted)]/50" />
      <p className="font-serif italic text-[var(--brand-ink-muted)]">{text}</p>
    </div>
  )
}
