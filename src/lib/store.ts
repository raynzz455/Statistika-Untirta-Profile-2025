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
  | 'signup'
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
  /** ID of the linked Student row (set when user has claimed a NIM).
   *  Null for first-time Google OAuth users or custom-session users
   *  without a linked student profile. Drives smart post-login routing. */
  studentId?: string | null
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

// ============================================================================
// Opening animation intro session — remembers that the user has seen the
// intro within the last hour, so it doesn't replay on every page refresh.
//
// Storage strategy (dual, for robustness):
//   1. Cookie `stat25_intro_seen` — max-age=3600s (1 hour), SameSite=Lax, path=/
//      Survives page refreshes, sent to server (could enable SSR decision later).
//      Auto-expires after 1 hour (browser deletes it automatically).
//   2. localStorage `stat25_intro_seen_v2` — stores absolute expiry timestamp.
//      Backup for when cookies are blocked (rare). Cleared if user wipes data.
//
// Reset behavior: both auto-expire after 1 hour. After expiry, shouldShowIntro()
// returns true and the animation plays again on next page load.
//
// Version note: key bumped from `stat25_intro_seen_v1` (5-min expiry) to
// `stat25_intro_seen_v2` (1-hour expiry). Existing v1 entries are ignored,
// so users will see the intro one more time after this update — by design.
// ============================================================================
const INTRO_COOKIE = 'stat25_intro_seen'
const INTRO_KEY = 'stat25_intro_seen_v2'
const ONE_HOUR_MS = 60 * 60 * 1000 // 3,600,000 ms

export function shouldShowIntro(): boolean {
  if (typeof window === 'undefined') return false
  try {
    // 1. Check cookie (primary) — if present, we're within the 1-hour window
    const hasCookie = document.cookie
      .split('; ')
      .some((c) => c.startsWith(`${INTRO_COOKIE}=`))
    if (hasCookie) return false

    // 2. Check localStorage (backup) — if expiry timestamp is still in the
    //    future, we're within the 1-hour window
    const raw = localStorage.getItem(INTRO_KEY)
    if (raw) {
      const expiry = Number(raw)
      if (!Number.isNaN(expiry) && Date.now() < expiry) return false
    }

    // Neither present OR both expired → show intro
    return true
  } catch {
    // localStorage / cookie access blocked (e.g., privacy mode) — show intro
    return true
  }
}

export function markIntroSeen(): void {
  if (typeof window === 'undefined') return
  try {
    // 1. Set cookie with 1-hour max-age (browser auto-deletes after 1h)
    const maxAgeSeconds = ONE_HOUR_MS / 1000 // 3600
    const isHttps = window.location.protocol === 'https:'
    document.cookie = [
      `${INTRO_COOKIE}=1`,
      `max-age=${maxAgeSeconds}`,
      'path=/',
      'SameSite=Lax',
      isHttps ? 'Secure' : '',
    ].filter(Boolean).join('; ')

    // 2. Set localStorage as backup (absolute expiry timestamp)
    localStorage.setItem(INTRO_KEY, String(Date.now() + ONE_HOUR_MS))
  } catch {
    // ignore — intro will just replay next time, no big deal
  }
}
