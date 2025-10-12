import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'

import { authOptions } from '@/lib/auth/nextAuth'
import { getMenuById } from '@/lib/ncb/getMenuById'
import { getMenuItems, updateMenuItem, deleteMenuItem } from '@/lib/ncb/menuItem'
import { getRestaurantById } from '@/lib/ncb/getRestaurantById'
import { actorHasMenuCapability, actorHasRestaurantAccess, buildActorFromSession } from '@/lib/menus/access'

const UpdateMenuItemSchema = z
  .object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    price: z.union([z.number(), z.string(), z.null()]).optional(),
    category: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update a menu item',
  })

interface RouteContext {
  params: { menuId: string; itemId: string }
}

async function ensureAccess(menuId: number, session: Awaited<ReturnType<typeof getServerSession>>) {
  const actor = buildActorFromSession(session as Parameters<typeof buildActorFromSession>[0])

  if (!actorHasMenuCapability(actor)) {
    return { error: NextResponse.json({ status: 'error', message: 'You do not have permission to manage menus' }, { status: 403 }) }
  }

  const menuRecord = await getMenuById({ id: menuId })

  if (!menuRecord) {
    return { error: NextResponse.json({ status: 'error', message: 'Menu not found' }, { status: 404 }) }
  }

  const restaurantId = Number(menuRecord.restaurant_id)
  const restaurantRecord = await getRestaurantById({ id: restaurantId }).catch((error) => {
    console.error('[api/menus/:menuId/items/:itemId] failed to load restaurant', error)
    return null
  })

  if (!restaurantRecord) {
    return { error: NextResponse.json({ status: 'error', message: 'Restaurant not found' }, { status: 404 }) }
  }

  if (!actorHasRestaurantAccess(actor, restaurantId, { ownerId: restaurantRecord.owner_id })) {
    return {
      error: NextResponse.json(
        { status: 'error', message: 'You are not assigned to the requested restaurant' },
        { status: 403 }
      ),
    }
  }

  return { restaurantId }
}

export async function PUT(request: Request, context: RouteContext) {
  const menuId = Number(context.params.menuId)
  const itemId = Number(context.params.itemId)

  if (!Number.isFinite(menuId) || menuId <= 0 || !Number.isFinite(itemId) || itemId <= 0) {
    return NextResponse.json({ status: 'error', message: 'Invalid menu or item id' }, { status: 400 })
  }

  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ status: 'error', message: 'Authentication required' }, { status: 401 })
  }

  const access = await ensureAccess(menuId, session)
  if ('error' in access) {
    return access.error
  }

  const json = await request.json().catch(() => null)
  const parsed = UpdateMenuItemSchema.safeParse(json)

  if (!parsed.success) {
    return NextResponse.json(
      { status: 'error', message: 'Invalid payload', errors: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    const updates = parsed.data
    const payload: Parameters<typeof updateMenuItem>[0] = {
      id: itemId,
    }

    if (updates.name !== undefined) payload.name = updates.name.trim()
    if (updates.description !== undefined) payload.description = updates.description?.trim()
    if (updates.category !== undefined) payload.category = updates.category?.trim()

    if (updates.price !== undefined) {
      const priceValue =
        updates.price === null || updates.price === ''
          ? undefined
          : Number(updates.price)
      payload.price = priceValue
    }

    const updated = await updateMenuItem(payload)

    return NextResponse.json(
      {
        status: 'success',
        data: updated,
      },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update menu item'
    console.error('[api/menus/:menuId/items/:itemId] update error', error)
    return NextResponse.json({ status: 'error', message }, { status: 500 })
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const menuId = Number(context.params.menuId)
  const itemId = Number(context.params.itemId)

  if (!Number.isFinite(menuId) || menuId <= 0 || !Number.isFinite(itemId) || itemId <= 0) {
    return NextResponse.json({ status: 'error', message: 'Invalid menu or item id' }, { status: 400 })
  }

  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ status: 'error', message: 'Authentication required' }, { status: 401 })
  }

  const access = await ensureAccess(menuId, session)
  if ('error' in access) {
    return access.error
  }

  try {
    // Ensure the item belongs to this menu
    const items = await getMenuItems({ menuId })
    const target = items.find((item) => Number(item.id) === itemId)
    if (!target) {
      return NextResponse.json({ status: 'error', message: 'Menu item not found' }, { status: 404 })
    }

    await deleteMenuItem({ id: itemId })
    return NextResponse.json({ status: 'success' }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete menu item'
    console.error('[api/menus/:menuId/items/:itemId] delete error', error)
    return NextResponse.json({ status: 'error', message }, { status: 500 })
  }
}
