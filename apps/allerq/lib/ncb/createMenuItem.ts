import axios from 'axios'
import { z } from 'zod'

import { NCDB_API_KEY, NCDB_SECRET_KEY, buildNcdbUrl, extractNcdbError } from './constants'
import { MenuItemRecordSchema, type MenuItemRecord } from '@/types/ncdb/menu'

const CreateMenuItemSchema = z.object({
  menu_id: z.union([z.number(), z.string()]).transform((value) => Number(value)),
  restaurant_id: z.union([z.number(), z.string()]).transform((value) => Number(value)),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.union([z.number(), z.string()]).transform((value) => Number(value)),
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
      const parsed = MenuItemRecordSchema.safeParse(response.data.data)
      if (!parsed.success) {
        console.error('[createMenuItem] NCDB response validation error', parsed.error.flatten())
        throw new Error('NCDB returned malformed menu item record')
      }
      return parsed.data
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
