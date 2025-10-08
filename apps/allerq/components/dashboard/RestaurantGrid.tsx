'use client'

import { useMemo, useState } from 'react'
import { RestaurantCard } from './RestaurantCard'

export type RestaurantCardModel = {
  id: number
  name: string
  ownerLabel: string
  logoUrl?: string | null
  statusLabel: string
  statusTone: 'active' | 'trial' | 'paused'
  subscriptionSummary?: string
  menuUrl?: string
  lastMenuSync?: string
  qrScanTrend?: string
  selected?: boolean
  deleting?: boolean
}

interface RestaurantGridProps {
  restaurants: RestaurantCardModel[]
  onManageMenus?: (id: number) => void
  onEditDetails?: (id: number) => void
  onManageManagers?: (id: number) => void
  onShowQrCodes?: (id: number) => void
  onDelete?: (id: number) => void
  onToggleSelect?: (id: number) => void
}

export function RestaurantGrid({
  restaurants,
  onManageMenus,
  onEditDetails,
  onManageManagers,
  onShowQrCodes,
  onDelete,
  onToggleSelect,
}: RestaurantGridProps) {
  const [visibleCount, setVisibleCount] = useState(9)

  const visibleRestaurants = useMemo(() => restaurants.slice(0, visibleCount), [restaurants, visibleCount])

  const showLoadMore = restaurants.length > visibleRestaurants.length

  if (restaurants.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
        <p className="font-medium text-slate-900">No restaurants to display</p>
        <p className="mt-2">Adjust your filters or add a new venue.</p>
      </div>
    )
  }

  return (
    <>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visibleRestaurants.map((restaurant) => (
          <RestaurantCard
            key={restaurant.id}
            {...restaurant}
            onManageMenus={onManageMenus}
            onEditDetails={onEditDetails}
            onManageManagers={onManageManagers}
            onShowQrCodes={onShowQrCodes}
            onDelete={onDelete}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </div>
      {showLoadMore ? (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => Math.min(restaurants.length, count + 9))}
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
          >
            Load more
          </button>
        </div>
      ) : null}
    </>
  )
}
