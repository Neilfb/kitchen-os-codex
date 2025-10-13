import axios from 'axios'
import { z } from 'zod'

import {
  NCDB_API_KEY,
  NCDB_SECRET_KEY,
  buildNcdbUrl,
  ensureParseSuccess,
  extractNcdbError,
} from './constants'
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

  const payload: Record<string, unknown> = {
    secret_key: NCDB_SECRET_KEY,
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

  Object.keys(payload).forEach((key) => {
    const value = payload[key]
    if (value === undefined || value === null || value === '') {
      delete payload[key]
    }
  })

  console.log('[createMenuItem] sending payload', {
    ...payload,
    secret_key: '********',
  })

  try {
    const response = await axios({
      method: 'post',
      url: buildNcdbUrl('/create/menu_items'),
      headers: {
        Authorization: `Bearer ${NCDB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: payload,
    })

    if (response.data?.status === 'success' && response.data?.data) {
      return ensureParseSuccess(MenuItemRecordSchema, response.data.data, 'createMenuItem response')
    }

    console.error('[createMenuItem] unexpected response', response.data)
    throw new Error('Failed to create menu item')
  } catch (error) {
    if (axios.isAxiosError?.(error) && error.response?.data) {
      console.error('[createMenuItem] NCDB error response', error.response.data)
    }
    throw extractNcdbError(error)
  }
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
    secret_key: NCDB_SECRET_KEY,
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
    secret_key: '********',
  })

  try {
    const response = await axios({
      method: 'post',
      url: buildNcdbUrl('/search/menu_items'),
      headers: {
        Authorization: `Bearer ${NCDB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: payload,
    })

    if (response.data?.status === 'success' && response.data?.data) {
      const records = Array.isArray(response.data.data) ? response.data.data : [response.data.data]
      return ensureParseSuccess(MenuItemArraySchema, records, 'getMenuItems records')
    }

    if (response.data?.status === 'success') {
      return []
    }

    console.error('[getMenuItems] unexpected response', response.data)
    throw new Error('Failed to fetch menu items')
  } catch (error) {
    if (axios.isAxiosError?.(error) && error.response?.data) {
      console.error('[getMenuItems] NCDB error response', error.response.data)
    }
    throw extractNcdbError(error)
  }
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
    secret_key: NCDB_SECRET_KEY,
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
    secret_key: '********',
  })

  try {
    const response = await axios({
      method: 'post',
      url: buildNcdbUrl('/update/menu_items'),
      headers: {
        Authorization: `Bearer ${NCDB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: payload,
    })

    if (response.data?.status === 'success' && response.data?.data) {
      return ensureParseSuccess(MenuItemRecordSchema, response.data.data, 'updateMenuItem response')
    }

    console.error('[updateMenuItem] unexpected response', response.data)
    throw new Error('Failed to update menu item')
  } catch (error) {
    if (axios.isAxiosError?.(error) && error.response?.data) {
      console.error('[updateMenuItem] NCDB error response', error.response.data)
    }
    throw extractNcdbError(error)
  }
}

export async function deleteMenuItem({ id }: IdPayload): Promise<boolean> {
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('A valid menu item id is required to delete a menu item')
  }

  const payload = {
    secret_key: NCDB_SECRET_KEY,
    record_id: id,
  }

  console.log('[deleteMenuItem] sending payload', {
    ...payload,
    secret_key: '********',
  })

  try {
    const response = await axios({
      method: 'post',
      url: buildNcdbUrl('/delete/menu_items'),
      headers:
      {
        Authorization: `Bearer ${NCDB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: payload,
    })

    if (response.data?.status === 'success') {
      return true
    }

    console.error('[deleteMenuItem] unexpected response', response.data)
    throw new Error('Failed to delete menu item')
  } catch (error) {
    if (axios.isAxiosError?.(error) && error.response?.data) {
      console.error('[deleteMenuItem] NCDB error response', error.response.data)
    }
    throw extractNcdbError(error)
  }
}
