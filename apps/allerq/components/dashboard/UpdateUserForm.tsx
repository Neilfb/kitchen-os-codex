'use client'

import { useRef, useState, useTransition } from 'react'

import { updateUserAction } from '@/app/users/actions'
import { Button } from '@components/ui/button'
import { Input } from '@components/ui/input'

interface UserOption {
  id?: number | string | null
  email: string
  display_name?: string | null
  role?: string | null
}

const ROLES = [
  { value: 'manager', label: 'Manager' },
  { value: 'admin', label: 'Admin' },
  { value: 'superadmin', label: 'Superadmin' },
  { value: 'staff', label: 'Staff' },
  { value: 'auditor', label: 'Auditor' },
] as const

export function UpdateUserForm({ users }: { users: UserOption[] }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (formData: FormData) => {
    setMessage(null)
    setStatus('idle')
    startTransition(async () => {
      const result = await updateUserAction(formData)
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
      <h3 className="text-lg font-semibold text-slate-900">Update user</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex flex-col">
          <label htmlFor="user-id" className="text-sm font-medium text-slate-700">
            User
          </label>
          <select
            id="user-id"
            name="id"
            required
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
          >
            <option value="" disabled>
              Select user
            </option>
            {users.map((user) => (
              <option key={user.id ?? user.email} value={user.id ?? user.email}>
                {user.display_name ?? user.email}
              </option>
            ))}
          </select>
        </div>
        <Input name="fullName" placeholder="New name (optional)" aria-label="Full name" />
        <Input name="password" type="password" placeholder="New password (optional)" aria-label="New password" />
        <div className="flex flex-col">
          <label htmlFor="role" className="text-sm font-medium text-slate-700">
            Role
          </label>
          <select
            id="role"
            name="role"
            defaultValue=""
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
          >
            <option value="">Unchanged</option>
            {ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Button type="submit" disabled={isPending} className="bg-orange-600 text-white">
        {isPending ? 'Saving…' : 'Save changes'}
      </Button>
      {message && (
        <p className={`text-sm ${status === 'error' ? 'text-red-600' : 'text-green-600'}`}>{message}</p>
      )}
    </form>
  )
}
