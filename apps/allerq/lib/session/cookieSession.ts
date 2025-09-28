import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

import {
  AllowedRole,
  JWT_ALGORITHMS,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  getJwtSecret,
} from '@/lib/auth/constants'

const SESSION_SECRET = getJwtSecret()

export type SessionRole = AllowedRole

export interface SessionUser {
  id: string
  email: string
  role: SessionRole
  display_name?: string
}

interface SessionTokenPayload extends SessionUser {
  iat: number
  exp: number
}

export function setSessionCookie(user: SessionUser, maxAge: number = SESSION_MAX_AGE_SECONDS) {
  const token = jwt.sign(user, SESSION_SECRET, {
    expiresIn: maxAge,
    algorithm: JWT_ALGORITHMS[0],
  })

  cookies().set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: true,
    path: '/',
    maxAge,
  })
}

export function getSessionUser(): SessionUser | null {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value
  if (!token) return null

  try {
    const payload = jwt.verify(token, SESSION_SECRET, {
      algorithms: JWT_ALGORITHMS,
    }) as SessionTokenPayload
    const { id, email, role, display_name } = payload
    return { id: String(id), email, role, display_name }
  } catch (error) {
    clearSessionCookie()
    return null
  }
}

export function clearSessionCookie() {
  cookies().set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: true,
    path: '/',
    maxAge: 0,
  })
}
