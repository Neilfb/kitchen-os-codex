'use client'

import type { ReactNode } from 'react'
import { useSession } from 'next-auth/react'

import type { Capability, Role } from '@/types/user'

function normalizeList<T>(input: T | T[] | undefined): T[] {
  if (!input) {
    return []
  }
  return Array.isArray(input) ? input : [input]
}

type RoleGateProps = {
  children: ReactNode
  fallback?: ReactNode
  requireRoles?: Role | Role[]
  requireCapabilities?: Capability | Capability[]
}

export function RoleGate({
  children,
  fallback = null,
  requireRoles,
  requireCapabilities,
}: RoleGateProps) {
  const { data, status } = useSession()

  if (status === 'loading') {
    return null
  }

  const user = data?.user

  if (!user) {
    return <>{fallback}</>
  }

  const role = (user.role ?? 'manager') as Role
  const capabilities = Array.isArray(user.capabilities) ? user.capabilities : []

  if (role === 'superadmin') {
    return <>{children}</>
  }

  const requiredRoles = normalizeList(requireRoles)
  if (requiredRoles.length > 0 && !requiredRoles.includes(role)) {
    return <>{fallback}</>
  }

  const requiredCapabilities = normalizeList(requireCapabilities)
  if (requiredCapabilities.length > 0) {
    const capabilitySet = new Set<Capability>(capabilities as Capability[])
    const hasAll = requiredCapabilities.every((capability) => capabilitySet.has(capability))

    if (!hasAll) {
      return <>{fallback}</>
    }
  }

  return <>{children}</>
}
