'use client'

import { useRef, useState, useTransition } from 'react'

import { createRestaurantAction } from '@/app/restaurants/actions'
import { Button } from '@components/ui/button'
import { Input } from '@components/ui/input'

export function CreateRestaurantForm() {
  const [message, setMessage] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = (formData: FormData) => {
    setMessage(null)
    setStatus('idle')
    startTransition(async () => {
      const result = await createRestaurantAction(formData)
      setMessage(result.message)
      setStatus(result.status)
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
      <h3 className="text-lg font-semibold text-slate-900">Add a restaurant</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <Input name="name" placeholder="Restaurant name" required aria-label="Restaurant name" />
        <Input name="owner_id" placeholder="Owner ID" required aria-label="Owner ID" />
        <Input name="email" type="email" placeholder="Email (optional)" aria-label="Email" />
        <Input name="phone" placeholder="Phone (optional)" aria-label="Phone" />
        <Input name="address" placeholder="Address (optional)" aria-label="Address" className="md:col-span-2" />
        <Input name="website" placeholder="Website (optional)" aria-label="Website" />
        <Input name="cuisine_type" placeholder="Cuisine type (optional)" aria-label="Cuisine type" />
      </div>
      <Button type="submit" disabled={isPending} className="bg-orange-600 text-white">
        {isPending ? 'Creating…' : 'Create restaurant'}
      </Button>
      {message && (
        <p className={`text-sm ${status === 'error' ? 'text-red-600' : 'text-green-600'}`}>{message}</p>
      )}
    </form>
  )
}
