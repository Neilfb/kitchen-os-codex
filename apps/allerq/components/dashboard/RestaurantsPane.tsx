'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { RestaurantGrid, type RestaurantCardModel } from './RestaurantGrid'
import { RestaurantToolbar, type RestaurantFilterOptions } from './RestaurantToolbar'
import { useToast } from '@/components/ui/toast'

type RestaurantsPaneProps = {
  restaurants: RestaurantCardModel[]
  owners: string[]
  isSuperadmin: boolean
}

export function RestaurantsPane({ restaurants, owners, isSuperadmin }: RestaurantsPaneProps) {
  const [filters, setFilters] = useState<RestaurantFilterOptions>({ status: 'all' })
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const router = useRouter()
  const { toast } = useToast()
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [isDeleting, startDeleteTransition] = useTransition()

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((restaurant) => {
      if (filters.status && filters.status !== 'all' && restaurant.statusTone !== filters.status) {
        return false
      }
      if (filters.owner) {
        if (!restaurant.ownerLabel.toLowerCase().includes(filters.owner.toLowerCase())) {
          return false
        }
      }
      if (filters.query) {
        const query = filters.query.toLowerCase()
        if (!restaurant.name.toLowerCase().includes(query) && !restaurant.ownerLabel.toLowerCase().includes(query)) {
          return false
        }
      }
      return true
    })
  }, [restaurants, filters])

  const filteredWithSelection = useMemo(
    () =>
      filteredRestaurants.map((restaurant) => ({
        ...restaurant,
        selected: selectedIds.has(restaurant.id),
        deleting: isDeleting && deletingId === restaurant.id,
      })),
    [filteredRestaurants, selectedIds, deletingId, isDeleting]
  )

  const toggleSelection = (id: number) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const clearSelection = () => setSelectedIds(new Set())

  const selectVisible = () => {
    setSelectedIds((current) => {
      const next = new Set(current)
      filteredRestaurants.forEach((restaurant) => next.add(restaurant.id))
      return next
    })
  }

  const handleDelete = (restaurantId: number) => {
    if (!window.confirm('Are you sure you want to delete this restaurant?')) {
      return
    }

    setDeletingId(restaurantId)
    startDeleteTransition(async () => {
      try {
        const response = await fetch('/api/restaurants/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: restaurantId }),
        })
        const result = await response.json().catch(() => ({}))

        if (!response.ok || result.status !== 'success') {
          const message = typeof result.message === 'string' ? result.message : 'Failed to delete restaurant'
          throw new Error(message)
        }

        toast({
          title: 'Restaurant deleted',
          description: 'The venue has been removed from AllerQ.',
          variant: 'success',
        })

        setSelectedIds((current) => {
          const next = new Set(current)
          next.delete(restaurantId)
          return next
        })

        router.refresh()
      } catch (error) {
        toast({
          title: 'Unable to delete restaurant',
          description: error instanceof Error ? error.message : 'Unexpected error occurred',
          variant: 'error',
        })
      } finally {
        setDeletingId(null)
      }
    })
  }

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Restaurants</h2>
          <p className="text-sm text-slate-600">Manage venues, menus, and QR coverage from one place.</p>
        </div>
        <span className="text-xs uppercase tracking-wide text-slate-500">
          {restaurants.length} venue{restaurants.length === 1 ? '' : 's'}
        </span>
      </div>

      <RestaurantToolbar
        totalCount={restaurants.length}
        selectedCount={selectedIds.size}
        filters={filters}
        owners={owners}
        onFiltersChange={setFilters}
        onClearSelection={clearSelection}
        onBulkAction={(action) => {
          console.log('[RestaurantToolbar] bulk action', action, Array.from(selectedIds))
        }}
        onSelectAllVisible={selectVisible}
      />

      <RestaurantGrid
        restaurants={filteredWithSelection}
        onToggleSelect={toggleSelection}
        onManageMenus={(restaurantId) => {
          router.push(`/menus?restaurant=${restaurantId}`)
        }}
        onEditDetails={(restaurantId) => {
          router.push(`/restaurants?restaurant=${restaurantId}#update-restaurant`)
        }}
        onManageManagers={(restaurantId) => {
          router.push(`/users?restaurant=${restaurantId}`)
        }}
        onShowQrCodes={(restaurantId) => {
          router.push(`/qr?restaurant=${restaurantId}`)
        }}
        onDelete={
          isSuperadmin
            ? (restaurantId) => {
                handleDelete(restaurantId)
              }
            : undefined
        }
      />
    </section>
  )
}
