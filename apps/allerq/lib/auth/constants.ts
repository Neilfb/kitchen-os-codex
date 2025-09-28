'use server'

export const ALLOWED_ROLES = ['superadmin', 'admin', 'manager', 'staff', 'auditor'] as const
export type AllowedRole = (typeof ALLOWED_ROLES)[number]

export const SESSION_COOKIE_NAME = '__Host-allerq-token'
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 days
export const JWT_ALGORITHMS = ['HS256'] as const

let cachedSecret: string | null = null

export function getJwtSecret(): string {
  if (cachedSecret) {
    return cachedSecret
  }

  const explicitSecret = process.env.ALLERQ_JWT_SECRET?.trim()
  if (explicitSecret) {
    cachedSecret = explicitSecret
    return cachedSecret
  }

  const sessionSecret = process.env.ALLERQ_SESSION_SECRET?.trim()
  if (sessionSecret) {
    cachedSecret = sessionSecret
    return cachedSecret
  }

  throw new Error(
    'Missing ALLERQ_JWT_SECRET (preferred) or ALLERQ_SESSION_SECRET environment variables for JWT signing.'
  )
}
