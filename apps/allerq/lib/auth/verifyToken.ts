'use server'

import type { NextRequest } from 'next/server'
import jwt, { JsonWebTokenError, NotBeforeError, TokenExpiredError } from 'jsonwebtoken'

import {
  getAllowedRoles,
  getJwtAlgorithms,
  getJwtSecret,
  getSessionCookieName,
} from '@/lib/auth/constants'
import type { AllowedRole } from '@/lib/auth/constants'
import { AuthTokenError } from '@/lib/auth/errors'

const BEARER_PREFIX = /^\s*Bearer\s+/i

type UnknownRecord = Record<string, unknown>

interface RawJwtPayload extends jwt.JwtPayload {
  user?: UnknownRecord | null
  userId?: string | number
  id?: string | number
  email?: string
  role?: string
  display_name?: string
  displayName?: string
  assigned_restaurants?: unknown
  assignedRestaurants?: unknown
}

export interface VerifiedUser {
  id: string
  email: string
  role: AllowedRole
  assignedRestaurants: string[]
  displayName?: string | null
}

export interface VerifiedToken {
  token: string
  user: VerifiedUser
  issuedAt: Date | null
  expiresAt: Date | null
  rawPayload: RawJwtPayload
}

export interface AuthenticatedUser {
  id: number
  email: string
  role: AllowedRole
  displayName?: string | null
  assignedRestaurants?: string[]
}

export interface VerifyRequestOptions {
  requiredRoles?: AllowedRole | AllowedRole[]
  cookieName?: string
}

/**
 * Verifies the JWT attached to a request or provided token string and returns normalized user info.
 * Prefers the Authorization header but also honours AllerQ session cookies when a Request is supplied.
 */
export default async function verifyToken(
  requestOrToken: Request | string,
  options: VerifyRequestOptions = {}
): Promise<AuthenticatedUser> {
  const defaultCookieName = await getSessionCookieName()

  const detailArgs: VerifyTokenParams = {
    requiredRoles: options.requiredRoles,
    cookieName: options.cookieName ?? defaultCookieName,
  }

  if (typeof requestOrToken === 'string') {
    detailArgs.token = requestOrToken
  } else {
    detailArgs.request = requestOrToken
  }

  const { user } = await verifyTokenDetailed(detailArgs)

  const idNumber = typeof user.id === 'number' ? user.id : Number(user.id)

  if (!Number.isFinite(idNumber)) {
    throw new AuthTokenError('JWT payload must include a numeric user id', 401, 'TOKEN_INVALID')
  }

  return {
    id: idNumber,
    email: user.email,
    role: user.role,
    displayName: user.displayName,
    assignedRestaurants: user.assignedRestaurants,
  }
}

export interface VerifyTokenParams {
  request?: NextRequest | Request
  token?: string | null
  cookieName?: string
  requiredRoles?: AllowedRole | AllowedRole[]
}

export async function verifyTokenDetailed({
  request,
  token: providedToken,
  cookieName,
  requiredRoles,
}: VerifyTokenParams): Promise<VerifiedToken> {
  const resolvedCookieName = cookieName ?? (await getSessionCookieName())
  const jwtSecret = await getJwtSecret()
  const token = normalizeToken(providedToken ?? extractTokenFromRequest(request, resolvedCookieName))

  if (!token) {
    throw new AuthTokenError('Missing authentication token', 401, 'TOKEN_MISSING')
  }

  let rawPayload: RawJwtPayload
  try {
    const jwtAlgorithms = await getJwtAlgorithms()
    rawPayload = jwt.verify(token, jwtSecret, {
      algorithms: [...jwtAlgorithms],
    }) as RawJwtPayload
  } catch (error) {
    throw mapJwtError(error)
  }

  const user = await mapPayloadToUser(rawPayload)

  if (requiredRoles) {
    enforceRoleRequirement(user.role, requiredRoles)
  }

  return {
    token,
    user,
    issuedAt: typeof rawPayload.iat === 'number' ? new Date(rawPayload.iat * 1000) : null,
    expiresAt: typeof rawPayload.exp === 'number' ? new Date(rawPayload.exp * 1000) : null,
    rawPayload,
  }
}

function normalizeToken(input: string | null | undefined): string | null {
  if (!input) return null
  const trimmed = input.trim()
  return trimmed.length > 0 ? trimmed : null
}

function extractTokenFromRequest(
  request: NextRequest | Request | undefined,
  cookieName: string
): string | null {
  if (!request) return null

  const cookieFirst = extractTokenFromCookieHeader(request.headers?.get('cookie'), cookieName)
  if (cookieFirst) {
    return cookieFirst
  }

  if (isNextRequest(request)) {
    const cookie = request.cookies.get(cookieName)
    if (cookie) {
      return typeof cookie === 'string' ? cookie : cookie.value
    }
  }

  return extractTokenFromAuthorizationHeader(request.headers?.get('authorization'))
}

function extractTokenFromAuthorizationHeader(headerValue: string | null): string | null {
  if (!headerValue) return null
  const candidate = headerValue.replace(BEARER_PREFIX, '')
  return candidate !== headerValue ? candidate.trim() : null
}

function extractTokenFromCookieHeader(headerValue: string | null, cookieName: string): string | null {
  if (!headerValue) return null

  const cookies = headerValue.split(';')
  for (const rawCookie of cookies) {
    const index = rawCookie.indexOf('=')
    if (index === -1) continue
    const name = rawCookie.slice(0, index).trim()
    if (name !== cookieName) continue

    const value = rawCookie.slice(index + 1).trim()
    if (!value) return null
    try {
      return decodeURIComponent(value)
    } catch {
      return value
    }
  }

  return null
}

function isNextRequest(candidate: unknown): candidate is NextRequest {
  return (
    typeof candidate === 'object' &&
    candidate !== null &&
    'cookies' in candidate &&
    typeof (candidate as { cookies?: unknown }).cookies === 'object' &&
    candidate.cookies !== null &&
    typeof (candidate as NextRequest).cookies?.get === 'function'
  )
}

async function mapPayloadToUser(payload: RawJwtPayload): Promise<VerifiedUser> {
  const nestedUser =
    typeof payload.user === 'object' && payload.user !== null ? (payload.user as UnknownRecord) : null

  const idCandidate = firstMeaningful([
    payload.userId,
    payload.id,
    nestedUser?.id,
    nestedUser?.user_id,
  ])

  if (idCandidate === undefined || idCandidate === null || idCandidate === '') {
    throw new AuthTokenError('JWT payload is missing a user identifier', 401, 'TOKEN_INVALID')
  }

  const emailCandidate = firstMeaningful([payload.email, nestedUser?.email])
  if (typeof emailCandidate !== 'string' || !emailCandidate.trim()) {
    throw new AuthTokenError('JWT payload is missing an email address', 401, 'TOKEN_INVALID')
  }

  const roleCandidate = firstMeaningful([payload.role, nestedUser?.role])
  const allowedRoles = await getAllowedRoles()
  const role = normalizeRole(roleCandidate, allowedRoles)

  const assignedRestaurantsRaw = firstMeaningful([
    payload.assigned_restaurants,
    payload.assignedRestaurants,
    nestedUser?.assigned_restaurants,
    nestedUser?.assignedRestaurants,
  ])

  const assignedRestaurants = normalizeAssignedRestaurants(assignedRestaurantsRaw)

  const displayNameCandidate = firstMeaningful([
    payload.display_name,
    payload.displayName,
    nestedUser?.display_name,
    nestedUser?.displayName,
  ])

  return {
    id: String(idCandidate),
    email: emailCandidate.trim().toLowerCase(),
    role,
    assignedRestaurants,
    displayName:
      typeof displayNameCandidate === 'string' && displayNameCandidate.trim()
        ? displayNameCandidate.trim()
        : null,
  }
}

function normalizeRole(
  roleCandidate: unknown,
  allowedRoles: readonly string[]
): AllowedRole {
  if (typeof roleCandidate === 'string' && roleCandidate.trim()) {
    const normalized = roleCandidate.trim().toLowerCase()
    if (allowedRoles.includes(normalized)) {
      return normalized as AllowedRole
    }
  }

  throw new AuthTokenError('JWT payload contains an unknown role', 401, 'TOKEN_INVALID')
}

function normalizeAssignedRestaurants(rawValue: unknown): string[] {
  if (rawValue == null || rawValue === '') return []

  if (Array.isArray(rawValue)) {
    return rawValue
      .map((value) => (typeof value === 'string' || typeof value === 'number' ? String(value).trim() : ''))
      .filter((value) => value.length > 0)
  }

  if (typeof rawValue === 'string') {
    const trimmed = rawValue.trim()
    if (!trimmed) return []

    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed
          .map((value) => (typeof value === 'string' || typeof value === 'number' ? String(value).trim() : ''))
          .filter((value) => value.length > 0)
      }
    } catch (error) {
      // Treat as plain string fallback below
    }

    return trimmed
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
  }

  if (typeof rawValue === 'object') {
    return Object.values(rawValue as UnknownRecord)
      .map((value) => (typeof value === 'string' || typeof value === 'number' ? String(value).trim() : ''))
      .filter((value) => value.length > 0)
  }

  return []
}

function enforceRoleRequirement(userRole: AllowedRole, required: AllowedRole | AllowedRole[]) {
  const roles = Array.isArray(required) ? required : [required]
  if (roles.length === 0) return

  const normalizedRoles = roles.map((role) => role.toLowerCase()) as AllowedRole[]
  if (!normalizedRoles.includes(userRole)) {
    throw new AuthTokenError('Insufficient permissions for this resource', 403, 'ROLE_FORBIDDEN')
  }
}

function firstMeaningful(candidates: readonly unknown[]): unknown | undefined {
  for (const candidate of candidates) {
    if (candidate !== undefined && candidate !== null && candidate !== '') {
      return candidate
    }
  }
  return undefined
}

function mapJwtError(error: unknown): AuthTokenError {
  if (error instanceof TokenExpiredError) {
    return new AuthTokenError('Session expired. Please sign in again.', 401, 'TOKEN_EXPIRED')
  }

  if (error instanceof NotBeforeError) {
    return new AuthTokenError('Token is not yet valid. Please try again later.', 401, 'TOKEN_INVALID')
  }

  if (error instanceof JsonWebTokenError) {
    return new AuthTokenError('Invalid authentication token', 401, 'TOKEN_INVALID')
  }

  return new AuthTokenError('Unable to verify authentication token', 401, 'TOKEN_INVALID')
}
