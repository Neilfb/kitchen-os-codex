'use client'

import { useMemo, useState } from 'react'
import { Filter, Search, X } from 'lucide-react'

export type RestaurantFilterOptions = {
  status?: 'all' | 'active' | 'trial' | 'paused'
  owner?: string
  query?: string
}

type RestaurantToolbarProps = {
  totalCount: number
  selectedCount: number
  filters: RestaurantFilterOptions
  owners: string[]
  onFiltersChange: (filters: RestaurantFilterOptions) => void
  onClearSelection: () => void
  onBulkAction?: (action: 'pause' | 'activate' | 'inviteManager' | 'export') => void
  onSelectAllVisible?: () => void
}

export function RestaurantToolbar({
  totalCount,
  selectedCount,
  filters,
  owners,
  onFiltersChange,
  onClearSelection,
  onBulkAction,
  onSelectAllVisible,
}: RestaurantToolbarProps) {
  const [searchValue, setSearchValue] = useState(filters.query ?? '')

  const ownerOptions = useMemo(() => {
    const deduped = new Set<string>()
    owners.forEach((owner) => {
      const trimmed = owner.trim()
      if (trimmed && trimmed !== 'null' && trimmed !== 'undefined') {
        deduped.add(trimmed)
      }
    })
    return Array.from(deduped).sort((a, b) => a.localeCompare(b))
  }, [owners])

  const showBulkActions = selectedCount > 0

  return (
    <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              onBlur={() => onFiltersChange({ ...filters, query: searchValue.trim() || undefined })}
              placeholder="Search restaurants or owners…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-700 shadow-inner focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs uppercase tracking-wide text-slate-500" htmlFor="status-filter">
              Status
            </label>
            <select
              id="status-filter"
              value={filters.status ?? 'all'}
              onChange={(event) =>
                onFiltersChange({
                  ...filters,
                  status: event.target.value as RestaurantFilterOptions['status'],
                })
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-200"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="paused">Paused</option>
            </select>
          </div>
          {ownerOptions.length > 1 ? (
            <div className="flex items-center gap-2">
              <label className="text-xs uppercase tracking-wide text-slate-500" htmlFor="owner-filter">
                Owner
              </label>
              <select
                id="owner-filter"
                value={filters.owner ?? ''}
                onChange={(event) =>
                  onFiltersChange({
                    ...filters,
                    owner: event.target.value || undefined,
                  })
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-200"
              >
                <option value="">All owners</option>
                {ownerOptions.map((owner) => (
                  <option key={owner} value={owner}>
                    {owner}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Filter className="h-4 w-4" />
          {selectedCount > 0 ? (
            <span>
              {selectedCount} selected · {totalCount} total
            </span>
          ) : (
            <span>{totalCount} venues</span>
          )}
          {typeof onSelectAllVisible === 'function' ? (
            <button
              type="button"
              onClick={onSelectAllVisible}
              className="ml-2 inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
            >
              Select visible
            </button>
          ) : null}
        </div>
      </div>

      {showBulkActions ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          <span className="font-semibold text-slate-900">{selectedCount} selected</span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onBulkAction?.('pause')}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Pause
            </button>
            <button
              type="button"
              onClick={() => onBulkAction?.('activate')}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Activate
            </button>
            <button
              type="button"
              onClick={() => onBulkAction?.('inviteManager')}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Invite manager
            </button>
            <button
              type="button"
              onClick={() => onBulkAction?.('export')}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Export
            </button>
          </div>
          <button
            type="button"
            onClick={onClearSelection}
            className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-500 transition hover:text-slate-800"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        </div>
      ) : null}
    </div>
  )
}
