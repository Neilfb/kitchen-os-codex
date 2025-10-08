'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, Menu, X } from 'lucide-react'
import { useState } from 'react'

import { SignOutButton } from '@/components/auth/SignOutButton'
import { NotificationsDrawer } from '@/components/dashboard/NotificationsDrawer'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/restaurants', label: 'Restaurants' },
  { href: '/menus', label: 'Menus' },
  { href: '/qr', label: 'QR Codes' },
]

type DashboardTopNavProps = {
  userName?: string | null
  userEmail: string
}

export function DashboardTopNav({ userName, userEmail }: DashboardTopNavProps) {
  const pathname = usePathname() ?? ''
  const [isMobileOpen, setMobileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const activeHref = NAV_ITEMS.find(({ href }) => pathname.startsWith(href))?.href

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-allerq-orange)] text-sm font-bold text-white shadow-sm">
              AQ
            </span>
            <span className="hidden sm:inline">AllerQ Dashboard</span>
          </Link>
          <nav className="hidden gap-1 rounded-full bg-slate-100 p-1 text-sm font-medium text-slate-600 md:flex">
            {NAV_ITEMS.map(({ href, label }) => {
              const isActive = href === activeHref
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-full px-3 py-1.5 transition ${
                    isActive ? 'bg-white text-slate-900 shadow-sm' : 'hover:bg-white/70'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="hidden h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:text-slate-900 md:inline-flex"
            aria-label="Search"
          >
            <span className="text-lg leading-none">⌘K</span>
          </button>
          <button
            type="button"
            className="hidden h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:text-slate-900 md:inline-flex"
            aria-label="Open notifications"
            onClick={() => setNotificationsOpen(true)}
          >
            <Bell className="h-5 w-5" />
          </button>
          <div className="hidden md:flex md:items-center md:gap-3">
            <div className="text-right text-sm leading-tight">
              <p className="font-semibold text-slate-900">{userName ?? userEmail}</p>
              <p className="text-slate-500">{userEmail}</p>
            </div>
            <SignOutButton className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm hover:bg-slate-50" />
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:text-slate-900 md:hidden"
            aria-label="Toggle navigation"
          >
            {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isMobileOpen ? (
        <div className="border-t border-slate-200 bg-white px-4 py-3 shadow-sm md:hidden">
          <div className="mb-3 flex gap-2">
            <button
              type="button"
              className="flex flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-100"
              aria-label="Search"
            >
              Search (coming soon)
            </button>
            <button
              type="button"
              onClick={() => {
                setNotificationsOpen(true)
                setMobileOpen(false)
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:text-slate-900"
              aria-label="Open notifications"
            >
              <Bell className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            {NAV_ITEMS.map(({ href, label }) => {
              const isActive = href === activeHref
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-lg px-3 py-2 transition ${
                    isActive ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-100'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </nav>
          <div className="mt-3 border-t border-slate-200 pt-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Account</p>
            <p className="text-sm font-semibold text-slate-900">{userName ?? userEmail}</p>
            <p className="text-xs text-slate-500">{userEmail}</p>
            <div className="mt-2">
              <SignOutButton className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50" />
            </div>
          </div>
        </div>
      ) : null}
      <NotificationsDrawer open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </header>
  )
}
