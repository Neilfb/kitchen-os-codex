const ALLOWED_ROLE_VALUES = ['superadmin', 'admin', 'manager', 'staff', 'auditor'] as const
const SESSION_COOKIE_NAME_VALUE = '__Host-allerq-token'
const SESSION_MAX_AGE_SECONDS_VALUE = 60 * 60 * 24 * 7 // 7 days
const JWT_ALGORITHM_VALUES = ['HS256'] as const

export type AllowedRole = (typeof ALLOWED_ROLE_VALUES)[number]

let cachedSecret: string | null = null

export async function getAllowedRoles(): Promise<typeof ALLOWED_ROLE_VALUES> {
  return ALLOWED_ROLE_VALUES
}

export async function getSessionCookieName(): Promise<string> {
  return SESSION_COOKIE_NAME_VALUE
}

export async function getSessionMaxAgeSeconds(): Promise<number> {
  return SESSION_MAX_AGE_SECONDS_VALUE
}

export async function getJwtAlgorithms(): Promise<typeof JWT_ALGORITHM_VALUES> {
  return JWT_ALGORITHM_VALUES
}

export async function getJwtSecret(): Promise<string> {
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
