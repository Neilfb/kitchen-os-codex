'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { z } from 'zod'

import { authOptions } from '@/lib/auth/nextAuth'
import { requireUser } from '@/lib/auth/guards'
import { userHasCapability } from '@/lib/auth/permissions'
import { createMenu } from '@/lib/ncb/menu'
import { createMenuItem } from '@/lib/ncb/menuItem'

const MenuItemInputSchema = z.object({
  name: z.string().min(1, 'Menu item name is required'),
  description: z.string().optional(),
  price: z.number().nonnegative().optional(),
  category: z.string().optional(),
})

const CreateMenuPayloadSchema = z.object({
  restaurantId: z.number().int().positive('Restaurant is required'),
  name: z.string().min(1, 'Menu name is required'),
  description: z.string().optional(),
  menuType: z.string().optional(),
  items: z.array(MenuItemInputSchema).default([]),
})

type CreateMenuPayload = z.infer<typeof CreateMenuPayloadSchema>

interface CreateMenuActionResult {
  status: 'success' | 'error'
  message?: string
  menuId?: number
}

export async function createMenuWithItemsAction(
  rawPayload: CreateMenuPayload
): Promise<CreateMenuActionResult> {
  const session = await getServerSession(authOptions)
  const user = requireUser(session)

  if (!userHasCapability(user, 'menu.manage')) {
    return {
      status: 'error',
      message: 'You do not have permission to create menus.',
    }
  }

  const parsed = CreateMenuPayloadSchema.safeParse(rawPayload)

  if (!parsed.success) {
    return {
      status: 'error',
      message: parsed.error.issues[0]?.message ?? 'Invalid menu details.',
    }
  }

  try {
    const menuRecord = await createMenu({
      name: parsed.data.name,
      description: parsed.data.description,
      menu_type: parsed.data.menuType,
      restaurant_id: parsed.data.restaurantId,
      created_by: user.email ?? undefined,
    })

    const menuId = Number(menuRecord.id)

    if (!Number.isFinite(menuId) || menuId <= 0) {
      throw new Error('NCDB did not return a valid menu id.')
    }

    if (parsed.data.items.length > 0) {
      await Promise.all(
        parsed.data.items.map((item) =>
          createMenuItem({
            menu_id: menuId,
            restaurant_id: parsed.data.restaurantId,
            name: item.name,
            description: item.description ?? '',
            price: item.price,
            category: item.category ?? '',
            allergens: '',
            dietary: '',
          })
        )
      )
    }

    revalidatePath('/menus')
    revalidatePath('/dashboard')

    return {
      status: 'success',
      menuId,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create menu.'
    console.error('[createMenuWithItemsAction] failed', error)
    return {
      status: 'error',
      message,
    }
  }
}
