import { z } from 'zod'

import { ncdbRequest, isNcdbSuccess, getNcdbErrorMessage } from './client'
import { ensureParseSuccess } from './constants'
import { MenuItemRecordSchema, type MenuItemRecord } from '@/types/ncdb/menu'
import type { IdPayload } from '@/types/ncdb/shared'

const MenuItemArraySchema = z.array(MenuItemRecordSchema)

const CreateMenuItemSchema = z.object({
  menu_id: z.union([z.number(), z.string()]).transform((value) => Number(value)),
  restaurant_id: z.union([z.number(), z.string()]).transform((value) => Number(value)),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z
    .union([z.number(), z.string(), z.null(), z.undefined()])
    .transform((value) => {
      if (value === null || value === undefined || value === '') {
        return undefined
      }
      return Number(value)
    })
    .optional(),
  category: z.string().optional(),
  allergens: z.string().optional(),
  dietary: z.string().optional(),
})

export type CreateMenuItemInput = z.infer<typeof CreateMenuItemSchema>

export async function createMenuItem(input: CreateMenuItemInput): Promise<MenuItemRecord> {
  const parsedInput = CreateMenuItemSchema.parse(input)

  const now = Date.now()

  const basePayload: Record<string, unknown> = {
    menu_id: parsedInput.menu_id,
    restaurant_id: parsedInput.restaurant_id,
    name: parsedInput.name,
    description: parsedInput.description ?? '',
    price: parsedInput.price,
    category: parsedInput.category ?? '',
    allergens: parsedInput.allergens ?? '',
    dietary: parsedInput.dietary ?? '',
    created_at: now,
    updated_at: now,
    is_active: 1,
  }

  const payload = Object.fromEntries(
    Object.entries(basePayload).filter(([, value]) => value !== undefined && value !== null && value !== '')
  )

  console.log('[createMenuItem] sending payload', payload)

  const { body } = await ncdbRequest<MenuItemRecord>({
    endpoint: ['/create/menu_items', '/create/menuItem'],
    payload,
    context: 'menuItem.create',
  })

  if (isNcdbSuccess(body) && body.data) {
    return ensureParseSuccess(MenuItemRecordSchema, body.data, 'createMenuItem response')
  }

  if (isNcdbSuccess(body)) {
    const idRaw = body.id ?? body.record_id
    const parsedId = typeof idRaw === 'string' ? Number(idRaw) : idRaw

    const menuItems = await getMenuItems({ menuId: parsedInput.menu_id })

    if (Number.isFinite(parsedId)) {
      const matchedById = menuItems.find((item) => Number(item.id) === Number(parsedId))
      if (matchedById) {
        return matchedById
      }
    }

    const matchedByNameAndTimestamp = menuItems.find((item) => {
      if (item.name !== parsedInput.name) return false
      const createdAt = Number(item.created_at)
      return Number.isFinite(createdAt) && Math.abs(createdAt - now) < 60_000
    })

    if (matchedByNameAndTimestamp) {
      return matchedByNameAndTimestamp
    }

    throw new Error('Menu item was created but could not be retrieved from NCDB')
  }

  throw new Error(getNcdbErrorMessage(body) || 'Failed to create menu item')
}

export interface GetMenuItemsOptions {
  menuId?: number
  restaurantId?: number
  isActive?: boolean
  limit?: number
  offset?: number
}

export async function getMenuItems(options: GetMenuItemsOptions = {}): Promise<MenuItemRecord[]> {
  const payload: Record<string, unknown> = {
  }

  if (typeof options.menuId === 'number') {
    payload.menu_id = options.menuId
  }

  if (typeof options.restaurantId === 'number') {
    payload.restaurant_id = options.restaurantId
  }

  if (typeof options.isActive === 'boolean') {
    payload.is_active = options.isActive ? 1 : 0
  }
  if (typeof options.limit === 'number') payload.limit = options.limit
  if (typeof options.offset === 'number') payload.offset = options.offset

  console.log('[getMenuItems] request payload', {
    ...payload,
  })

  const { body } = await ncdbRequest<MenuItemRecord | MenuItemRecord[]>({
    endpoint: '/search/menu_items',
    payload,
    context: 'menuItem.list',
  })

  if (isNcdbSuccess(body) && body.data) {
    const records = Array.isArray(body.data) ? body.data : [body.data]
    return ensureParseSuccess(MenuItemArraySchema, records, 'getMenuItems records')
  }

  if (isNcdbSuccess(body)) {
    return []
  }

  throw new Error(getNcdbErrorMessage(body) || 'Failed to fetch menu items')
}

const UpdateMenuItemSchema = z
  .object({
    menu_id: z.union([z.number(), z.string()]).transform((value) => Number(value)).optional(),
    restaurant_id: z.union([z.number(), z.string()]).transform((value) => Number(value)).optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    price: z.union([z.number(), z.string()]).transform((value) => Number(value)).optional(),
    category: z.string().optional(),
    allergens: z.string().optional(),
    dietary: z.string().optional(),
    is_active: z.union([z.boolean(), z.number()]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update a menu item',
  })

export type UpdateMenuItemInput = IdPayload & z.infer<typeof UpdateMenuItemSchema>

export async function updateMenuItem({ id, ...updates }: UpdateMenuItemInput): Promise<MenuItemRecord> {
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('A valid menu item id is required to update a menu item')
  }

  const parsedUpdates = UpdateMenuItemSchema.parse(updates)

  const payload: Record<string, unknown> = {
    record_id: id,
    updated_at: Date.now(),
    ...parsedUpdates,
  }

  if (payload.is_active !== undefined) {
    payload.is_active = payload.is_active ? 1 : 0
  }

  Object.keys(payload).forEach((key) => {
    const value = payload[key]
    if (value === undefined || value === null || value === '') {
      delete payload[key]
    }
  })

  console.log('[updateMenuItem] sending payload', {
    ...payload,
  })

  const { body } = await ncdbRequest<MenuItemRecord>({
    endpoint: '/update/menu_items',
    payload,
    context: 'menuItem.update',
  })

  if (isNcdbSuccess(body) && body.data) {
    return ensureParseSuccess(MenuItemRecordSchema, body.data, 'updateMenuItem response')
  }

  throw new Error(getNcdbErrorMessage(body) || 'Failed to update menu item')
}

export async function deleteMenuItem({ id }: IdPayload): Promise<boolean> {
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('A valid menu item id is required to delete a menu item')
  }

  const payload = {
    record_id: id,
  }

  console.log('[deleteMenuItem] sending payload', payload)

  const { body } = await ncdbRequest({
    endpoint: '/delete/menu_items',
    payload,
    context: 'menuItem.delete',
  })

  if (isNcdbSuccess(body)) {
    return true
  }

  throw new Error(getNcdbErrorMessage(body) || 'Failed to delete menu item')
}
