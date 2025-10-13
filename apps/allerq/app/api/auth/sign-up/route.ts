import { createUser, type CreateUserInput } from '@/lib/ncb/createUser'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const data = (await req.json()) as CreateUserInput
    const result = await createUser(data)
    return NextResponse.json({ status: 'success', data: result })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    console.error('[sign-up API] error', error)
    return NextResponse.json(
      { status: 'error', message },
      { status: 500 }
    )
  }
}
