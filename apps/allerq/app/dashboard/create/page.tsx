'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'

const inputClassName =
  'w-full rounded-lg border border-slate-200 px-4 py-2.5 text-slate-900 shadow-sm transition duration-150 focus:border-[#F97316] focus:outline-none focus:ring-2 focus:ring-[#F97316]/40'

export default function CreateRestaurantPage() {
  const router = useRouter()
  const [formState, setFormState] = useState({
    name: '',
    cuisine: '',
    description: '',
    address: '',
    contactEmail: '',
    contactPhone: '',
    openingHours: '',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleChange = (field: keyof typeof formState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormState((prev) => ({ ...prev, [field]: event.target.value }))
    }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      await new Promise((resolve) => setTimeout(resolve, 600))
      setMessage('Restaurant saved! You can now start building menus.')
      router.push('/dashboard/menus/add')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-br from-orange-50 via-white to-slate-100 px-6 py-16">
      <div className="mx-auto w-full max-w-3xl rounded-3xl bg-white p-10 shadow-xl shadow-orange-100">
        <header className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#F97316]">Step 1</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Create your restaurant profile</h1>
          <p className="mt-3 text-base text-slate-600">
            Tell AllerQ about your restaurant so we can tailor allergen-friendly menus and QR experiences.
          </p>
        </header>

        <form className="space-y-8" onSubmit={handleSubmit}>
          <section className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2 space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-slate-700">
                Restaurant name
              </label>
              <input
                id="name"
                value={formState.name}
                onChange={handleChange('name')}
                required
                placeholder="AllerQ Bistro"
                className={inputClassName}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="cuisine" className="text-sm font-medium text-slate-700">
                Cuisine focus
              </label>
              <input
                id="cuisine"
                value={formState.cuisine}
                onChange={handleChange('cuisine')}
                placeholder="Mediterranean, vegan, gluten-free"
                className={inputClassName}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="openingHours" className="text-sm font-medium text-slate-700">
                Opening hours
              </label>
              <input
                id="openingHours"
                value={formState.openingHours}
                onChange={handleChange('openingHours')}
                placeholder="Mon-Fri 11am - 9pm"
                className={inputClassName}
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-slate-700">
                Restaurant story
              </label>
              <textarea
                id="description"
                value={formState.description}
                onChange={handleChange('description')}
                rows={4}
                placeholder="Share what makes your experience unique and how you approach allergen safety."
                className={`${inputClassName} resize-none`}
              />
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="address" className="text-sm font-medium text-slate-700">
                Location
              </label>
              <input
                id="address"
                value={formState.address}
                onChange={handleChange('address')}
                placeholder="123 Allergy Aware Ave, Portland"
                className={inputClassName}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="contactEmail" className="text-sm font-medium text-slate-700">
                Contact email
              </label>
              <input
                id="contactEmail"
                type="email"
                value={formState.contactEmail}
                onChange={handleChange('contactEmail')}
                placeholder="hello@allerqbistro.com"
                className={inputClassName}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="contactPhone" className="text-sm font-medium text-slate-700">
                Phone number
              </label>
              <input
                id="contactPhone"
                value={formState.contactPhone}
                onChange={handleChange('contactPhone')}
                placeholder="(503) 555-0119"
                className={inputClassName}
              />
            </div>
          </section>

          {message && <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{message}</p>}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              className="w-full bg-white px-4 py-2.5 text-slate-700 shadow-sm hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md sm:w-auto"
              onClick={() => router.push('/dashboard')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F97316] px-4 py-2.5 font-semibold text-white hover:-translate-y-0.5 hover:bg-[#ea6b0c] hover:shadow-lg sm:w-auto"
            >
              {loading ? 'Saving…' : 'Save & continue'}
            </Button>
          </div>
        </form>
      </div>
    </main>
  )
}
