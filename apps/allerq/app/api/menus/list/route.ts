import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth/nextAuth'
import { actorHasMenuCapability, actorHasRestaurantAccess, buildActorFromSession } from '@/lib/menus/access'
import { getMenus } from '@/lib/ncb/menu'
import { getRestaurantById } from '@/lib/ncb/getRestaurantById'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ status: 'error', message: 'Authentication required' }, { status: 401 })
    }

    const actor = buildActorFromSession(session)

    if (!actorHasMenuCapability(actor)) {
      return NextResponse.json(
        { status: 'error', message: 'You do not have permission to view menus' },
        { status: 403 }
      )
    }

    const url = new URL(request.url)
    const restaurantIdParam = url.searchParams.get('restaurantId') ?? url.searchParams.get('restaurant_id')
    const includeInactiveParam = url.searchParams.get('includeInactive')

    if (!restaurantIdParam) {
      return NextResponse.json(
        { status: 'error', message: 'restaurantId query parameter is required' },
        { status: 400 }
      )
    }

    const restaurantId = Number(restaurantIdParam)
    if (!Number.isFinite(restaurantId) || restaurantId <= 0) {
      return NextResponse.json(
        { status: 'error', message: 'restaurantId must be a positive number' },
        { status: 400 }
      )
    }

    const restaurantRecord = await getRestaurantById({ id: restaurantId }).catch((error) => {
      console.error('[api/menus/list] failed to load restaurant', error)
      return null
    })

    if (!restaurantRecord) {
      return NextResponse.json({ status: 'error', message: 'Restaurant not found' }, { status: 404 })
    }

    if (!actorHasRestaurantAccess(actor, restaurantId, { ownerId: restaurantRecord.owner_id })) {
      return NextResponse.json(
        { status: 'error', message: 'You are not assigned to the requested restaurant' },
        { status: 403 }
      )
    }

    const includeInactive = includeInactiveParam ? includeInactiveParam.toLowerCase() === 'true' : false

    const menus = await getMenus({
      restaurantId,
      isActive: includeInactive ? undefined : true,
    })

    return NextResponse.json(
      {
        status: 'success',
        data: menus,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load menus'
    console.error('[api/menus/list] error', error)
    return NextResponse.json({ status: 'error', message }, { status: 500 })
  }
}
