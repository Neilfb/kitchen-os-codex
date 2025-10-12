'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Bell, RefreshCw, X } from 'lucide-react'

type NotificationsDrawerProps = {
  open: boolean
  onClose: () => void
}

type Notification = {
  id: string
  title: string
  description: string
  timestamp: number
  type: string
}

export function NotificationsDrawer({ open, onClose }: NotificationsDrawerProps) {
  const [mounted, setMounted] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/notifications', { cache: 'no-store' })
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.message || 'Failed to load notifications')
      }
      const payload = await response.json()
      setNotifications(Array.isArray(payload?.data) ? (payload.data as Notification[]) : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      void loadNotifications()
    }
  }, [loadNotifications, open])

  const formattedNotifications = useMemo(() => {
    const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
    const now = Date.now()

    function timeAgo(timestamp: number): string {
      const diff = timestamp - now
      const seconds = Math.round(diff / 1000)
      const minutes = Math.round(seconds / 60)
      const hours = Math.round(minutes / 60)
      const days = Math.round(hours / 24)

      if (Math.abs(seconds) < 60) {
        return formatter.format(seconds, 'second')
      }
      if (Math.abs(minutes) < 60) {
        return formatter.format(minutes, 'minute')
      }
      if (Math.abs(hours) < 24) {
        return formatter.format(hours, 'hour')
      }
      return formatter.format(days, 'day')
    }

    return notifications.map((notification) => ({
      ...notification,
      relativeTime: timeAgo(notification.timestamp),
    }))
  }, [notifications])

  if (!mounted) {
    return null
  }

  return createPortal(
    <>
      <div
        className={`fixed inset-0 z-50 bg-slate-900/30 transition-opacity ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden="true"
        onClick={onClose}
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-200 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-label="Notifications"
        aria-hidden={!open}
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-slate-500" />
            <h2 className="text-base font-semibold text-slate-900">Notifications</h2>
          </div>
          <button
            type="button"
            className="rounded-full border border-slate-200 p-1 text-slate-600 transition hover:text-slate-900"
            onClick={onClose}
            aria-label="Close notifications"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-slate-500">Recent</p>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
              onClick={() => void loadNotifications()}
              disabled={loading}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              Loading notifications…
            </div>
          ) : error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-600">
              {error}
            </div>
          ) : formattedNotifications.length === 0 ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              No alerts yet. Upload a menu to generate AI suggestions.
            </div>
          ) : (
            <ul className="mt-3 space-y-3">
              {formattedNotifications.map((notification) => (
                <li
                  key={notification.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                >
                  <p className="font-semibold text-slate-900">{notification.title}</p>
                  <p className="mt-1 text-slate-600">{notification.description}</p>
                  <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">{notification.relativeTime}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <footer className="border-t border-slate-200 px-5 py-4 text-xs text-slate-500">
          Alerts reflect AI menu activity. Keep uploads flowing to stay current.
        </footer>
      </aside>
    </>,
    document.body
  )
}
