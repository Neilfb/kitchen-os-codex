'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import { useSession } from 'next-auth/react'

import { useToast } from '@/components/ui/toast'
import { createUserAction } from '@/app/users/actions'
import { Button } from '@components/ui/button'
import { Input } from '@components/ui/input'
import { getAssignableRolesFor } from '@/lib/auth/permissions'
import type { Role } from '@/types/user'

const ROLE_LABEL: Record<Role, string> = {
  superadmin: 'Superadmin',
  admin: 'Admin',
  manager: 'Manager',
}

function resolveAssignableRoles(actorRole: Role): Role[] {
  const assignable = getAssignableRolesFor(actorRole)
  if (assignable.length > 0) {
    return assignable
  }
  return ['manager']
}

function getDefaultRole(roles: Role[]): Role {
  if (roles.includes('manager')) {
    return 'manager'
  }
  if (roles.includes('admin')) {
    return 'admin'
  }
  return roles[0] ?? 'manager'
}

export function CreateUserForm() {
  const { data } = useSession()
  const actorRole = ((data?.user?.role ?? 'manager') as Role) ?? 'manager'
  const assignableRoles = useMemo(() => resolveAssignableRoles(actorRole), [actorRole])
  const defaultRole = useMemo(() => getDefaultRole(assignableRoles), [assignableRoles])

  const { toast } = useToast()
  const [ariaMessage, setAriaMessage] = useState('')
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = (formData: FormData) => {
    setAriaMessage('')

    startTransition(async () => {
      const result = await createUserAction(formData)
      const variant = result.status === 'success' ? 'success' : 'error'
      setAriaMessage(result.message ?? '')

      toast({
        title: result.status === 'success' ? 'User created' : 'Unable to create user',
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
        <div className="flex flex-col">
          <label htmlFor="user-password" className="text-sm font-medium text-slate-700">
            Temporary password
          </label>
          <Input
            id="user-password"
            name="password"
            type="password"
            placeholder="e.g. AllerQ!2"
            required
            minLength={6}
            aria-label="Password"
          />
          <p className="mt-1 text-xs text-slate-500">
            Minimum 6 characters, including uppercase, lowercase, number, and symbol.
          </p>
        </div>
        <div className="flex flex-col">
          <label htmlFor="role" className="text-sm font-medium text-slate-700">
            Role
          </label>
          <select
            id="role"
            name="role"
            defaultValue={defaultRole}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
          >
            {assignableRoles.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABEL[role]}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            You can assign: {assignableRoles.map((role) => ROLE_LABEL[role]).join(', ')}
          </p>
        </div>
      </div>
      <Button type="submit" disabled={isPending} className="bg-orange-600 text-white">
        {isPending ? 'Creating…' : 'Create user'}
      </Button>
      <p aria-live="polite" className="sr-only">
        {ariaMessage}
      </p>
    </form>
  )
}
