'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Bell, X } from 'lucide-react'

type NotificationsDrawerProps = {
  open: boolean
  onClose: () => void
}

const SAMPLE_NOTIFICATIONS = [
  {
    id: '1',
    title: 'Menu updated',
    description: 'Pizzeria Uno menu was edited 2 hours ago.',
    timestamp: '2h ago',
  },
  {
    id: '2',
    title: 'Trial ending soon',
    description: 'Plant Kitchen free trial ends in 5 days.',
    timestamp: 'Today',
  },
  {
    id: '3',
    title: 'New manager invite',
    description: 'Noor Patel invited to Borough Bistro.',
    timestamp: 'Yesterday',
  },
]

export function NotificationsDrawer({ open, onClose }: NotificationsDrawerProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

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
          <p className="text-xs uppercase tracking-wide text-slate-500">Recent</p>
          <ul className="mt-3 space-y-3">
            {SAMPLE_NOTIFICATIONS.map((notification) => (
              <li
                key={notification.id}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
              >
                <p className="font-semibold text-slate-900">{notification.title}</p>
                <p className="mt-1 text-slate-600">{notification.description}</p>
                <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">{notification.timestamp}</p>
              </li>
            ))}
          </ul>
        </div>
        <footer className="border-t border-slate-200 px-5 py-4 text-xs text-slate-500">
          Alerts are placeholders; wire to activity feed once backend is ready.
        </footer>
      </aside>
    </>,
    document.body
  )
}
