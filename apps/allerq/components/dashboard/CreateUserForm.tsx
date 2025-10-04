'use client'

import { useRef, useState, useTransition } from 'react'

import { createUserAction } from '@/app/users/actions'
import { Button } from '@components/ui/button'
import { Input } from '@components/ui/input'

const ROLES = [
  { value: 'manager', label: 'Manager' },
  { value: 'admin', label: 'Admin' },
  { value: 'superadmin', label: 'Superadmin' },
  { value: 'staff', label: 'Staff' },
  { value: 'auditor', label: 'Auditor' },
] as const

export function CreateUserForm() {
  const [message, setMessage] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = (formData: FormData) => {
    setMessage(null)
    setStatus('idle')

    startTransition(async () => {
      const result = await createUserAction(formData)
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
      <h3 className="text-lg font-semibold text-slate-900">Add a user</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <Input name="fullName" placeholder="Full name" required aria-label="Full name" />
        <Input
          name="email"
          type="email"
          placeholder="Email"
          required
          aria-label="Email address"
        />
        <Input
          name="password"
          type="password"
          placeholder="Temporary password"
          required
          minLength={8}
          aria-label="Password"
        />
        <div className="flex flex-col">
          <label htmlFor="role" className="text-sm font-medium text-slate-700">
            Role
          </label>
          <select
            id="role"
            name="role"
            defaultValue="manager"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
          >
            {ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Button type="submit" disabled={isPending} className="bg-orange-600 text-white">
        {isPending ? 'Creating…' : 'Create user'}
      </Button>
      {message && (
        <p className={`text-sm ${status === 'error' ? 'text-red-600' : 'text-green-600'}`}>{message}</p>
      )}
    </form>
  )
}
