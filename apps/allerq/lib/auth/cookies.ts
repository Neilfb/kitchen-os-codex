import { cookies } from 'next/headers'
import type { NextRequest, NextResponse } from 'next/server'

import { getSessionCookieName, getSessionMaxAgeSeconds } from '@/lib/auth/constants'

const COOKIE_PATH = '/'

export interface AuthCookieDescriptor {
  name: string
  value: string
  httpOnly: true
  secure: true
  sameSite: 'strict'
  path: typeof COOKIE_PATH
  maxAge: number
}

export async function buildAuthCookie(token: string, maxAge?: number): Promise<AuthCookieDescriptor> {
  if (!token?.trim()) {
    throw new Error('Auth cookie token value is required')
  }

  const [sessionCookieName, sessionMaxAgeSeconds] = await Promise.all([
    getSessionCookieName(),
    getSessionMaxAgeSeconds(),
  ])

  const resolvedMaxAge = typeof maxAge === 'number' ? maxAge : sessionMaxAgeSeconds

  return {
    name: sessionCookieName,
    value: token,
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/' as '/',
    maxAge: resolvedMaxAge,
  }
}

export async function setAuthCookie(token: string, response?: NextResponse, maxAge?: number): Promise<AuthCookieDescriptor> {
  const cookie = await buildAuthCookie(token, maxAge)

  if (response) {
    response.cookies.set(cookie)
  } else {
    try {
      cookies().set(cookie)
    } catch (error) {
      console.warn('[auth/cookies] unable to set auth cookie via cookies()', error)
    }
  }

  return cookie
}

export async function clearAuthCookie(response?: NextResponse): Promise<AuthCookieDescriptor> {
  const sessionCookieName = await getSessionCookieName()

  const cookie: AuthCookieDescriptor = {
    name: sessionCookieName,
    value: '',
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/' as '/',
    maxAge: 0,
  }

  if (response) {
    response.cookies.set(cookie)
  } else {
    try {
      cookies().set(cookie)
    } catch (error) {
      console.warn('[auth/cookies] unable to clear auth cookie via cookies()', error)
    }
  }

  return cookie
}

export async function getAuthCookie(
  request: NextRequest | Request | undefined,
  headerName?: string
): Promise<string | null> {
  const cookieName = headerName ?? (await getSessionCookieName())

  if (request && 'cookies' in request && typeof (request as NextRequest).cookies?.get === 'function') {
    const candidate = (request as NextRequest).cookies.get(cookieName)
    if (candidate) {
      const value = typeof candidate === 'string' ? candidate : candidate.value
      if (value?.trim()) {
        return value.trim()
      }
    }
  }

  if (request) {
    const directCookie = request.headers.get('cookie') ?? request.headers.get('Cookie')
    if (directCookie) {
      const match = directCookie
        .split(';')
        .map((entry) => entry.trim())
        .find((entry) => entry.startsWith(`${cookieName}=`))

      if (match) {
        const value = match.split('=').slice(1).join('=').trim()
        if (value) {
          try {
            return decodeURIComponent(value)
          } catch {
            return value
          }
        }
      }
    }
  }

  try {
    const cookie = cookies().get(cookieName)?.value
    return cookie ? cookie.trim() : null
  } catch (error) {
    console.warn('[auth/cookies] unable to read cookies()', error)
  }

  return null
}
