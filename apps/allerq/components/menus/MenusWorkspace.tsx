'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useToast } from '@/components/ui/toast'
import type { MenuRecord } from '@/types/ncdb/menu'
import type { MenuUploadRecord, MenuUploadStatus } from '@/types/ncdb/menuUpload'

type RestaurantOption = {
  id: number
  name: string
}

type MenusWorkspaceProps = {
  restaurants: RestaurantOption[]
  canUpload: boolean
  initialRestaurantId?: number
}

interface UploadSummary {
  id: number
  fileName: string
  status: MenuUploadStatus
  createdAt: number
  updatedAt: number
  processedAt?: number
  parserVersion?: string
  failureReason?: string
  metadata?: Record<string, unknown>
}

const STATUS_META: Record<
  MenuUploadStatus,
  { label: string; chip: string; badge: string; description?: string }
> = {
  pending: {
    label: 'Awaiting processing',
    chip: 'bg-amber-50 text-amber-700 border border-amber-200',
    badge: 'bg-amber-500',
    description: 'Queued for AI parsing.',
  },
  processing: {
    label: 'Processing',
    chip: 'bg-blue-50 text-blue-700 border border-blue-200',
    badge: 'bg-blue-500',
    description: 'Currently being parsed.',
  },
  completed: {
    label: 'Completed',
    chip: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    badge: 'bg-emerald-500',
    description: 'Ready for review.',
  },
  failed: {
    label: 'Failed',
    chip: 'bg-red-50 text-red-700 border border-red-200',
    badge: 'bg-red-500',
    description: 'Action required. See error message.',
  },
  needs_review: {
    label: 'Needs review',
    chip: 'bg-orange-50 text-orange-700 border border-orange-200',
    badge: 'bg-orange-500',
    description: 'Review parsed dishes before publishing.',
  },
}

function toUploadSummary(record: MenuUploadRecord): UploadSummary {
  return {
    id: Number(record.id),
    fileName: record.file_name,
    status: record.status,
    createdAt: Number(record.created_at),
    updatedAt: Number(record.updated_at),
    processedAt: record.processed_at ? Number(record.processed_at) : undefined,
    parserVersion: record.parser_version ?? undefined,
    failureReason: record.failure_reason ?? undefined,
    metadata: record.metadata ?? undefined,
  }
}

function formatDate(timestamp: number | undefined) {
  if (!timestamp || Number.isNaN(timestamp)) {
    return '—'
  }
  const date = new Date(timestamp)
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function formatRelative(timestamp: number | undefined) {
  if (!timestamp || Number.isNaN(timestamp)) {
    return ''
  }
  const diffMs = Date.now() - timestamp
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  if (diffMinutes < 1) {
    return 'moments ago'
  }
  if (diffMinutes === 1) {
    return '1 minute ago'
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} minutes ago`
  }
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours === 1) {
    return '1 hour ago'
  }
  if (diffHours < 24) {
    return `${diffHours} hours ago`
  }
  const diffDays = Math.floor(diffHours / 24)
  return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`
}

export function MenusWorkspace({ restaurants, canUpload, initialRestaurantId }: MenusWorkspaceProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | undefined>(() => {
    if (!restaurants.length) return undefined
    if (initialRestaurantId && restaurants.some((restaurant) => restaurant.id === initialRestaurantId)) {
      return initialRestaurantId
    }
    return restaurants[0]?.id
  })
  const [uploads, setUploads] = useState<UploadSummary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [pollingEnabled, setPollingEnabled] = useState(true)
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null)
  const [menus, setMenus] = useState<MenuRecord[]>([])
  const [areMenusLoading, setAreMenusLoading] = useState(false)
  const [menuLastFetchedAt, setMenuLastFetchedAt] = useState<number | null>(null)
  const [menuLoadingMap, setMenuLoadingMap] = useState<Record<number, boolean>>({})

  const selectedRestaurant = useMemo(
    () => restaurants.find((restaurant) => restaurant.id === selectedRestaurantId),
    [restaurants, selectedRestaurantId]
  )

  const fetchUploads = useCallback(
    async (restaurantId: number, { showToastOnError = false } = {}) => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams({
          restaurantId: restaurantId.toString(),
        })
        const response = await fetch(`/api/menus/uploads?${params.toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => null)
          const message = errorPayload?.message || 'Failed to load menu uploads'
          throw new Error(message)
        }

        const payload = await response.json()
        const records: MenuUploadRecord[] = Array.isArray(payload?.data) ? payload.data : []
        setUploads(records.map(toUploadSummary))
        setLastFetchedAt(Date.now())
      } catch (error) {
        console.error('[MenusWorkspace] failed to fetch uploads', error)
        if (showToastOnError) {
          toast({
            title: 'Unable to load menu uploads',
            description: error instanceof Error ? error.message : 'Try refreshing the page.',
            variant: 'error',
          })
        }
      } finally {
        setIsLoading(false)
      }
    },
    [toast]
  )

  const fetchMenus = useCallback(
    async (restaurantId: number, { showToastOnError = false } = {}) => {
      setAreMenusLoading(true)
      try {
        const params = new URLSearchParams({
          restaurantId: restaurantId.toString(),
        })

        const response = await fetch(`/api/menus/list?${params.toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => null)
          const message = errorPayload?.message || 'Failed to load menus'
          throw new Error(message)
        }

        const payload = await response.json()
        const records: MenuRecord[] = Array.isArray(payload?.data) ? payload.data : []
        setMenus(records)
        setMenuLastFetchedAt(Date.now())
      } catch (error) {
        console.error('[MenusWorkspace] failed to fetch menus', error)
        if (showToastOnError) {
          toast({
            title: 'Unable to load menus',
            description: error instanceof Error ? error.message : 'Try refreshing the page.',
            variant: 'error',
          })
        }
      } finally {
        setAreMenusLoading(false)
      }
    },
    [toast]
  )

  const setMenuLoading = useCallback((menuId: number, loading: boolean) => {
    setMenuLoadingMap((current) => ({ ...current, [menuId]: loading }))
  }, [])

  const handleToggleMenuStatus = useCallback(
    async (menu: MenuRecord) => {
      const menuId = Number(menu.id)
      setMenuLoading(menuId, true)
      try {
        const response = await fetch(`/api/menus/${menuId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            is_active: !(menu.is_active !== false),
          }),
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => null)
          throw new Error(payload?.message || 'Failed to update menu')
        }

        const payload = await response.json()
        const updated: MenuRecord | undefined = payload?.data

        setMenus((current) =>
          current.map((entry) =>
            Number(entry.id) === menuId
              ? {
                  ...entry,
                  ...(updated ?? {}),
                  is_active: updated?.is_active ?? !(menu.is_active !== false),
                }
              : entry
          )
        )

        toast({
          title: updated?.is_active === false ? 'Menu archived' : 'Menu activated',
          description: `${menu.name} is now ${updated?.is_active === false ? 'archived' : 'active'}.`,
          variant: 'success',
        })
      } catch (error) {
        console.error('[MenusWorkspace] toggle menu status failed', error)
        toast({
          title: 'Unable to update menu',
          description: error instanceof Error ? error.message : 'Try again later.',
          variant: 'error',
        })
      } finally {
        setMenuLoading(menuId, false)
      }
    },
    [setMenuLoading, toast]
  )

  const handleDeleteMenu = useCallback(
    async (menu: MenuRecord) => {
      const menuId = Number(menu.id)

      const confirmed = window.confirm(`Delete “${menu.name}”? This cannot be undone.`)
      if (!confirmed) {
        return
      }

      setMenuLoading(menuId, true)
      try {
        const response = await fetch(`/api/menus/${menuId}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => null)
          throw new Error(payload?.message || 'Failed to delete menu')
        }

        setMenus((current) => current.filter((entry) => Number(entry.id) !== menuId))
        toast({
          title: 'Menu deleted',
          description: `${menu.name} has been removed.`,
          variant: 'success',
        })
        fetchMenus(selectedRestaurantId!, { showToastOnError: false }).catch(() => {})
      } catch (error) {
        console.error('[MenusWorkspace] delete menu failed', error)
        toast({
          title: 'Unable to delete menu',
          description: error instanceof Error ? error.message : 'Try again later.',
          variant: 'error',
        })
      } finally {
        setMenuLoading(menuId, false)
      }
    },
    [fetchMenus, selectedRestaurantId, setMenuLoading, toast]
  )

  useEffect(() => {
    if (!selectedRestaurantId) return
    fetchMenus(selectedRestaurantId, { showToastOnError: true }).catch(() => {})
    fetchUploads(selectedRestaurantId, { showToastOnError: true }).catch(() => {})
  }, [selectedRestaurantId, fetchMenus, fetchUploads])

  useEffect(() => {
    if (!pollingEnabled || !selectedRestaurantId) {
      return undefined
    }

    const interval = window.setInterval(() => {
      fetchUploads(selectedRestaurantId).catch(() => {})
    }, 15000)

    return () => window.clearInterval(interval)
  }, [pollingEnabled, selectedRestaurantId, fetchUploads])

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0 || !selectedRestaurantId) {
        return
      }

      const file = files[0]

      if (!canUpload) {
        toast({
          title: 'Upload blocked',
          description: 'You do not have permission to upload menu files.',
          variant: 'error',
        })
        return
      }

      const formData = new FormData()
      formData.append('restaurantId', selectedRestaurantId.toString())
      formData.append('file', file)

      setIsUploading(true)
      try {
        const response = await fetch('/api/menus/uploads', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => null)
          const message = errorPayload?.message || 'Upload failed'
          throw new Error(message)
        }

        const payload = await response.json()
        const menuUpload: MenuUploadRecord | undefined = payload?.data?.menuUpload

        toast({
          title: 'Menu upload received',
          description: 'We’ll start parsing this file shortly.',
          variant: 'success',
        })

        if (menuUpload) {
          setUploads((current) => {
            const next = current.filter((item) => item.id !== Number(menuUpload.id))
            next.unshift(toUploadSummary(menuUpload))
            return next.slice(0, 50)
          })
        } else {
          await fetchUploads(selectedRestaurantId)
        }
      } catch (error) {
        console.error('[MenusWorkspace] upload failed', error)
        toast({
          title: 'Menu upload failed',
          description: error instanceof Error ? error.message : 'Check the file size and format, then try again.',
          variant: 'error',
        })
      } finally {
        setIsUploading(false)
      }
    },
    [canUpload, fetchUploads, selectedRestaurantId, toast]
  )

  const onFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setPollingEnabled(false)
      handleFiles(event.target.files).finally(() => {
        setPollingEnabled(true)
        event.target.value = ''
      })
    },
    [handleFiles]
  )

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault()
      setPollingEnabled(false)
      const files = event.dataTransfer?.files ?? null
      handleFiles(files).finally(() => {
        setPollingEnabled(true)
      })
    },
    [handleFiles]
  )

  const onDragOver = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
  }, [])

  const sortedUploads = useMemo(() => {
    return [...uploads].sort((a, b) => b.createdAt - a.createdAt)
  }, [uploads])

  if (restaurants.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
        <p className="text-lg font-semibold text-slate-800">No restaurants assigned</p>
        <p className="mt-2 text-sm text-slate-500">
          Once you&apos;re added to a venue, menu uploads and AI parsing will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Menus</h3>
            <p className="text-sm text-slate-600">
              {selectedRestaurant
                ? `Showing menus for ${selectedRestaurant.name}.`
                : 'Select a restaurant to view menus.'}
            </p>
          </div>
          <button
            type="button"
            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
            onClick={() => {
              if (selectedRestaurantId) {
                fetchMenus(selectedRestaurantId, { showToastOnError: true }).catch(() => {})
              }
            }}
            disabled={areMenusLoading || !selectedRestaurantId}
          >
            {areMenusLoading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Menu</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {menus.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                    {areMenusLoading
                      ? 'Loading menus…'
                      : 'No menus yet. Create one above or upload a menu file to get started.'}
                  </td>
                </tr>
              ) : (
                [...menus]
                  .sort((a, b) => Number(b.updated_at) - Number(a.updated_at))
                  .map((menu) => {
                    const createdAtNumber = Number(menu.created_at)
                    const updatedAtNumber = Number(menu.updated_at)
                    return (
                      <tr key={menu.id} className="text-sm text-slate-700">
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-900">{menu.name}</span>
                            {menu.description ? (
                              <span className="text-xs text-slate-500">{menu.description}</span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-slate-600">{menu.menu_type || '—'}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <span>{formatDate(createdAtNumber)}</span>
                            <span className="text-xs text-slate-500">{formatRelative(createdAtNumber)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <span>{formatDate(updatedAtNumber)}</span>
                            <span className="text-xs text-slate-500">{formatRelative(updatedAtNumber)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                              menu.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {menu.is_active ? 'Active' : 'Archived'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/menus/${menu.id}`}
                              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                            >
                              Manage
                            </Link>
                            <button
                              type="button"
                              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                              onClick={() => handleToggleMenuStatus(menu)}
                              disabled={Boolean(menuLoadingMap[Number(menu.id)])}
                            >
                              {menuLoadingMap[Number(menu.id)]
                                ? 'Working…'
                                : menu.is_active === false
                                ? 'Activate'
                                : 'Archive'}
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center justify-center rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-red-600 transition hover:border-red-300 hover:text-red-700"
                              onClick={() => handleDeleteMenu(menu)}
                              disabled={Boolean(menuLoadingMap[Number(menu.id)])}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            {menuLastFetchedAt
              ? `Menus refreshed ${formatRelative(menuLastFetchedAt)} (${formatDate(menuLastFetchedAt)})`
              : 'Awaiting first refresh…'}
          </p>
          <p>Editing and analytics views are coming soon.</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Upload menus</h2>
            <p className="text-sm text-slate-600">
              Drop a PDF or Word document and we&apos;ll extract dishes, allergens, and dietary tags for review.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-slate-700" htmlFor="restaurant-select">
              Restaurant
            </label>
            <select
              id="restaurant-select"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              value={selectedRestaurantId ?? ''}
              onChange={(event) => {
                const nextId = Number(event.target.value)
                setSelectedRestaurantId(Number.isFinite(nextId) ? nextId : undefined)
              }}
            >
              {restaurants.map((restaurant) => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label
          onDrop={onDrop}
          onDragOver={onDragOver}
          className={`flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition ${
            canUpload
              ? 'border-slate-300 bg-slate-50 hover:border-[#F97316] hover:bg-orange-50'
              : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only"
            onChange={onFileInputChange}
            disabled={!canUpload || !selectedRestaurant}
          />
          <div className="flex max-w-xs flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#F97316] shadow-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-6 w-6"
              >
                <path d="M12 16a1 1 0 0 1-1-1V9.414L9.707 10.7a1 1 0 1 1-1.414-1.414l3-3a1 1 0 0 1 1.414 0l3 3a1 1 0 1 1-1.414 1.414L13 9.414V15a1 1 0 0 1-1 1Z" />
                <path d="M5 17a3 3 0 0 0 3 3h8a3 3 0 0 0 0-6h-1a1 1 0 1 1 0-2h1a5 5 0 0 1 0 10H8a5 5 0 0 1 0-10h1a1 1 0 1 1 0 2H8a3 3 0 0 0-3 3Z" />
              </svg>
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-800">
              {canUpload ? 'Drop menu files here' : 'Uploads unavailable'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              PDF or Word documents up to 10&nbsp;MB. We’ll auto-categorise dishes and highlight allergens.
            </p>
            {canUpload ? (
              <button
                type="button"
                className="mt-4 rounded-full bg-[#F97316] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#ea6b0c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F97316]"
                onClick={() => fileInputRef.current?.click()}
                disabled={!selectedRestaurant || isUploading}
              >
                {isUploading ? 'Uploading…' : 'Select a file'}
              </button>
            ) : (
              <p className="mt-4 text-xs font-medium text-slate-400">
                Contact an admin to enable menu uploads for your account.
              </p>
            )}
          </div>
        </label>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Recent uploads</h3>
            <p className="text-sm text-slate-600">
              {selectedRestaurant
                ? `Tracking uploads for ${selectedRestaurant.name}.`
                : 'Select a restaurant to view uploads.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
              onClick={() => {
                if (selectedRestaurantId) {
                  fetchUploads(selectedRestaurantId, { showToastOnError: true }).catch(() => {})
                }
              }}
              disabled={isLoading || !selectedRestaurantId}
            >
              {isLoading ? 'Refreshing…' : 'Refresh'}
            </button>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-[#F97316] focus:ring-[#F97316]"
                checked={pollingEnabled}
                onChange={(event) => setPollingEnabled(event.target.checked)}
              />
              Auto-refresh
            </label>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">File</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {sortedUploads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                    {isLoading
                      ? 'Loading uploads…'
                      : 'No uploads yet. Drop a menu file to start the AI review process.'}
                  </td>
                </tr>
              ) : (
                sortedUploads.map((upload) => {
                  const meta = STATUS_META[upload.status] ?? STATUS_META.pending
                  const submittedLabel = formatDate(upload.createdAt)
                  const updatedLabel = formatDate(upload.updatedAt)
                  const relativeLabel = formatRelative(upload.updatedAt)
                  const uploadedBy = (() => {
                    const value = upload.metadata?.uploadedBy
                    if (typeof value === 'string' && value.trim()) {
                      return value.trim()
                    }
                    return null
                  })()
                  const failureReason = upload.failureReason?.trim() || undefined
                  return (
                    <tr key={upload.id} className="text-sm text-slate-700">
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">{upload.fileName}</span>
                          {uploadedBy ? (
                            <span className="text-xs text-slate-500">Uploaded by {uploadedBy}</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ${meta.chip}`}>
                          <span className={`h-2.5 w-2.5 rounded-full ${meta.badge}`} />
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span>{submittedLabel}</span>
                          <span className="text-xs text-slate-500">{formatRelative(upload.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span>{updatedLabel}</span>
                          <span className="text-xs text-slate-500">{relativeLabel}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-xs text-slate-500">
                          {failureReason ? (
                            <p className="text-red-600">{failureReason}</p>
                          ) : (
                            <p>{meta.description}</p>
                          )}
                          {upload.parserVersion ? (
                            <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">
                              Parser v{upload.parserVersion}
                            </p>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            {lastFetchedAt
              ? `Last updated ${formatRelative(lastFetchedAt)} (${formatDate(lastFetchedAt)})`
              : 'Awaiting first refresh…'}
          </p>
          <p>Uploads older than 30 days will archive automatically once analytics are enabled.</p>
        </div>
      </div>
    </div>
  )
}
