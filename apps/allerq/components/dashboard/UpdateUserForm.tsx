'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import { useSession } from 'next-auth/react'

import { useToast } from '@/components/ui/toast'
import { updateUserAction } from '@/app/users/actions'
import { Button } from '@components/ui/button'
import { Input } from '@components/ui/input'
import { getAssignableRolesFor } from '@/lib/auth/permissions'
import type { Role } from '@/types/user'

interface UserOption {
  id?: number | string | null
  email: string
  display_name?: string | null
  role?: string | null
}

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
  return []
}

export function UpdateUserForm({ users }: { users: UserOption[] }) {
  const formRef = useRef<HTMLFormElement>(null)
  const { toast } = useToast()
  const [ariaMessage, setAriaMessage] = useState('')
  const [isPending, startTransition] = useTransition()
  const { data } = useSession()
  const actorRole = ((data?.user?.role ?? 'manager') as Role) ?? 'manager'

  const assignableRoles = useMemo(() => resolveAssignableRoles(actorRole), [actorRole])

  const handleSubmit = (formData: FormData) => {
    setAriaMessage('')
    startTransition(async () => {
      const result = await updateUserAction(formData)
      const variant = result.status === 'success' ? 'success' : 'error'
      setAriaMessage(result.message ?? '')

      toast({
        title: result.status === 'success' ? 'User updated' : 'Unable to update user',
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
        {assignableRoles.length > 0 ? (
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
              {assignableRoles.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABEL[role]}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              You can set roles to: {assignableRoles.map((role) => ROLE_LABEL[role]).join(', ')}
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            You do not have permission to change user roles.
          </p>
        )}
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
