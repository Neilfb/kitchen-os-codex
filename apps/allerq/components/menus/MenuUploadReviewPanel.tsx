'use client'

import { useEffect, useMemo, useState } from 'react'

import { useToast } from '@/components/ui/toast'
import type { MenuItemRecord } from '@/types/ncdb/menu'
import type { MenuUploadItemRecord } from '@/types/ncdb/menuUpload'

type ReviewPanelItem = MenuUploadItemRecord & {
  isPromoting?: boolean
  isDiscarding?: boolean
  draftName: string
  draftDescription: string
  draftCategory: string
  draftPrice: string
}

type RecentlyPromotedEntry = {
  id: number
  name: string
  promotedAt: number
}

type MenuUploadReviewPanelProps = {
  menuId: number
  items: MenuUploadItemRecord[]
  onItemPromoted: (item: MenuItemRecord) => void
}

function formatPrice(price: number | undefined): string | null {
  if (price === undefined || Number.isNaN(price)) {
    return null
  }
  const formatter = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
  })
  return formatter.format(price)
}

function formatConfidence(confidence?: number): string | null {
  if (confidence === undefined || Number.isNaN(confidence)) {
    return null
  }
  return `${Math.round(confidence * 100)}% confidence`
}

function formatTimestamp(timestamp: number): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp)
}

function buildReviewItem(base: MenuUploadItemRecord): ReviewPanelItem {
  return {
    ...base,
    isPromoting: false,
    isDiscarding: false,
    draftName: base.name ?? '',
    draftDescription: base.description ?? '',
    draftCategory: base.suggested_category ?? '',
    draftPrice:
      base.price !== undefined && base.price !== null && !Number.isNaN(Number(base.price))
        ? String(base.price)
        : '',
  }
}

function updateItemDraft(
  items: ReviewPanelItem[],
  id: number,
  updates: Partial<ReviewPanelItem>
): ReviewPanelItem[] {
  return items.map((entry) => (Number(entry.id) === id ? { ...entry, ...updates } : entry))
}

function toCommaSeparated(labels: Array<{ label: string }> | undefined): string | undefined {
  if (!labels || labels.length === 0) {
    return undefined
  }
  const normalized = labels
    .map((entry) => entry?.label?.trim())
    .filter((entry): entry is string => Boolean(entry))

  return normalized.length > 0 ? normalized.join(', ') : undefined
}

export function MenuUploadReviewPanel({ menuId, items, onItemPromoted }: MenuUploadReviewPanelProps) {
  const { toast } = useToast()
  const [reviewItems, setReviewItems] = useState<ReviewPanelItem[]>(() => items.map(buildReviewItem))
  const [recentlyPromoted, setRecentlyPromoted] = useState<RecentlyPromotedEntry[]>([])

  useEffect(() => {
    setReviewItems(items.map(buildReviewItem))
  }, [items])

  const hasItems = reviewItems.length > 0

  async function handlePromote(item: ReviewPanelItem) {
    const uploadId = Number(item.upload_id)
    const itemId = Number(item.id)

    if (!Number.isFinite(uploadId) || !Number.isFinite(itemId)) {
      toast({
        title: 'Unable to promote item',
        description: 'Upload item reference is invalid.',
        variant: 'error',
      })
      return
    }

    const trimmedPrice = item.draftPrice.trim()
    let priceValue: number | undefined
    if (trimmedPrice.length > 0) {
      const parsed = Number(trimmedPrice)
      if (!Number.isFinite(parsed)) {
        toast({
          title: 'Check price',
          description: 'Enter a numeric price before promoting this item.',
          variant: 'error',
        })
        return
      }
      priceValue = parsed
    }

    toast({
      title: 'Promoting item…',
      description: 'Saving your edits and adding the dish to the menu.',
      variant: 'info',
      duration: 3500,
    })

    setReviewItems((current) =>
      updateItemDraft(current, itemId, { isPromoting: true, draftPrice: trimmedPrice })
    )

    try {
      const response = await fetch(`/api/menus/uploads/${uploadId}/items/${itemId}/promote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          menuId,
          name: item.draftName.trim() || undefined,
          description: item.draftDescription.trim() || undefined,
          price: priceValue,
          category: item.draftCategory.trim() || undefined,
        }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to promote menu item')
      }

      const createdItem: MenuItemRecord | undefined = payload?.data

      if (createdItem) {
        onItemPromoted(createdItem)
      }

      setReviewItems((current) => current.filter((entry) => Number(entry.id) !== itemId))

      setRecentlyPromoted((current) => {
        const entry: RecentlyPromotedEntry = {
          id: itemId,
          name: item.draftName.trim() || item.name?.trim() || 'Untitled dish',
          promotedAt: Date.now(),
        }
        return [entry, ...current].slice(0, 5)
      })

      toast({
        title: 'Item added to menu',
        description: 'The AI suggestion has been promoted to the live menu.',
        variant: 'success',
      })
    } catch (error) {
      console.error('[MenuUploadReviewPanel] promote error', error)
      toast({
        title: 'Unable to promote item',
        description: error instanceof Error ? error.message : 'Try again later.',
        variant: 'error',
      })
      setReviewItems((current) => updateItemDraft(current, itemId, { isPromoting: false }))
    }
  }

  async function handleDiscard(item: ReviewPanelItem) {
    const uploadId = Number(item.upload_id)
    const itemId = Number(item.id)

    if (!Number.isFinite(uploadId) || !Number.isFinite(itemId)) {
      toast({
        title: 'Unable to discard item',
        description: 'Upload item reference is invalid.',
        variant: 'error',
      })
      return
    }

    setReviewItems((current) => updateItemDraft(current, itemId, { isDiscarding: true }))

    try {
      const response = await fetch(`/api/menus/uploads/${uploadId}/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'discarded',
        }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to discard menu upload item')
      }

      setReviewItems((current) => current.filter((entry) => Number(entry.id) !== itemId))

      toast({
        title: 'Suggestion discarded',
        description: 'The AI suggestion has been dismissed.',
        variant: 'success',
      })
    } catch (error) {
      console.error('[MenuUploadReviewPanel] discard error', error)
      toast({
        title: 'Unable to discard item',
        description: error instanceof Error ? error.message : 'Try again later.',
        variant: 'error',
      })
      setReviewItems((current) => updateItemDraft(current, itemId, { isDiscarding: false }))
    }
  }

  const panelBody = useMemo(() => {
    if (!hasItems) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
          No AI suggestions waiting for review. Upload a new menu or check back later.
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {reviewItems.map((item) => {
          const itemId = Number(item.id)
          const displayName = item.draftName.trim() || item.name?.trim() || 'Untitled dish'
          const priceLabel = formatPrice(item.price)
          const confidenceLabel = formatConfidence(item.confidence)
          const allergens =
            item.suggested_allergens?.map((tag) => tag.label).filter((label) => Boolean(label?.trim())) ?? []
          const dietary =
            item.suggested_dietary?.map((tag) => tag.label).filter((label) => Boolean(label?.trim())) ?? []

          const nameEdited = item.draftName.trim() !== (item.name?.trim() ?? '')
          const descriptionEdited = item.draftDescription.trim() !== (item.description?.trim() ?? '')
          const categoryEdited = item.draftCategory.trim() !== (item.suggested_category?.trim() ?? '')
          const priceEdited = (() => {
            const original = item.price ?? undefined
            const formattedDraft = item.draftPrice.trim()
            if (!formattedDraft && (original === undefined || original === null)) {
              return false
            }
            if (!formattedDraft && original !== undefined && original !== null) {
              return true
            }
            const draftNumeric = Number(formattedDraft)
            if (!Number.isFinite(draftNumeric)) return true
            return draftNumeric !== original
          })()

          return (
            <div
              key={`${item.upload_id}-${itemId}`}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 ring-1 ring-transparent transition hover:ring-[#F97316]/40"
            >
              <div className="grid gap-6 md:grid-cols-[minmax(0,3fr),minmax(0,1fr)]">
                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <label
                        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"
                        htmlFor={`review-name-${itemId}`}
                      >
                        Dish name
                        {nameEdited ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                            Edited
                          </span>
                        ) : null}
                      </label>
                      <input
                        id={`review-name-${itemId}`}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                        value={item.draftName}
                        onChange={(event) =>
                          setReviewItems((current) =>
                            updateItemDraft(current, itemId, { draftName: event.target.value })
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"
                        htmlFor={`review-category-${itemId}`}
                      >
                        Category
                        {categoryEdited ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                            Edited
                          </span>
                        ) : null}
                      </label>
                      <input
                        id={`review-category-${itemId}`}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                        value={item.draftCategory}
                        onChange={(event) =>
                          setReviewItems((current) =>
                            updateItemDraft(current, itemId, { draftCategory: event.target.value })
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-[2fr,1fr]">
                    <div className="space-y-2">
                      <label
                        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"
                        htmlFor={`review-description-${itemId}`}
                      >
                        Description
                        {descriptionEdited ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                            Edited
                          </span>
                        ) : null}
                      </label>
                      <textarea
                        id={`review-description-${itemId}`}
                        rows={3}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                        value={item.draftDescription}
                        onChange={(event) =>
                          setReviewItems((current) =>
                            updateItemDraft(current, itemId, { draftDescription: event.target.value })
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"
                        htmlFor={`review-price-${itemId}`}
                      >
                        Price
                        {priceEdited ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                            Edited
                          </span>
                        ) : null}
                      </label>
                      <input
                        id={`review-price-${itemId}`}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                        value={item.draftPrice}
                        placeholder={priceLabel ?? 'e.g. 9.99'}
                        onChange={(event) =>
                          setReviewItems((current) =>
                            updateItemDraft(current, itemId, { draftPrice: event.target.value })
                          )
                        }
                      />
                    </div>
                  </div>

                  {item.raw_text && (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Source text</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {item.raw_text.trim().slice(0, 320)}
                        {item.raw_text.trim().length > 320 ? '…' : ''}
                      </p>
                    </div>
                  )}

                  {(allergens.length > 0 || dietary.length > 0) && (
                    <div className="flex flex-wrap gap-2">
                      {allergens.map((label) => (
                        <span
                          key={`allergen-${itemId}-${label}`}
                          className="rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700"
                        >
                          {label}
                        </span>
                      ))}
                      {dietary.map((label) => (
                        <span
                          key={`dietary-${itemId}-${label}`}
                          className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  )}

                  {confidenceLabel && (
                    <p className="text-xs uppercase tracking-wide text-slate-500">{confidenceLabel}</p>
                  )}
                </div>

                <div className="flex flex-col items-start gap-3 md:items-end">
                  <button
                    type="button"
                    className="inline-flex items-center rounded-full bg-[#F97316] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#ea6b0c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F97316]"
                    onClick={() => handlePromote(item)}
                    disabled={item.isPromoting || item.isDiscarding}
                  >
                    {item.isPromoting ? 'Adding…' : 'Add to menu'}
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-200"
                    onClick={() => handleDiscard(item)}
                    disabled={item.isPromoting || item.isDiscarding}
                  >
                    {item.isDiscarding ? 'Discarding…' : 'Discard'}
                  </button>
                  <p className="text-xs text-slate-500">
                    Suggested by upload #{item.upload_id} · {displayName}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }, [hasItems, reviewItems])

  return (
    <section className="space-y-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">AI suggestions</h2>
          <p className="text-sm text-slate-600">
            Review items parsed from uploads. Promote the ones you want to add to this menu.
          </p>
        </div>
      </header>

      {panelBody}

      {recentlyPromoted.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recently promoted</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            {recentlyPromoted.map((entry) => (
              <li key={entry.id} className="flex justify-between gap-4">
                <span className="font-medium text-slate-700">{entry.name}</span>
                <span className="text-slate-500">{formatTimestamp(entry.promotedAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
