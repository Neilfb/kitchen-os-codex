'use server'

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

export async function buildAuthCookie(
  token: string,
  maxAge?: number
): Promise<AuthCookieDescriptor> {
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
    path: '/',
    maxAge: resolvedMaxAge,
  }
}

export async function setAuthCookie(
  token: string,
  response?: NextResponse,
  maxAge?: number
): Promise<AuthCookieDescriptor> {
  const cookie = await buildAuthCookie(token, maxAge)

  if (response) {
    response.cookies.set(cookie)
  }

  return cookie
}

export async function clearAuthCookie(response?: NextResponse): Promise<AuthCookieDescriptor> {
  const sessionCookieName = await getSessionCookieName()

  const cookie = {
    name: sessionCookieName,
    value: '',
    httpOnly: true as const,
    secure: true as const,
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 0,
  }

  if (response) {
    response.cookies.set(cookie)
  }

  return cookie
}

export async function getAuthCookie(
  request: NextRequest | Request | undefined,
  headerName?: string
): Promise<string | null> {
  if (!request) return null

  const cookieName = headerName ?? (await getSessionCookieName())

  if (isNextRequest(request)) {
    const cookie = request.cookies.get(cookieName)
    if (cookie) {
      return typeof cookie === 'string' ? cookie : cookie.value
    }
  }

  const cookieHeader = request.headers.get('cookie')
  if (!cookieHeader) return null

  const cookies = cookieHeader.split(';')
  for (const rawCookie of cookies) {
    const [name, ...rest] = rawCookie.split('=')
    if (!name || rest.length === 0) continue
    if (name.trim() !== cookieName) continue
    const value = rest.join('=').trim()
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
