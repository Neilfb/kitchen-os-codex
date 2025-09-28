import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

import {
  getJwtAlgorithms,
  getJwtSecret,
  getSessionCookieName,
  getSessionMaxAgeSeconds,
} from '@/lib/auth/constants'
import type { AllowedRole } from '@/lib/auth/constants'

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

export async function setSessionCookie(
  user: SessionUser,
  maxAge?: number
): Promise<void> {
  const [sessionSecret, sessionCookieName, sessionMaxAgeSeconds, jwtAlgorithms] = await Promise.all([
    getJwtSecret(),
    getSessionCookieName(),
    getSessionMaxAgeSeconds(),
    getJwtAlgorithms(),
  ])

  const resolvedMaxAge = typeof maxAge === 'number' ? maxAge : sessionMaxAgeSeconds

  const token = jwt.sign(user, sessionSecret, {
    expiresIn: resolvedMaxAge,
    algorithm: jwtAlgorithms[0],
  })

  cookies().set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: true,
    path: '/',
    maxAge: resolvedMaxAge,
  })
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const sessionCookieName = await getSessionCookieName()
  const token = cookies().get(sessionCookieName)?.value
  if (!token) return null

  try {
    const [sessionSecret, jwtAlgorithms] = await Promise.all([
      getJwtSecret(),
      getJwtAlgorithms(),
    ])
    const payload = jwt.verify(token, sessionSecret, {
      algorithms: jwtAlgorithms,
    }) as SessionTokenPayload
    const { id, email, role, display_name } = payload
    return { id: String(id), email, role, display_name }
  } catch (error) {
    await clearSessionCookie()
    return null
  }
}

export async function clearSessionCookie(): Promise<void> {
  const sessionCookieName = await getSessionCookieName()

  cookies().set(sessionCookieName, '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: true,
    path: '/',
    maxAge: 0,
  })
}
