'use server'

import type { NextRequest, NextResponse } from 'next/server'

import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from '@/lib/auth/constants'

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

export function buildAuthCookie(token: string, maxAge: number = SESSION_MAX_AGE_SECONDS): AuthCookieDescriptor {
  if (!token?.trim()) {
    throw new Error('Auth cookie token value is required')
  }

  return {
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: COOKIE_PATH,
    maxAge,
  }
}

export function setAuthCookie(
  token: string,
  response?: NextResponse,
  maxAge: number = SESSION_MAX_AGE_SECONDS
): AuthCookieDescriptor {
  const cookie = buildAuthCookie(token, maxAge)

  if (response) {
    response.cookies.set(cookie)
  }

  return cookie
}

export function clearAuthCookie(response?: NextResponse) {
  const cookie = {
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true as const,
    secure: true as const,
    sameSite: 'strict' as const,
    path: COOKIE_PATH,
    maxAge: 0,
  }

  if (response) {
    response.cookies.set(cookie)
  }

  return cookie
}

export function getAuthCookie(
  request: NextRequest | Request | undefined,
  headerName: string = SESSION_COOKIE_NAME
): string | null {
  if (!request) return null

  if (isNextRequest(request)) {
    const cookie = request.cookies.get(headerName)
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
    if (name.trim() !== headerName) continue
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

