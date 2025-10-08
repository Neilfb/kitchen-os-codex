import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth/nextAuth'
import { buildSessionUser, userHasCapability } from '@/lib/auth/permissions'
import { deleteRestaurant } from '@/lib/ncb/deleteRestaurant'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ status: 'error', message: 'Authentication required' }, { status: 401 })
    }

    const actor = buildSessionUser({
      id: (session.user as { id?: string | number })?.id?.toString() ?? session.user.email,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      assignedRestaurants: session.user.assignedRestaurants,
      capabilities: session.user.capabilities,
      userId: (session.user as { ncdbUserId?: number | string })?.ncdbUserId,
    })

    const canManageAny =
      userHasCapability(actor, 'restaurant.manage:any') || userHasCapability(actor, 'platform.superadmin')

    if (!canManageAny) {
      return NextResponse.json(
        { status: 'error', message: 'You do not have permission to delete restaurants' },
        { status: 403 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const id = Number(body?.id)

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ status: 'error', message: 'Valid restaurant id is required' }, { status: 400 })
    }

    await deleteRestaurant({ id })

    return NextResponse.json({ status: 'success' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete restaurant'
    console.error('[api/restaurants/delete] error', error)
    return NextResponse.json({ status: 'error', message }, { status: 500 })
  }
}
