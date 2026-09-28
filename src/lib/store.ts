'use client'

import { create } from 'zustand'

export type ViewName =
  | 'home'
  | 'directory'
  | 'profile'
  | 'classes'
  | 'gallery'
  | 'articles'
  | 'about'
  | 'login'
  | 'admin'
  | 'settings'
  | 'events'
  | 'article-detail'
  | 'member-profile'
  | 'series'
  | 'series-detail'
  | 'dosen-detail'
  | 'aspirasi'
  | 'claim-profile'

export interface SessionUser {
  id: string
  username: string
  role: 'admin' | 'user'
  displayName: string | null
  theme?: 'light' | 'dark'
}

interface AppStore {
  view: ViewName
  selectedId: string | null // for profile / article detail
  user: SessionUser | null
  authLoading: boolean
  introSeen: boolean // whether intro animation has been seen in the last 5 minutes
  tagFilter: string | null // tag name to filter articles by (set when navigating from tag cloud)

  setView: (view: ViewName, id?: string | null) => void
  setUser: (u: SessionUser | null) => void
  setAuthLoading: (b: boolean) => void
  setIntroSeen: (b: boolean) => void
  setTagFilter: (tag: string | null) => void
  logoutClient: () => void
}

export const useAppStore = create<AppStore>((set) => ({
  view: 'home',
  selectedId: null,
  user: null,
  authLoading: true,
  introSeen: false,
  tagFilter: null,

  setView: (view, id = null) => {
    set({ view, selectedId: id })
    // Scroll to top on view change for better UX
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  },
  setUser: (u) => set({ user: u }),
  setAuthLoading: (b) => set({ authLoading: b }),
  setIntroSeen: (b) => set({ introSeen: b }),
  setTagFilter: (tag) => set({ tagFilter: tag }),
  logoutClient: () => set({ user: null, view: 'home', tagFilter: null }),
}))

// 5-minute session for opening animation (stored in localStorage with expiry)
const INTRO_KEY = 'stat25_intro_seen_v1'
const FIVE_MINUTES_MS = 5 * 60 * 1000

export function shouldShowIntro(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = localStorage.getItem(INTRO_KEY)
    if (!raw) return true
    const expiry = Number(raw)
    if (Number.isNaN(expiry)) return true
    return Date.now() > expiry
  } catch {
    return true
  }
}

export function markIntroSeen(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(INTRO_KEY, String(Date.now() + FIVE_MINUTES_MS))
  } catch {
    // ignore
  }
}
