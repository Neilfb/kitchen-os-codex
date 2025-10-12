import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'

import { authOptions } from '@/lib/auth/nextAuth'
import { getMenuById } from '@/lib/ncb/getMenuById'
import { getMenuItems } from '@/lib/ncb/menuItem'
import { updateMenu, deleteMenu } from '@/lib/ncb/menu'
import { getRestaurantById } from '@/lib/ncb/getRestaurantById'
import { actorHasMenuCapability, actorHasRestaurantAccess, buildActorFromSession } from '@/lib/menus/access'

const UpdateMenuBodySchema = z
  .object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    menu_type: z.string().optional(),
    is_active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update a menu',
  })

interface RouteContext {
  params: { id: string }
}

async function loadMenuWithGuard(menuId: number, session: Awaited<ReturnType<typeof getServerSession>>) {
  const actor = buildActorFromSession(session as Parameters<typeof buildActorFromSession>[0])

  if (!actorHasMenuCapability(actor)) {
    return NextResponse.json({ status: 'error', message: 'You do not have permission to manage menus' }, { status: 403 })
  }

  const menuRecord = await getMenuById({ id: menuId })

  if (!menuRecord) {
    return NextResponse.json({ status: 'error', message: 'Menu not found' }, { status: 404 })
  }

  const restaurantId = Number(menuRecord.restaurant_id)
  const restaurantRecord = await getRestaurantById({ id: restaurantId }).catch((error) => {
    console.error('[api/menus/:id] failed to load restaurant', error)
    return null
  })

  if (!restaurantRecord) {
    return NextResponse.json({ status: 'error', message: 'Restaurant not found' }, { status: 404 })
  }

  if (!actorHasRestaurantAccess(actor, restaurantId, { ownerId: restaurantRecord.owner_id })) {
    return NextResponse.json({ status: 'error', message: 'You are not assigned to the requested restaurant' }, { status: 403 })
  }

  return { menuRecord, restaurantRecord, actor }
}

export async function GET(request: Request, context: RouteContext) {
  const menuId = Number(context.params.id)

  if (!Number.isFinite(menuId) || menuId <= 0) {
    return NextResponse.json({ status: 'error', message: 'Invalid menu id' }, { status: 400 })
  }

  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ status: 'error', message: 'Authentication required' }, { status: 401 })
  }

  const guard = await loadMenuWithGuard(menuId, session)
  if (guard instanceof NextResponse) {
    return guard
  }

  const menuItems = await getMenuItems({ menuId })

  return NextResponse.json(
    {
      status: 'success',
      data: {
        menu: guard.menuRecord,
        items: menuItems,
      },
    },
    { status: 200 }
  )
}

export async function PUT(request: Request, context: RouteContext) {
  const menuId = Number(context.params.id)

  if (!Number.isFinite(menuId) || menuId <= 0) {
    return NextResponse.json({ status: 'error', message: 'Invalid menu id' }, { status: 400 })
  }

  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ status: 'error', message: 'Authentication required' }, { status: 401 })
  }

  const guard = await loadMenuWithGuard(menuId, session)
  if (guard instanceof NextResponse) {
    return guard
  }

  const json = await request.json().catch(() => null)
  const parsed = UpdateMenuBodySchema.safeParse(json)

  if (!parsed.success) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Invalid payload',
        errors: parsed.error.flatten(),
      },
      { status: 400 }
    )
  }

  try {
    const updated = await updateMenu({
      id: menuId,
      ...parsed.data,
    })

    return NextResponse.json(
      {
        status: 'success',
        data: updated,
      },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update menu'
    console.error('[api/menus/:id] update error', error)
    return NextResponse.json({ status: 'error', message }, { status: 500 })
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const menuId = Number(context.params.id)

  if (!Number.isFinite(menuId) || menuId <= 0) {
    return NextResponse.json({ status: 'error', message: 'Invalid menu id' }, { status: 400 })
  }

  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ status: 'error', message: 'Authentication required' }, { status: 401 })
  }

  const guard = await loadMenuWithGuard(menuId, session)
  if (guard instanceof NextResponse) {
    return guard
  }

  try {
    await deleteMenu({ id: menuId })
    return NextResponse.json({ status: 'success' }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete menu'
    console.error('[api/menus/:id] delete error', error)
    return NextResponse.json({ status: 'error', message }, { status: 500 })
  }
}
