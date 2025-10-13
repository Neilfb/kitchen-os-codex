'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { createMenuWithItemsAction } from '@/app/menus/actions'
import { useToast } from '@/components/ui/toast'

type RestaurantOption = {
  id: number
  name: string
}

type MenuEditorProps = {
  restaurants: RestaurantOption[]
  canCreateMenus: boolean
}

type MenuItemDraft = {
  id: string
  name: string
  description: string
  price?: string
  category?: string
}

const EMPTY_ITEM: MenuItemDraft = {
  id: 'new-item',
  name: '',
  description: '',
}

function isDraftValid(draft: MenuItemDraft): boolean {
  return draft.name.trim().length > 0
}

export function MenuEditor({ restaurants, canCreateMenus }: MenuEditorProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | undefined>(() => restaurants[0]?.id)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [menuType, setMenuType] = useState('')
  const [items, setItems] = useState<MenuItemDraft[]>([EMPTY_ITEM])
  const [isSaving, setIsSaving] = useState(false)

  const restaurantOptions = useMemo(() => restaurants.map((restaurant) => restaurant.id.toString()), [restaurants])

  const resetForm = useCallback(() => {
    setName('')
    setDescription('')
    setMenuType('')
    setItems([EMPTY_ITEM])
  }, [])

  const handleAddItem = useCallback(() => {
    setItems((current) => [
      ...current.filter((item) => isDraftValid(item) || item.id !== 'new-item'),
      {
        id: `draft-${Date.now()}`,
        name: '',
        description: '',
      },
    ])
  }, [])

  const handleItemChange = useCallback((draftId: string, patch: Partial<MenuItemDraft>) => {
    setItems((current) =>
      current.map((item) => (item.id === draftId ? { ...item, ...patch } : item))
    )
  }, [])

  const handleRemoveItem = useCallback((draftId: string) => {
    setItems((current) => current.filter((item) => item.id !== draftId))
  }, [])

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (!canCreateMenus) {
        toast({
          title: 'Menu creation blocked',
          description: 'You do not have permission to create menus.',
          variant: 'error',
        })
        return
      }

      if (!selectedRestaurantId) {
        toast({
          title: 'Select a restaurant',
          description: 'Choose a venue before creating a menu.',
          variant: 'error',
        })
        return
      }

      const targetRestaurantId = Number(selectedRestaurantId)

      if (!Number.isFinite(targetRestaurantId) || targetRestaurantId <= 0) {
        toast({
          title: 'Invalid restaurant',
          description: 'Select a valid restaurant before saving.',
          variant: 'error',
        })
        return
      }

      if (!name.trim()) {
        toast({
          title: 'Name is required',
          description: 'Give this menu a name before saving.',
          variant: 'error',
        })
        return
      }

      const validItems = items.filter(isDraftValid)

      let itemsPayload: Parameters<typeof createMenuWithItemsAction>[0]['items'] = []

      try {
        itemsPayload = validItems.map((item) => {
          const trimmedPrice = item.price?.trim() ?? ''
          const price = trimmedPrice ? Number(trimmedPrice) : undefined

          if (price !== undefined && (!Number.isFinite(price) || price < 0)) {
            throw new Error('Menu item prices must be non-negative numbers.')
          }

          return {
            name: item.name.trim(),
            description: item.description.trim(),
            price,
            category: item.category?.trim() || undefined,
          }
        })
      } catch (priceError) {
        setIsSaving(false)
        toast({
          title: 'Invalid menu item',
          description:
            priceError instanceof Error ? priceError.message : 'Check item details and try again.',
          variant: 'error',
        })
        return
      }

      setIsSaving(true)
      try {
        const result = await createMenuWithItemsAction({
          restaurantId: targetRestaurantId,
          name: name.trim(),
          description: description.trim() || undefined,
          menuType: menuType.trim() || undefined,
          items: itemsPayload,
        })

        if (result.status !== 'success') {
          throw new Error(result.message ?? 'Failed to create menu')
        }

        toast({
          title: 'Menu created',
          description: `“${name.trim()}” is ready for review.`,
          variant: 'success',
        })

        resetForm()
        router.refresh()
      } catch (error) {
        console.error('[MenuEditor] failed to create menu', error)
        toast({
          title: 'Unable to create menu',
          description: error instanceof Error ? error.message : 'Try again or contact support.',
          variant: 'error',
        })
      } finally {
        setIsSaving(false)
      }
    },
    [canCreateMenus, description, items, menuType, name, resetForm, router, selectedRestaurantId, toast]
  )

  if (restaurants.length === 0) {
    return null
  }

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Create menu</h2>
          <p className="text-sm text-slate-600">
            Start from scratch or add dishes manually. You can upload PDFs later for AI-assisted enrichment.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-700" htmlFor="menu-editor-restaurant">
            Restaurant
          </label>
          <select
            id="menu-editor-restaurant"
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
      </header>

      <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700" htmlFor="menu-name">
              Menu name
            </label>
            <input
              id="menu-name"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              placeholder="Summer 2025 dinner menu"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700" htmlFor="menu-type">
              Menu type (optional)
            </label>
            <input
              id="menu-type"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              placeholder="Lunch, Dinner, Seasonal, Vegan…"
              value={menuType}
              onChange={(event) => setMenuType(event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="menu-description">
            Description (optional)
          </label>
          <textarea
            id="menu-description"
            rows={3}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="Highlight seasonal ingredients, dietary focus, or service hours."
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Menu items</h3>
            <button
              type="button"
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
              onClick={handleAddItem}
              disabled={!canCreateMenus}
            >
              Add item
            </button>
          </div>

          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              No dishes yet. Add your first item above.
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="flex-1 space-y-2">
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor={`item-name-${item.id}`}>
                        Dish name
                      </label>
                      <input
                        id={`item-name-${item.id}`}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                        placeholder="Grilled courgette with lemon yoghurt"
                        value={item.name}
                        onChange={(event) => handleItemChange(item.id, { name: event.target.value })}
                      />
                    </div>

                    <div className="w-full max-w-[140px] space-y-2">
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor={`item-price-${item.id}`}>
                        Price
                      </label>
                      <input
                        id={`item-price-${item.id}`}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                        placeholder="12.50"
                        inputMode="decimal"
                        value={item.price ?? ''}
                        onChange={(event) => handleItemChange(item.id, { price: event.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor={`item-description-${item.id}`}>
                        Description
                      </label>
                      <textarea
                        id={`item-description-${item.id}`}
                        rows={2}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                        placeholder="Charred courgette, whipped feta, lemon dressing, toasted seeds."
                        value={item.description}
                        onChange={(event) => handleItemChange(item.id, { description: event.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor={`item-category-${item.id}`}>
                        Category
                      </label>
                      <input
                        id={`item-category-${item.id}`}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                        placeholder="Starters, Desserts, Drinks…"
                        value={item.category ?? ''}
                        onChange={(event) => handleItemChange(item.id, { category: event.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      className="text-xs font-semibold uppercase tracking-wide text-slate-400 transition hover:text-red-600"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
            onClick={resetForm}
            disabled={isSaving}
          >
            Reset
          </button>
          <button
            type="submit"
            className="rounded-full bg-[#F97316] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#ea6b0c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F97316]"
            disabled={isSaving}
          >
            {isSaving ? 'Saving…' : 'Create menu'}
          </button>
        </div>
      </form>
    </section>
  )
}
