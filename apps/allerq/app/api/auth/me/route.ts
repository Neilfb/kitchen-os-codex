import { NextResponse } from 'next/server'

import { getAuthCookie } from '@/lib/auth/cookies'
import verifyToken from '@/lib/auth/verifyToken'

const BEARER_PREFIX = /^\s*Bearer\s+/i

export async function GET(request: Request) {
  try {
    const cookieToken = await getAuthCookie(request)
    const headerToken = cookieToken ? null : extractBearerToken(request.headers.get('authorization'))
    const token = cookieToken ?? headerToken

    if (!token) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Authentication required',
        },
        { status: 401 }
      )
    }

    const user = await verifyToken(token)

    return NextResponse.json(
      {
        status: 'success',
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          displayName: user.displayName,
          assignedRestaurants: user.assignedRestaurants,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    const status = typeof (error as { status?: number }).status === 'number' ? (error as { status?: number }).status! : 401

    console.error('[auth/me] authentication failed', {
      message: error instanceof Error ? error.message : 'Unknown error',
      status,
    })

    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Authentication failed',
      },
      { status }
    )
  }
}

function extractBearerToken(headerValue: string | null): string | null {
  if (typeof headerValue !== 'string' || !headerValue.trim()) {
    return null
  }

  if (!BEARER_PREFIX.test(headerValue)) {
    return null
  }

  return headerValue.replace(BEARER_PREFIX, '').trim() || null
}
