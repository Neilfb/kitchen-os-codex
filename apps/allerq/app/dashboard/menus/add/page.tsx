'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'

type MenuItem = {
  id: string
  name: string
  description: string
  price: string
  allergens: string
}

type FieldErrors = {
  menuName?: string
  items: Record<string, Partial<Record<keyof MenuItem, string>>>
}

const inputClassName =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm transition duration-150 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40'

const errorInputClassName =
  'border-red-400 focus:border-red-500 focus:ring-red-300'

export default function AddMenuPage() {
  const router = useRouter()
  const [menuName, setMenuName] = useState('Main Menu')
  const [category, setCategory] = useState('Lunch')
  const [items, setItems] = useState<MenuItem[]>([createEmptyItem()])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({ items: {} })

  const handleItemChange = (id: string, field: keyof MenuItem, value: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
    setErrors((prev) => {
      const current = prev.items[id]
      if (!current || !current[field]) return prev
      const nextItems = { ...prev.items, [id]: { ...current, [field]: undefined } }
      return { ...prev, items: nextItems }
    })
  }

  const handleAddItem = () => {
    setItems((prev) => [...prev, createEmptyItem()])
  }

  const handleRemoveItem = (id: string) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((item) => item.id !== id)))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    const nextErrors: FieldErrors = { items: {} }

    if (!menuName.trim()) {
      nextErrors.menuName = 'Menu name is required.'
    }

    let hasItemErrors = false
    items.forEach((item) => {
      const itemErrors: Partial<Record<keyof MenuItem, string>> = {}
      if (!item.name.trim()) itemErrors.name = 'Dish name is required.'
      if (!item.description.trim()) itemErrors.description = 'Please provide a short description.'
      if (!item.price.trim()) itemErrors.price = 'Price is required.'
      if (!item.allergens.trim()) itemErrors.allergens = 'List allergens or mark as allergen-free.'

      if (Object.keys(itemErrors).length > 0) {
        nextErrors.items[item.id] = itemErrors
        hasItemErrors = true
      }
    })

    const hasErrors = Boolean(nextErrors.menuName) || hasItemErrors

    if (hasErrors) {
      setErrors(nextErrors)
      setSaving(false)
      return
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 600))
      setMessage('Menu saved! You can now generate QR codes for dining tables.')
      setErrors({ items: {} })
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-br from-orange-50 via-white to-slate-100 px-6 py-16">
      <div className="mx-auto w-full max-w-4xl rounded-3xl bg-white p-10 shadow-xl shadow-orange-100">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-500">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link className="transition-colors hover:text-[#F97316]" href="/dashboard">
                Dashboard
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link className="transition-colors hover:text-[#F97316]" href="/dashboard/create">
                Restaurant profile
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-slate-700">Menu builder</li>
          </ol>
        </nav>

        <header className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#F97316]">Step 2</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Build your allergen-aware menu</h1>
          <p className="mt-3 text-base text-slate-600">
            Add dishes, highlight allergen notes, and organize categories to power AllerQ QR menus.
          </p>
        </header>

        <div className="mb-6 rounded-2xl border border-orange-100 bg-orange-50/60 px-4 py-3 text-sm text-slate-600">
          Progress is saved once you submit this step. Navigating away before saving will reset these fields.
        </div>

        <div className="mb-8 flex flex-wrap gap-3">
          <Button
            asChild
            className="border border-[#F97316] px-4 py-2.5 text-sm font-semibold text-[#F97316] hover:-translate-y-0.5 hover:bg-orange-50 hover:text-[#ea6b0c]"
          >
            <Link href="/dashboard/qr/create">Skip to QR builder</Link>
          </Button>
          <Button
            asChild
            className="bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md"
          >
            <Link href="/dashboard/create">Back to restaurant profile</Link>
          </Button>
        </div>

        <form className="space-y-8" onSubmit={handleSubmit}>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="menuName" className="text-sm font-medium text-slate-700">
                Menu name
              </label>
              <input
                id="menuName"
                value={menuName}
                onChange={(event) => {
                  setMenuName(event.target.value)
                  setErrors((prev) => ({ ...prev, menuName: undefined }))
                }}
                aria-invalid={Boolean(errors.menuName)}
                className={`${inputClassName} ${errors.menuName ? errorInputClassName : ''}`.trim()}
              />
              {errors.menuName && <p className="text-xs text-red-500">{errors.menuName}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium text-slate-700">
                Menu category
              </label>
              <input
                id="category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className={inputClassName}
              />
            </div>
          </div>

          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-900">Menu items</h2>
            <p className="text-sm text-slate-600">
              Include allergen tags so guests can filter items instantly with their AllerQ scan.
            </p>

            {items.map((item, index) => {
              const itemErrors = errors.items[item.id] ?? {}

              return (
                <div key={item.id} className="rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">Dish {index + 1}</h3>
                    <Button
                      type="button"
                      className="text-sm text-slate-500 hover:text-red-500"
                    onClick={() => handleRemoveItem(item.id)}
                  >
                    Remove
                  </Button>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor={`name-${item.id}`} className="text-sm font-medium text-slate-700">
                      Dish name
                    </label>
                    <input
                      id={`name-${item.id}`}
                      value={item.name}
                      onChange={(event) => handleItemChange(item.id, 'name', event.target.value)}
                      placeholder="Citrus Herb Salmon"
                      aria-invalid={Boolean(itemErrors.name)}
                      className={`${inputClassName} ${itemErrors.name ? errorInputClassName : ''}`.trim()}
                    />
                    {itemErrors.name && <p className="text-xs text-red-500">{itemErrors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor={`price-${item.id}`} className="text-sm font-medium text-slate-700">
                      Price
                    </label>
                    <input
                      id={`price-${item.id}`}
                      value={item.price}
                      onChange={(event) => handleItemChange(item.id, 'price', event.target.value)}
                      placeholder="$24"
                      aria-invalid={Boolean(itemErrors.price)}
                      className={`${inputClassName} ${itemErrors.price ? errorInputClassName : ''}`.trim()}
                    />
                    {itemErrors.price && <p className="text-xs text-red-500">{itemErrors.price}</p>}
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label htmlFor={`description-${item.id}`} className="text-sm font-medium text-slate-700">
                      Description
                    </label>
                    <textarea
                      id={`description-${item.id}`}
                      value={item.description}
                      onChange={(event) => handleItemChange(item.id, 'description', event.target.value)}
                      rows={3}
                      placeholder="Seared salmon with citrus glaze, served alongside roasted root vegetables."
                      aria-invalid={Boolean(itemErrors.description)}
                      className={`${inputClassName} ${itemErrors.description ? errorInputClassName : ''} resize-none`.trim()}
                    />
                    {itemErrors.description && <p className="text-xs text-red-500">{itemErrors.description}</p>}
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label htmlFor={`allergens-${item.id}`} className="text-sm font-medium text-slate-700">
                      Allergen notes
                    </label>
                    <input
                      id={`allergens-${item.id}`}
                      value={item.allergens}
                      onChange={(event) => handleItemChange(item.id, 'allergens', event.target.value)}
                      placeholder="Contains fish, dairy | Gluten-free"
                      aria-invalid={Boolean(itemErrors.allergens)}
                      className={`${inputClassName} ${itemErrors.allergens ? errorInputClassName : ''}`.trim()}
                    />
                    {itemErrors.allergens && <p className="text-xs text-red-500">{itemErrors.allergens}</p>}
                  </div>
                </div>
              </div>
              )
            })}

            <Button
              type="button"
              onClick={handleAddItem}
              className="w-full border border-dashed border-[#F97316] bg-orange-50/60 px-4 py-3 text-[#F97316] hover:-translate-y-0.5 hover:bg-orange-100 hover:text-[#ea6b0c]"
            >
              + Add another dish
            </Button>
          </section>

          {message && (
            <div className="space-y-3">
              <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{message}</p>
              <div className="flex flex-wrap gap-3">
                <Button
                  asChild
                  className="bg-[#F97316] px-4 py-2.5 text-white hover:-translate-y-0.5 hover:bg-[#ea6b0c] hover:shadow-lg"
                >
                  <Link href="/dashboard/qr/create">Continue to QR builder</Link>
                </Button>
                <Button
                  asChild
                  className="border border-[#F97316] px-4 py-2.5 text-[#F97316] hover:-translate-y-0.5 hover:bg-orange-50 hover:text-[#ea6b0c]"
                >
                  <Link href="/dashboard/analytics">View menu analytics</Link>
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              className="w-full bg-white px-4 py-2.5 text-slate-700 shadow-sm hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md sm:w-auto"
              onClick={() => router.push('/dashboard/create')}
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="w-full bg-[#F97316] px-4 py-2.5 font-semibold text-white hover:-translate-y-0.5 hover:bg-[#ea6b0c] hover:shadow-lg sm:w-auto"
            >
              {saving ? 'Saving menu…' : 'Save menu & continue'}
            </Button>
          </div>
        </form>
      </div>
    </main>
  )
}

function createEmptyItem(): MenuItem {
  return {
    id: Math.random().toString(36).slice(2, 9),
    name: '',
    description: '',
    price: '',
    allergens: '',
  }
}
