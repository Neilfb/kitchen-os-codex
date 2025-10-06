import type { Capability, Role, SessionUser } from '@/types/user'

type CapabilitySet = Set<Capability>

const ROLE_CAPABILITIES: Record<Role, CapabilitySet> = {
  superadmin: new Set<Capability>([
    'platform.superadmin',
    'platform.debug',
    'restaurant.create',
    'restaurant.manage:any',
    'menu.manage',
    'user.manage:any',
    'user.manage.roles',
    'analytics.view:any',
    'billing.view:any',
    'qr.generate',
  ]),
  admin: new Set<Capability>([
    'restaurant.create',
    'restaurant.manage:own',
    'menu.manage',
    'user.manage:own',
    'analytics.view:own',
    'billing.view:own',
    'qr.generate',
  ]),
  manager: new Set<Capability>([
    'restaurant.manage:assigned',
    'menu.manage',
    'qr.generate',
  ]),
}

const KNOWN_CAPABILITIES: Set<Capability> = new Set<Capability>([
  ...ROLE_CAPABILITIES.superadmin,
  ...ROLE_CAPABILITIES.admin,
  ...ROLE_CAPABILITIES.manager,
])

const ROLE_ASSIGNABLE_ROLES: Record<Role, Role[]> = {
  superadmin: ['superadmin', 'admin', 'manager'],
  admin: ['manager'],
  manager: [],
}

export function getRoleCapabilities(role: Role | undefined | null): CapabilitySet {
  if (!role) {
    return new Set<Capability>()
  }
  return ROLE_CAPABILITIES[role] ?? new Set<Capability>()
}

export function listCapabilitiesForRole(role: Role): Capability[] {
  return Array.from(getRoleCapabilities(role))
}

export function sanitizeCapabilities(value: unknown, role: Role): Capability[] {
  if (!Array.isArray(value)) {
    return listCapabilitiesForRole(role)
  }

  const filtered = value.filter((entry): entry is Capability =>
    typeof entry === 'string' && KNOWN_CAPABILITIES.has(entry as Capability)
  )

  if (filtered.length === 0) {
    return listCapabilitiesForRole(role)
  }

  return filtered
}

export function userHasCapability(user: SessionUser | null | undefined, capability: Capability): boolean {
  if (!user || !user.role) {
    return false
  }

  if (user.role === 'superadmin') {
    return true
  }

  const capabilities = user.capabilities?.length
    ? new Set<Capability>(user.capabilities)
    : getRoleCapabilities(user.role)
  return capabilities.has(capability)
}

export function normalizeAssignedRestaurants(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === 'string' ? entry.trim() : String(entry).trim()))
      .filter((entry) => entry.length > 0)
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) {
      return []
    }

    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed
          .map((entry) => (typeof entry === 'string' ? entry.trim() : String(entry).trim()))
          .filter((entry) => entry.length > 0)
      }
    } catch {
      return [trimmed]
    }

    return [trimmed]
  }

  if (value === null || value === undefined) {
    return []
  }

  return [String(value)]
}

export function getAssignableRolesFor(actorRole: Role): Role[] {
  return ROLE_ASSIGNABLE_ROLES[actorRole] ?? []
}

export function ensureAssignableRole(actorRole: Role, requestedRole: Role): Role {
  const allowedRoles = getAssignableRolesFor(actorRole)
  if (allowedRoles.includes(requestedRole)) {
    return requestedRole
  }
  throw new Error('You do not have permission to assign the requested role')
}

export function buildSessionUser(partial: {
  id: string
  email: string
  name?: string | null
  role?: Role | string | null
  assignedRestaurants?: unknown
  capabilities?: unknown
}): SessionUser {
  const roleCandidate = (partial.role ?? 'manager') as Role
  const normalizedRole: Role = roleCandidate === 'superadmin' || roleCandidate === 'admin' ? roleCandidate : 'manager'
  const assignedRestaurants = normalizeAssignedRestaurants(partial.assignedRestaurants)
  const capabilities = sanitizeCapabilities(partial.capabilities, normalizedRole)

  return {
    id: partial.id,
    email: partial.email.toLowerCase(),
    name: partial.name ?? undefined,
    role: normalizedRole,
    assignedRestaurants,
    capabilities,
  }
}
