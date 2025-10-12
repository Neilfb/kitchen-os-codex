'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { useToast } from '@/components/ui/toast'
import { MenuUploadReviewPanel } from '@/components/menus/MenuUploadReviewPanel'
import type { MenuItemRecord, MenuRecord } from '@/types/ncdb/menu'
import type { MenuUploadItemRecord } from '@/types/ncdb/menuUpload'

type MenuDetailClientProps = {
  menu: MenuRecord
  items: MenuItemRecord[]
  restaurantName: string
  pendingUploadItems: MenuUploadItemRecord[]
}

type EditableMenuItem = MenuItemRecord & {
  uiPrice: string
  isSaving?: boolean
  isDeleting?: boolean
}

const NEW_ITEM_TEMPLATE: EditableMenuItem = {
  id: -1,
  menu_id: -1,
  restaurant_id: -1,
  name: '',
  description: '',
  price: undefined,
  category: '',
  allergens: '',
  dietary: '',
  created_at: Date.now(),
  updated_at: Date.now(),
  uiPrice: '',
}

function mapMenuItemToEditable(item: MenuItemRecord): EditableMenuItem {
  return {
    ...item,
    uiPrice:
      item.price !== undefined && item.price !== null && !Number.isNaN(Number(item.price))
        ? Number(item.price).toFixed(2)
        : '',
    isSaving: false,
    isDeleting: false,
  }
}

export function MenuDetailClient({ menu, items, restaurantName, pendingUploadItems }: MenuDetailClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [name, setName] = useState(menu.name)
  const [description, setDescription] = useState(menu.description ?? '')
  const [menuType, setMenuType] = useState(menu.menu_type ?? '')
  const [isActive, setIsActive] = useState(menu.is_active !== false)
  const [savingMenu, setSavingMenu] = useState(false)

  const [menuItems, setMenuItems] = useState<EditableMenuItem[]>(items.map((item) => mapMenuItemToEditable(item)))
  const [newItem, setNewItem] = useState<EditableMenuItem>({ ...NEW_ITEM_TEMPLATE })
  const [isCreatingItem, setIsCreatingItem] = useState(false)

  const menuId = Number(menu.id)

  async function saveMenuMetadata() {
    setSavingMenu(true)
    try {
      const response = await fetch(`/api/menus/${menuId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          menu_type: menuType.trim() || undefined,
          is_active: isActive,
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.message || 'Failed to update menu')
      }

      toast({
        title: 'Menu updated',
        description: 'Changes saved successfully.',
        variant: 'success',
      })
      router.refresh()
    } catch (error) {
      console.error('[MenuDetailClient] update menu error', error)
      toast({
        title: 'Unable to save menu',
        description: error instanceof Error ? error.message : 'Try again later.',
        variant: 'error',
      })
    } finally {
      setSavingMenu(false)
    }
  }

  async function handleItemSave(item: EditableMenuItem) {
    setMenuItems((current) =>
      current.map((entry) => (Number(entry.id) === Number(item.id) ? { ...entry, isSaving: true } : entry))
    )
    try {
      const response = await fetch(`/api/menus/${menuId}/items/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: item.name.trim(),
          description: item.description?.trim(),
          price: item.uiPrice.trim().length > 0 ? Number(item.uiPrice) : null,
          category: item.category?.trim(),
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.message || 'Failed to update menu item')
      }

      toast({
        title: 'Item updated',
        description: `${item.name.trim()} saved successfully.`,
        variant: 'success',
      })

      router.refresh()
    } catch (error) {
      console.error('[MenuDetailClient] update item error', error)
      toast({
        title: 'Unable to save item',
        description: error instanceof Error ? error.message : 'Try again later.',
        variant: 'error',
      })
      setMenuItems((current) =>
        current.map((entry) => (Number(entry.id) === Number(item.id) ? { ...entry, isSaving: false } : entry))
      )
      return
    }

    setMenuItems((current) =>
      current.map((entry) =>
        Number(entry.id) === Number(item.id)
          ? {
              ...entry,
              isSaving: false,
            }
          : entry
      )
    )
  }

  async function handleItemDelete(itemId: number) {
    setMenuItems((current) =>
      current.map((entry) => (Number(entry.id) === Number(itemId) ? { ...entry, isDeleting: true } : entry))
    )
    try {
      const response = await fetch(`/api/menus/${menuId}/items/${itemId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.message || 'Failed to delete menu item')
      }

      toast({
        title: 'Item deleted',
        description: 'The dish has been removed from this menu.',
        variant: 'success',
      })

      setMenuItems((current) => current.filter((entry) => Number(entry.id) !== Number(itemId)))
      router.refresh()
    } catch (error) {
      console.error('[MenuDetailClient] delete item error', error)
      toast({
        title: 'Unable to delete item',
        description: error instanceof Error ? error.message : 'Try again later.',
        variant: 'error',
      })
      setMenuItems((current) =>
        current.map((entry) => (Number(entry.id) === Number(itemId) ? { ...entry, isDeleting: false } : entry))
      )
    }
  }

  async function handleCreateItem() {
    if (!newItem.name.trim()) {
      toast({
        title: 'Dish name required',
        description: 'Give the new item a name before saving.',
        variant: 'error',
      })
      return
    }

    setIsCreatingItem(true)
    try {
      const trimmedPrice = newItem.uiPrice.trim()
      let parsedPrice: number | undefined
      if (trimmedPrice.length > 0) {
        const numeric = Number(trimmedPrice)
        if (!Number.isFinite(numeric) || numeric < 0) {
          throw new Error('Enter a valid non-negative price before saving the item.')
        }
        parsedPrice = numeric
      }

      const response = await fetch(`/api/menus/${menuId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newItem.name.trim(),
          description: newItem.description?.trim(),
          price: parsedPrice,
          category: newItem.category?.trim(),
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.message || 'Failed to create menu item')
      }

      const payload = await response.json()
      const created: MenuItemRecord | undefined = payload?.data

      if (created) {
        setMenuItems((current) => [
          ...current,
          {
            ...mapMenuItemToEditable(created),
          },
        ])
      }

      toast({
        title: 'Item added',
        description: `${newItem.name.trim()} added to the menu.`,
        variant: 'success',
      })

      setNewItem({ ...NEW_ITEM_TEMPLATE })
      router.refresh()
    } catch (error) {
      console.error('[MenuDetailClient] create item error', error)
      toast({
        title: 'Unable to add item',
        description: error instanceof Error ? error.message : 'Try again later.',
        variant: 'error',
      })
    } finally {
      setIsCreatingItem(false)
    }
  }

  return (
    <div className="space-y-10">
      <header className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Restaurant</p>
            <p className="text-sm font-semibold text-slate-700">{restaurantName}</p>
          </div>
          <Link
            href="/menus"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
          >
            Back to menus
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700" htmlFor="menu-detail-name">
              Menu name
            </label>
            <input
              id="menu-detail-name"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700" htmlFor="menu-detail-type">
              Menu type
            </label>
            <input
              id="menu-detail-type"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              value={menuType}
              placeholder="Lunch, Dinner, Seasonal…"
              onChange={(event) => setMenuType(event.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="menu-detail-description">
            Description
          </label>
          <textarea
            id="menu-detail-description"
            rows={3}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-[#F97316] focus:ring-[#F97316]"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
            />
            Active menu
          </label>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={saveMenuMetadata}
            className="inline-flex items-center rounded-full bg-[#F97316] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#ea6b0c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F97316]"
            disabled={savingMenu}
          >
            {savingMenu ? 'Saving…' : 'Save menu'}
          </button>
        </div>
      </header>

      <MenuUploadReviewPanel
        menuId={menuId}
        items={pendingUploadItems}
        onItemPromoted={(created) => {
          setMenuItems((current) => [...current, mapMenuItemToEditable(created)])
          router.refresh()
        }}
      />

      <section className="space-y-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Dishes</h2>
            <p className="text-sm text-slate-600">Edit existing dishes or add new ones. Changes save individually.</p>
          </div>
        </header>

        <div className="space-y-4">
          {menuItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              No dishes yet. Use the form below to add your first item.
            </div>
          ) : (
            menuItems.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor={`item-name-${item.id}`}>
                      Dish name
                    </label>
                    <input
                      id={`item-name-${item.id}`}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                      value={item.name}
                      onChange={(event) =>
                        setMenuItems((current) =>
                          current.map((entry) =>
                            Number(entry.id) === Number(item.id) ? { ...entry, name: event.target.value } : entry
                          )
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor={`item-category-${item.id}`}>
                      Category
                    </label>
                    <input
                      id={`item-category-${item.id}`}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                      value={item.category ?? ''}
                      onChange={(event) =>
                        setMenuItems((current) =>
                          current.map((entry) =>
                            Number(entry.id) === Number(item.id) ? { ...entry, category: event.target.value } : entry
                          )
                        )
                      }
                    />
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-[2fr,1fr]">
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor={`item-description-${item.id}`}>
                      Description
                    </label>
                    <textarea
                      id={`item-description-${item.id}`}
                      rows={2}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                      value={item.description ?? ''}
                      onChange={(event) =>
                        setMenuItems((current) =>
                          current.map((entry) =>
                            Number(entry.id) === Number(item.id) ? { ...entry, description: event.target.value } : entry
                          )
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor={`item-price-${item.id}`}>
                      Price
                    </label>
                    <input
                      id={`item-price-${item.id}`}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                      value={item.uiPrice}
                      onChange={(event) =>
                        setMenuItems((current) =>
                          current.map((entry) =>
                            Number(entry.id) === Number(item.id) ? { ...entry, uiPrice: event.target.value } : entry
                          )
                        )
                      }
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="button"
                    className="inline-flex items-center rounded-full bg-[#F97316] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#ea6b0c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F97316]"
                    onClick={() => handleItemSave(item)}
                    disabled={item.isSaving}
                  >
                    {item.isSaving ? 'Saving…' : 'Save item'}
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-200"
                    onClick={() => handleItemDelete(Number(item.id))}
                    disabled={item.isDeleting}
                  >
                    {item.isDeleting ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-800">Add new dish</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="new-item-name">
                Dish name
              </label>
              <input
                id="new-item-name"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                value={newItem.name}
                onChange={(event) => setNewItem((current) => ({ ...current, name: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="new-item-category">
                Category
              </label>
              <input
                id="new-item-category"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                value={newItem.category ?? ''}
                onChange={(event) => setNewItem((current) => ({ ...current, category: event.target.value }))}
              />
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-[2fr,1fr]">
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="new-item-description">
                Description
              </label>
              <textarea
                id="new-item-description"
                rows={2}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                value={newItem.description ?? ''}
                onChange={(event) => setNewItem((current) => ({ ...current, description: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="new-item-price">
                Price
              </label>
              <input
                id="new-item-price"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                value={newItem.uiPrice}
                onChange={(event) => setNewItem((current) => ({ ...current, uiPrice: event.target.value }))}
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              className="inline-flex items-center rounded-full bg-[#F97316] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#ea6b0c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F97316]"
              onClick={handleCreateItem}
              disabled={isCreatingItem}
            >
              {isCreatingItem ? 'Adding…' : 'Add item'}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
