import axios from 'axios'
import { z } from 'zod'

import { NCDB_API_KEY, NCDB_SECRET_KEY, buildNcdbUrl, extractNcdbError } from './constants'
import { MenuRecordSchema, type MenuRecord } from '@/types/ncdb/menu'

const CreateMenuSchema = z.object({
  name: z.string().min(1),
  restaurant_id: z.union([z.number(), z.string()]).transform((value) => Number(value)),
  description: z.string().optional(),
  menu_type: z.string().optional(),
  created_by: z.string().optional(),
})

export type CreateMenuInput = z.infer<typeof CreateMenuSchema>

export async function createMenu(input: CreateMenuInput): Promise<MenuRecord> {
  const parsedInput = CreateMenuSchema.parse(input)

  const now = Date.now()

  const payload: Record<string, unknown> = {
    secret_key: NCDB_SECRET_KEY,
    name: parsedInput.name,
    restaurant_id: parsedInput.restaurant_id,
    description: parsedInput.description ?? '',
    menu_type: parsedInput.menu_type ?? '',
    created_by: parsedInput.created_by ?? '',
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

  console.log('[createMenu] sending payload', {
    ...payload,
    secret_key: '********',
  })

  try {
    const response = await axios({
      method: 'post',
      url: buildNcdbUrl('/create/menus'),
      headers: {
        Authorization: `Bearer ${NCDB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: payload,
    })

    if (response.data?.status === 'success' && response.data?.data) {
      const parsed = MenuRecordSchema.safeParse(response.data.data)
      if (!parsed.success) {
        console.error('[createMenu] NCDB response validation error', parsed.error.flatten())
        throw new Error('NCDB returned malformed menu record')
      }
      return parsed.data
    }

    console.error('[createMenu] unexpected response', response.data)
    throw new Error('Failed to create menu')
  } catch (error) {
    if (axios.isAxiosError?.(error) && error.response?.data) {
      console.error('[createMenu] NCDB error response', error.response.data)
    }
    throw extractNcdbError(error)
  }
}
