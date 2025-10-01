import axios from 'axios'
import { z } from 'zod'

import { NCDB_API_KEY, NCDB_SECRET_KEY, buildNcdbUrl, extractNcdbError } from './constants'
import { MenuItemRecordSchema, type MenuItemRecord } from '@/types/ncdb/menu'
import type { IdPayload } from '@/types/ncdb/shared'

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
      const parsed = MenuItemRecordSchema.safeParse(response.data.data)
      if (!parsed.success) {
        console.error('[updateMenuItem] NCDB response validation error', parsed.error.flatten())
        throw new Error('NCDB returned malformed menu item record')
      }
      return parsed.data
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
