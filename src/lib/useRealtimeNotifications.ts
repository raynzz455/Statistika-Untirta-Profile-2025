'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'

// ============================================================================
// useRealtimeNotifications — Live notification updates via Supabase Realtime
// ============================================================================
// Subscribes to the `notifications` table via Supabase Realtime (WebSocket).
// When a new notification is inserted (e.g. someone likes your article,
// comments, follows you), the UI updates instantly WITHOUT page refresh.
//
// Requirements:
// - Supabase project must be configured (NEXT_PUBLIC_SUPABASE_URL + anon key)
// - User must be authenticated via Supabase Auth
// - Realtime must be enabled in Supabase Dashboard → Realtime
//
// Usage:
//   const { notifications, unreadCount, markAsRead } = useRealtimeNotifications(user)
//
//   // Display badge:
//   <span>{unreadCount}</span>
//
//   // Display list:
//   {notifications.map(n => <div>{n.content}</div>)}
//
//   // Mark all as read:
//   <button onClick={markAsRead}>Mark all read</button>
// ============================================================================

interface Notification {
  id: string
  type: string
  recipientId: string
  actorId: string | null
  articleId: string | null
  eventId: string | null
  content: string | null
  read: boolean
  createdAt: string
}

interface UseRealtimeNotificationsOptions {
  /** Polling fallback interval when Supabase not configured (default: 30s) */
  fallbackInterval?: number
  /** Max notifications to keep in state (default: 20) */
  maxItems?: number
}

export function useRealtimeNotifications(
  userId: string | null,
  options: UseRealtimeNotificationsOptions = {}
) {
  const { fallbackInterval = 30000, maxItems = 20 } = options
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const channelRef = useRef<ReturnType<typeof supabaseBrowser.channel> | null>(null)

  // === Fetch initial notifications ===
  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`/api/notifications?limit=${maxItems}`)
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications || data.items || [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [userId, maxItems])

  // === Try Supabase Realtime first, fall back to polling ===
  useEffect(() => {
    fetchNotifications()

    if (!userId) return

    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      // Fallback: poll every 30 seconds
      const timer = setInterval(fetchNotifications, fallbackInterval)
      return () => clearInterval(timer)
    }

    // === Supabase Realtime (WebSocket) ===
    try {
      const supabase = supabaseBrowser

      // Subscribe to INSERT events on notifications table
      const channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_id=eq.${userId}`,
          },
          (payload) => {
            // Prepend new notification to state
            const newNotif = payload.new as Notification
            setNotifications((prev) => [newNotif, ...prev].slice(0, maxItems))
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_id=eq.${userId}`,
          },
          (payload) => {
            // Update notification in state (e.g. mark as read)
            const updated = payload.new as Notification
            setNotifications((prev) =>
              prev.map((n) => (n.id === updated.id ? updated : n))
            )
          }
        )
        .subscribe((status) => {
          setConnected(status === 'SUBSCRIBED')
        })

      channelRef.current = channel

      return () => {
        supabase.removeChannel(channel)
        channelRef.current = null
      }
    } catch {
      // Fallback: poll if Realtime fails
      const timer = setInterval(fetchNotifications, fallbackInterval)
      return () => clearInterval(timer)
    }
  }, [userId, fetchNotifications, fallbackInterval, maxItems])

  // === Mark single notification as read ===
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, { method: 'POST' })
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      )
    } catch {
      // ignore
    }
  }, [])

  // === Mark all as read ===
  const markAllAsRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.read)
    if (unread.length === 0) return

    try {
      await Promise.all(
        unread.map((n) =>
          fetch(`/api/notifications/${n.id}/read`, { method: 'POST' })
        )
      )
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch {
      // ignore
    }
  }, [notifications])

  const unreadCount = notifications.filter((n) => !n.read).length

  return {
    notifications,
    unreadCount,
    loading,
    connected, // true = WebSocket connected, false = polling fallback
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  }
}
