import { redirect } from 'next/navigation'
import type { Session } from 'next-auth'

import type { Capability, SessionUser } from '@/types/user'
import { buildSessionUser, userHasCapability } from '@/lib/auth/permissions'

function resolveIdentifier(rawUser: NonNullable<Session['user']>): string {
  const candidate = (rawUser as { id?: unknown }).id
  if (typeof candidate === 'string' && candidate.trim()) {
    return candidate
  }
  if (typeof candidate === 'number' && Number.isFinite(candidate)) {
    return String(candidate)
  }
  if (typeof rawUser.email === 'string' && rawUser.email.trim()) {
    return rawUser.email
  }
  return ''
}

export function requireUser(session: Session | null | undefined): SessionUser {
  const rawUser = session?.user
  if (!rawUser || !rawUser.email) {
    redirect('/sign-in')
  }

  const identifier = resolveIdentifier(rawUser)

  if (!identifier) {
    redirect('/sign-in')
  }

  return buildSessionUser({
    id: identifier,
    email: rawUser.email,
    name: rawUser.name,
    role: rawUser.role,
    assignedRestaurants: rawUser.assignedRestaurants,
    capabilities: rawUser.capabilities,
  })
}

export function requireCapability(
  session: Session | null | undefined,
  capability: Capability
): SessionUser {
  const user = requireUser(session)

  if (userHasCapability(user, capability)) {
    return user
  }

  redirect('/dashboard')
}

export function requireAnyCapability(
  session: Session | null | undefined,
  capabilities: Capability[]
): SessionUser {
  const user = requireUser(session)

  if (capabilities.some((capability) => userHasCapability(user, capability))) {
    return user
  }

  redirect('/dashboard')
}
