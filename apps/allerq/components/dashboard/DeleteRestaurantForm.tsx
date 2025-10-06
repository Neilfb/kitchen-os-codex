'use client'

import { useRef, useState, useTransition } from 'react'

import { useToast } from '@/components/ui/toast'
import { deleteRestaurantAction } from '@/app/restaurants/actions'
import { Button } from '@components/ui/button'

interface RestaurantOption {
  id: number | string
  name: string
}

export function DeleteRestaurantForm({ restaurants }: { restaurants: RestaurantOption[] }) {
  const formRef = useRef<HTMLFormElement>(null)
  const { toast } = useToast()
  const [ariaMessage, setAriaMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (formData: FormData) => {
    setAriaMessage('')

    startTransition(async () => {
      const result = await deleteRestaurantAction(formData)
      const variant = result.status === 'success' ? 'success' : 'error'
      setAriaMessage(result.message ?? '')

      toast({
        title: result.status === 'success' ? 'Restaurant deleted' : 'Unable to delete restaurant',
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
      className="space-y-3 rounded-xl border border-red-200 bg-white p-4 shadow-sm"
    >
      <h3 className="text-lg font-semibold text-red-700">Delete restaurant</h3>
      <p className="text-sm text-red-600">This action cannot be undone.</p>
      <select
        name="id"
        required
        defaultValue=""
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/40"
      >
        <option value="" disabled>
          Select restaurant to delete
        </option>
        {restaurants.map((restaurant) => (
          <option key={restaurant.id} value={restaurant.id}>
            {restaurant.name}
          </option>
        ))}
      </select>
      <Button type="submit" disabled={isPending} className="bg-red-600 text-white">
        {isPending ? 'Deleting…' : 'Delete restaurant'}
      </Button>
      <p aria-live="polite" className="sr-only">
        {ariaMessage}
      </p>
    </form>
  )
}
