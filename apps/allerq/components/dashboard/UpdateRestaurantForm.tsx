'use client'

import { useRef, useState, useTransition } from 'react'

import { useToast } from '@/components/ui/toast'
import { updateRestaurantAction } from '@/app/restaurants/actions'
import { Button } from '@components/ui/button'
import { Input } from '@components/ui/input'

interface RestaurantOption {
  id: number | string
  name: string
  owner_id?: string | null
  email?: string | null
}

export function UpdateRestaurantForm({ restaurants }: { restaurants: RestaurantOption[] }) {
  const formRef = useRef<HTMLFormElement>(null)
  const { toast } = useToast()
  const [ariaMessage, setAriaMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (formData: FormData) => {
    setAriaMessage('')

    startTransition(async () => {
      const result = await updateRestaurantAction(formData)
      const variant = result.status === 'success' ? 'success' : 'error'
      setAriaMessage(result.message ?? '')

      toast({
        title: result.status === 'success' ? 'Restaurant updated' : 'Unable to update restaurant',
        description: result.message,
        variant,
      })

      if (result.status === 'success') {
        formRef.current?.reset()
      }
    })
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <h3 className="text-lg font-semibold text-slate-900">Update restaurant</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex flex-col">
          <label htmlFor="restaurant-id" className="text-sm font-medium text-slate-700">
            Restaurant
          </label>
          <select
            id="restaurant-id"
            name="id"
            required
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
          >
            <option value="" disabled>
              Select restaurant
            </option>
            {restaurants.map((restaurant) => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </option>
            ))}
          </select>
        </div>
        <Input name="name" placeholder="New name (optional)" aria-label="New name" />
        <Input name="owner_id" placeholder="Owner ID (optional)" aria-label="Owner ID" />
        <Input name="email" type="email" placeholder="Email (optional)" aria-label="Email" />
        <Input name="phone" placeholder="Phone (optional)" aria-label="Phone" />
        <Input name="address" placeholder="Address (optional)" aria-label="Address" className="md:col-span-2" />
      </div>
      <Button type="submit" disabled={isPending} className="bg-orange-600 text-white">
        {isPending ? 'Saving…' : 'Save changes'}
      </Button>
      <p aria-live="polite" className="sr-only">
        {ariaMessage}
      </p>
    </form>
  )
}
