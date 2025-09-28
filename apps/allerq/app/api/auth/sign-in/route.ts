import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { NextResponse } from 'next/server'

import { setAuthCookie } from '@/lib/auth/cookies'
import {
  getAllowedRoles,
  getJwtAlgorithms,
  getJwtSecret,
  getSessionMaxAgeSeconds,
} from '@/lib/auth/constants'
import { getUserByEmail } from '@/lib/ncb/getUserByEmail'
import type { Role } from '@/types/user'

interface NcdbUserRecord {
  id: number | string
  email: string
  role: string
  uid: string
  display_name?: string | null
  assigned_restaurants?: unknown
}

function isValidRole(role: string): role is Role {
  return ['superadmin', 'admin', 'manager', 'staff', 'auditor'].includes(role)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body ?? {}

    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password.trim()) {
      return NextResponse.json({ status: 'error', message: 'Email and password are required' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const user = (await getUserByEmail({ email: normalizedEmail })) as NcdbUserRecord | null

    if (!user) {
      return NextResponse.json({ status: 'error', message: 'Invalid email or password' }, { status: 401 })
    }

    const isMatch = await bcrypt.compare(password, user.uid)

    if (!isMatch) {
      return NextResponse.json({ status: 'error', message: 'Invalid email or password' }, { status: 401 })
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    }

    const [jwtSecret, jwtAlgorithms, sessionMaxAgeSeconds] = await Promise.all([
      getJwtSecret(),
      getJwtAlgorithms(),
      getSessionMaxAgeSeconds(),
    ])

    const token = jwt.sign(tokenPayload, jwtSecret, {
      algorithm: jwtAlgorithms[0],
      expiresIn: sessionMaxAgeSeconds,
    })

    const safeUser = await normalizeSafeUser(user)

    const response = NextResponse.json(
      {
        status: 'success',
        user: safeUser,
      },
      { status: 200 }
    )

    await setAuthCookie(token, response)

    return response
  } catch (error) {
    console.error('[sign-in] Unexpected error', {
      message: error instanceof Error ? error.message : 'Unknown error',
    })
    return NextResponse.json({ status: 'error', message: 'Unable to sign in right now' }, { status: 500 })
  }
}

async function normalizeSafeUser(user: NcdbUserRecord) {
  const idNumber = typeof user?.id === 'number' ? user.id : Number(user?.id)
  if (!Number.isFinite(idNumber)) {
    throw new Error('NCDB user is missing a numeric id')
  }

  const email = typeof user?.email === 'string' && user.email.trim() ? user.email.trim().toLowerCase() : null
  if (!email) {
    throw new Error('NCDB user is missing an email address')
  }

  const allowedRoles = await getAllowedRoles()
  const roleCandidate = typeof user?.role === 'string' ? user.role.trim().toLowerCase() : ''
  const role: Role = isValidRole(roleCandidate) ? roleCandidate : 'staff'

  const assignedRestaurants = parseAssignedRestaurants(user?.assigned_restaurants)

  return {
    id: idNumber,
    email,
    role,
    displayName:
      typeof user?.display_name === 'string' && user.display_name.trim()
        ? user.display_name.trim()
        : null,
    assignedRestaurants,
  }
}

function parseAssignedRestaurants(value: unknown): string[] {
  if (!value) return []

  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return []

    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => (typeof item === 'string' ? item.trim() : typeof item === 'number' ? String(item).trim() : ''))
          .filter((item) => item.length > 0)
      }
    } catch (error) {
      // fall back to comma-separated parsing
    }

    return trimmed
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
  }

  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>)
      .map((item) => (typeof item === 'string' ? item.trim() : typeof item === 'number' ? String(item).trim() : ''))
      .filter((item) => item.length > 0)
  }

  return []
}
