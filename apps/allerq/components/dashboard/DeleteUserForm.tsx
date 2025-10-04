'use client'

import { useState, useTransition } from 'react'

import { deleteUserAction } from '@/app/users/actions'
import { Button } from '@components/ui/button'

interface UserOption {
  id?: number | string | null
  email: string
  display_name?: string | null
}

export function DeleteUserForm({ users }: { users: UserOption[] }) {
  const [message, setMessage] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (formData: FormData) => {
    setMessage(null)
    setStatus('idle')
    startTransition(async () => {
      const result = await deleteUserAction(formData)
      setMessage(result.message)
      setStatus(result.status)
    })
  }

  return (
    <form
      action={handleSubmit}
      className="space-y-3 rounded-xl border border-red-200 bg-white p-4 shadow-sm"
    >
      <h3 className="text-lg font-semibold text-red-700">Delete user</h3>
      <p className="text-sm text-red-600">This action cannot be undone.</p>
      <select
        name="id"
        required
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/40"
      >
        <option value="" disabled selected>
          Select user to delete
        </option>
        {users.map((user) => (
          <option key={user.id ?? user.email} value={user.id ?? user.email}>
            {user.display_name ?? user.email}
          </option>
        ))}
      </select>
      <Button type="submit" disabled={isPending} className="bg-red-600 text-white">
        {isPending ? 'Deleting…' : 'Delete user'}
      </Button>
      {message && (
        <p className={`text-sm ${status === 'error' ? 'text-red-600' : 'text-green-600'}`}>{message}</p>
      )}
    </form>
  )
}
