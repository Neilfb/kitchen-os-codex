'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Calendar, Ellipsis, ExternalLink, Signal, Users } from 'lucide-react'

import type { RestaurantCardModel } from './RestaurantGrid'

const STATUS_TONE_CLASS: Record<RestaurantCardModel['statusTone'], string> = {
  active: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  trial: 'bg-amber-100 text-amber-700 border border-amber-200',
  paused: 'bg-slate-200 text-slate-600 border border-slate-300',
}

type RestaurantCardProps = RestaurantCardModel & {
  onManageMenus?: (id: number) => void
  onEditDetails?: (id: number) => void
  onManageManagers?: (id: number) => void
  onShowQrCodes?: (id: number) => void
  onDelete?: (id: number) => void
  onToggleSelect?: (id: number) => void
}

export function RestaurantCard({
  id,
  name,
  ownerLabel,
  logoUrl,
  statusLabel,
  statusTone,
  subscriptionSummary,
  menuUrl,
  onManageMenus,
  onEditDetails,
  onManageManagers,
  onShowQrCodes,
  onDelete,
  lastMenuSync,
  qrScanTrend,
  selected,
  deleting,
  onToggleSelect,
}: RestaurantCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const fallbackInitial = useMemo(() => name.charAt(0).toUpperCase(), [name])

  const handleManageMenus = () => {
    if (typeof onManageMenus === 'function') {
      onManageMenus(id)
      return
    }
    if (menuUrl) {
      window.location.href = menuUrl
    }
  }

  const handleMenuAction = (callback?: (id: number) => void) => {
    if (typeof callback === 'function') {
      callback(id)
    }
    setMenuOpen(false)
  }

  const cardClassName = [
    'group relative flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg',
    selected ? 'border-orange-300 ring-2 ring-orange-200' : 'border-slate-200',
  ].join(' ')

  return (
    <article className={cardClassName}>
      {onToggleSelect ? (
        <div className="absolute left-4 top-4">
          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-600">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border border-slate-300 text-[var(--color-allerq-orange)] focus:ring-2 focus:ring-offset-0 focus:ring-[var(--color-allerq-orange)]"
              checked={Boolean(selected)}
              onChange={() => onToggleSelect?.(id)}
            />
          </label>
        </div>
      ) : null}
      <header className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-slate-100 shadow-sm">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-lg font-semibold text-slate-600">{fallbackInitial}</span>
          )}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-900">{name}</h3>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_TONE_CLASS[statusTone]}`}>
              {statusLabel}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Owner: <span className="font-medium text-slate-800">{ownerLabel || '—'}</span>
          </p>
          {subscriptionSummary ? <p className="mt-0.5 text-xs text-slate-500">{subscriptionSummary}</p> : null}
        </div>
        <div className="relative h-8 w-8">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 shadow-sm transition hover:text-slate-900"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
          >
            <Ellipsis className="h-4 w-4" />
          </button>
          {menuOpen ? (
            <div className="absolute right-0 top-10 z-10 w-48 rounded-xl border border-slate-200 bg-white py-2 text-sm shadow-lg">
              <button
                type="button"
                onClick={() => handleMenuAction(onEditDetails)}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-slate-700 transition hover:bg-slate-100"
              >
                <ExternalLink className="h-4 w-4" />
                Edit details
              </button>
              <button
                type="button"
                onClick={() => handleMenuAction(onManageManagers)}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-slate-700 transition hover:bg-slate-100"
              >
                <Users className="h-4 w-4" />
                Manage managers
              </button>
              <button
                type="button"
                onClick={() => handleMenuAction(onShowQrCodes)}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-slate-700 transition hover:bg-slate-100"
              >
                <Signal className="h-4 w-4" />
                QR codes
              </button>
              {typeof onDelete === 'function' ? (
                <button
                  type="button"
                  onClick={() => handleMenuAction(onDelete)}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-red-600 transition hover:bg-red-50"
                >
                  Delete restaurant
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
        {lastMenuSync ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
            <Calendar className="h-3 w-3" />
            {lastMenuSync}
          </span>
        ) : null}
        {qrScanTrend ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
            <Signal className="h-3 w-3" />
            {qrScanTrend}
          </span>
        ) : null}
      </div>

      <footer className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleManageMenus}
          disabled={Boolean(deleting)}
          className="inline-flex flex-1 items-center justify-center rounded-xl bg-[var(--color-allerq-orange)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--color-allerq-orange-strong)] disabled:cursor-not-allowed disabled:bg-orange-300"
        >
          {deleting ? 'Working…' : 'Manage menus'}
        </button>
        {menuUrl ? (
          <Link
            href={menuUrl}
            className="hidden rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 md:inline-flex"
          >
            View details
          </Link>
        ) : null}
      </footer>
    </article>
  )
}
