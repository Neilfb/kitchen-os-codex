import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'

import { authOptions } from '@/lib/auth/nextAuth'
import { getMenuById } from '@/lib/ncb/getMenuById'
import { createMenuItem } from '@/lib/ncb/menuItem'
import { getRestaurantById } from '@/lib/ncb/getRestaurantById'
import { actorHasMenuCapability, actorHasRestaurantAccess, buildActorFromSession } from '@/lib/menus/access'
import { updateMenuUploadItem } from '@/lib/ncb/menuUploads'

const CreateMenuItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.union([z.number(), z.string()]).optional(),
  category: z.string().optional(),
  sourceUploadItemId: z
    .union([z.number(), z.string(), z.null(), z.undefined()])
    .transform((value) => {
      if (value === null || value === undefined) return undefined
      if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
      const trimmed = value.trim()
      if (!trimmed) return undefined
      const parsed = Number(trimmed)
      return Number.isFinite(parsed) ? parsed : undefined
    })
    .optional(),
})

interface RouteContext {
  params: { menuId: string }
}

export async function POST(request: Request, context: RouteContext) {
  const menuId = Number(context.params.menuId)

  if (!Number.isFinite(menuId) || menuId <= 0) {
    return NextResponse.json({ status: 'error', message: 'Invalid menu id' }, { status: 400 })
  }

  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ status: 'error', message: 'Authentication required' }, { status: 401 })
  }

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
    console.error('[api/menus/:menuId/items] failed to load restaurant', error)
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

  const json = await request.json().catch(() => null)
  const parsed = CreateMenuItemSchema.safeParse(json)

  if (!parsed.success) {
    return NextResponse.json(
      { status: 'error', message: 'Invalid payload', errors: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    const created = await createMenuItem({
      menu_id: menuId,
      restaurant_id: restaurantId,
      name: parsed.data.name.trim(),
      description: parsed.data.description?.trim(),
      price:
        parsed.data.price !== undefined && parsed.data.price !== null && String(parsed.data.price).trim() !== ''
          ? Number(parsed.data.price)
          : undefined,
      category: parsed.data.category?.trim(),
      allergens: '',
      dietary: '',
    })

    if (parsed.data.sourceUploadItemId) {
      try {
        await updateMenuUploadItem({
          id: parsed.data.sourceUploadItemId,
          status: 'completed',
          menu_id: menuId,
          restaurant_id: restaurantId,
        })
      } catch (linkError) {
        console.warn(
          '[api/menus/:menuId/items] failed to mark menu_upload_item as completed',
          linkError
        )
      }
    }

    return NextResponse.json(
      {
        status: 'success',
        data: created,
        linkedUploadItemId: parsed.data.sourceUploadItemId ?? null,
      },
      { status: 201 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create menu item'
    console.error('[api/menus/:menuId/items] create error', error)
    return NextResponse.json({ status: 'error', message }, { status: 500 })
  }
}
