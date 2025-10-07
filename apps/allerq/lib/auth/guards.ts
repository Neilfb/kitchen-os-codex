import { redirect } from 'next/navigation'
import type { Session } from 'next-auth'

import type { Capability, SessionUser } from '@/types/user'
import { buildSessionUser, userHasCapability } from '@/lib/auth/permissions'

export function requireUser(session: Session | null | undefined): SessionUser {
  const rawUser = session?.user
  if (!rawUser || !rawUser.email) {
    redirect('/sign-in')
  }

  const candidateId = (rawUser as { id?: unknown }).id
  let identifier = ''
  if (typeof candidateId === 'string' && candidateId.trim()) {
    identifier = candidateId.trim()
  } else if (typeof candidateId === 'number' && Number.isFinite(candidateId)) {
    identifier = String(candidateId)
  } else if (typeof rawUser.email === 'string' && rawUser.email.trim()) {
    identifier = rawUser.email.trim()
  }

  const userIdCandidate = (rawUser as { ncdbUserId?: number | string }).ncdbUserId
  const normalizedNcdbId =
    typeof userIdCandidate === 'number'
      ? userIdCandidate
      : typeof userIdCandidate === 'string' && userIdCandidate.trim()
      ? Number(userIdCandidate.trim())
      : undefined

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
    userId: normalizedNcdbId,
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
