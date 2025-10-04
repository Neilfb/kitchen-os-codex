'use client'

import { useState, useTransition } from 'react'

import { deleteRestaurantAction } from '@/app/restaurants/actions'
import { Button } from '@components/ui/button'

interface RestaurantOption {
  id: number | string
  name: string
}

export function DeleteRestaurantForm({ restaurants }: { restaurants: RestaurantOption[] }) {
  const [message, setMessage] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (formData: FormData) => {
    setMessage(null)
    setStatus('idle')

    startTransition(async () => {
      const result = await deleteRestaurantAction(formData)
      setMessage(result.message)
      setStatus(result.status)
    })
  }

  return (
    <form
      action={handleSubmit}
      className="space-y-3 rounded-xl border border-red-200 bg-white p-4 shadow-sm"
    >
      <h3 className="text-lg font-semibold text-red-700">Delete restaurant</h3>
      <p className="text-sm text-red-600">This action cannot be undone.</p>
      <select
        name="id"
        required
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/40"
      >
        <option value="" disabled selected>
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
      {message && (
        <p className={`text-sm ${status === 'error' ? 'text-red-600' : 'text-green-600'}`}>{message}</p>
      )}
    </form>
  )
}
