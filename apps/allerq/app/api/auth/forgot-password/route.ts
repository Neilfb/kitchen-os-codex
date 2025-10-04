import { NextResponse } from 'next/server'
import { z } from 'zod'

const RequestSchema = z.object({
  email: z.string().email(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = RequestSchema.parse(body)

    console.log('[forgot-password] request received', { email })

    return NextResponse.json(
      {
        status: 'pending',
        message: 'Password reset instructions will be sent to your email once this feature is enabled.',
      },
      { status: 202 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ status: 'error', message: error.message }, { status: 400 })
    }

    console.error('[forgot-password] unexpected error', error)
    return NextResponse.json({ status: 'error', message: 'Unable to process request' }, { status: 500 })
  }
}
