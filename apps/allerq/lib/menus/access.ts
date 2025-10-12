import { buildSessionUser, userHasCapability } from '@/lib/auth/permissions'
import type { SessionUser } from '@/types/user'

type SessionLike =
  | {
      user?: {
        id?: string | number | null
        email?: string | null
        name?: string | null
        role?: string | null
        assignedRestaurants?: unknown
        capabilities?: unknown
        ncdbUserId?: number | string | null
      }
    }
  | null
  | undefined

export function buildActorFromSession(session: SessionLike): SessionUser {
  const rawUser = session?.user ?? {}
  const email =
    typeof rawUser.email === 'string' && rawUser.email.trim().length > 0 ? rawUser.email.trim() : 'unknown'
  const idCandidate =
    rawUser.id !== null && rawUser.id !== undefined
      ? rawUser.id.toString()
      : typeof rawUser.email === 'string'
      ? rawUser.email
      : 'unknown'

  return buildSessionUser({
    id: idCandidate,
    email,
    name: rawUser.name,
    role: rawUser.role,
    assignedRestaurants: rawUser.assignedRestaurants,
    capabilities: rawUser.capabilities,
    userId: rawUser.ncdbUserId,
  })
}

export function actorHasMenuCapability(actor: SessionUser) {
  return userHasCapability(actor, 'menu.manage')
}

type OwnerContext = {
  ownerId?: string | number | null
}

function normalize(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim().toLowerCase()
  }
  if (typeof value === 'number') {
    return value.toString().trim().toLowerCase()
  }
  return ''
}

function actorOwnsRestaurant(actor: SessionUser, context?: OwnerContext) {
  if (!context?.ownerId) {
    return false
  }

  const owner = normalize(context.ownerId)
  if (!owner) {
    return false
  }

  const actorId = normalize(actor.id)
  const actorEmail = normalize(actor.email)
  const actorNcdbId = actor.ncdbUserId > 0 ? normalize(actor.ncdbUserId) : ''

  return owner === actorId || owner === actorEmail || (actorNcdbId && owner === actorNcdbId)
}

export function actorHasRestaurantAccess(actor: SessionUser, restaurantId: number, context?: OwnerContext) {
  const canManageAny =
    userHasCapability(actor, 'restaurant.manage:any') || userHasCapability(actor, 'platform.superadmin')

  if (canManageAny) {
    return true
  }

  const assignments = (actor.assignedRestaurants ?? []).map((value) => value.toString())
  if (assignments.some((value) => value.toLowerCase() === 'all')) {
    return true
  }
  if (assignments.includes(restaurantId.toString())) {
    return true
  }

  const canManageOwn = userHasCapability(actor, 'restaurant.manage:own')
  if (canManageOwn && actorOwnsRestaurant(actor, context)) {
    return true
  }

  const canManageAssigned = userHasCapability(actor, 'restaurant.manage:assigned')
  if (canManageAssigned) {
    return assignments.includes(restaurantId.toString())
  }

  return false
}
