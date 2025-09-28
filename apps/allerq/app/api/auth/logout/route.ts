import { NextResponse } from 'next/server'

import { clearAuthCookie } from '@/lib/auth/cookies'

export async function POST() {
  const response = NextResponse.json(
    {
      status: 'success',
      message: 'Logged out successfully',
    },
    { status: 200 }
  )

  clearAuthCookie(response)

  return response
}

