'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { OpeningAnimation } from '@/components/OpeningAnimation'
import { HomeView } from '@/components/views/HomeView'
import { DirectoryView } from '@/components/views/DirectoryView'
import { ProfileView } from '@/components/views/ProfileView'
import { ClassesView } from '@/components/views/ClassesView'
import { GalleryView } from '@/components/views/GalleryView'
import { ArticlesView } from '@/components/views/ArticlesView'
import { ArticleDetailView } from '@/components/views/ArticleDetailView'
import { EventsView } from '@/components/views/EventsView'
import { AboutView } from '@/components/views/AboutView'
import { LoginView } from '@/components/views/LoginView'
import { AdminView } from '@/components/views/AdminView'
import { SettingsView } from '@/components/views/SettingsView'
import { MemberProfileView } from '@/components/views/MemberProfileView'
import { SeriesView } from '@/components/views/SeriesView'
import { SeriesDetailView } from '@/components/views/SeriesDetailView'
import { DosenDetailView } from '@/components/views/DosenDetailView'
import { AspirasiView } from '@/components/views/AspirasiView'
import { BackToTop } from '@/components/BackToTop'
import type { ViewName } from '@/lib/store'

const VALID_VIEWS: ViewName[] = [
  'home', 'directory', 'profile', 'classes', 'gallery',
  'articles', 'article-detail', 'events', 'about', 'login', 'admin', 'settings', 'member-profile',
  'series', 'series-detail', 'dosen-detail', 'aspirasi',
]

export default function Home() {
  const view = useAppStore((s) => s.view)
  const user = useAppStore((s) => s.user)
  const authLoading = useAppStore((s) => s.authLoading)
  const selectedId = useAppStore((s) => s.selectedId)
  const setUser = useAppStore((s) => s.setUser)
  const setAuthLoading = useAppStore((s) => s.setAuthLoading)
  const setView = useAppStore((s) => s.setView)

  // Load current session on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setUser(d.user || null))
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false))
  }, [setUser, setAuthLoading])

  // Sync from URL hash on mount
  useEffect(() => {
    const hash = window.location.hash.replace(/^#\/?/, '')
    if (hash) {
      const [v, id] = hash.split('/')
      if (v && (VALID_VIEWS as string[]).includes(v)) {
        setView(v as ViewName, id || null)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync to URL hash when view changes
  useEffect(() => {
    const idPart = selectedId ? `/${selectedId}` : ''
    window.history.replaceState(null, '', `#/${view}${idPart}`)
  }, [view, selectedId])

  // Listen for back/forward navigation
  useEffect(() => {
    const onPop = () => {
      const hash = window.location.hash.replace(/^#\/?/, '')
      if (hash) {
        const [v, id] = hash.split('/')
        if (v && (VALID_VIEWS as string[]).includes(v)) {
          setView(v as ViewName, id || null)
        }
      } else {
        setView('home')
      }
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [setView])

  const renderView = () => {
    switch (view) {
      case 'home':
        return <HomeView />
      case 'directory':
        return <DirectoryView />
      case 'profile':
        return <ProfileView />
      case 'classes':
        return <ClassesView />
      case 'gallery':
        return <GalleryView />
      case 'articles':
        return <ArticlesView />
      case 'article-detail':
        return <ArticleDetailView />
      case 'events':
        return <EventsView />
      case 'about':
        return <AboutView />
      case 'login':
        return user ? <SettingsView /> : <LoginView />
      case 'admin':
        return <AdminView />
      case 'settings':
        return <SettingsView />
      case 'member-profile':
        return <MemberProfileView />
      case 'series':
        return <SeriesView />
      case 'series-detail':
        return <SeriesDetailView />
      case 'dosen-detail':
        return <DosenDetailView />
      case 'aspirasi':
        return <AspirasiView />
      default:
        return <HomeView />
    }
  }

  // Show nothing while initial auth check completes (avoids flicker)
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--brand-bg)]">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[var(--brand-pink-dark)] border-t-[#1a1a1a] rounded-full animate-spin mx-auto mb-4" />
          <p className="font-condensed text-xs uppercase tracking-widest text-[var(--brand-ink-muted)]">Memuat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--brand-bg)] flex flex-col relative z-10">
      <OpeningAnimation />
      <div className="flex-grow flex flex-col w-full max-w-[1200px] mx-auto bg-[var(--brand-surface)] shadow-md min-h-screen">
        <Header />
        <main className="flex-grow p-4 md:p-8">{renderView()}</main>
        <Footer />
      </div>
      <BackToTop />
    </div>
  )
}
