import axios from 'axios'
import { z } from 'zod'

import { NCDB_API_KEY, NCDB_SECRET_KEY, buildNcdbUrl, extractNcdbError } from './constants'
import { MenuRecordSchema, type MenuRecord } from '@/types/ncdb/menu'
import type { IdPayload } from '@/types/ncdb/shared'

const UpdateMenuSchema = z
  .object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    menu_type: z.string().optional(),
    created_by: z.string().optional(),
    restaurant_id: z
      .union([z.number(), z.string()])
      .transform((value) => Number(value))
      .optional(),
    is_active: z.union([z.boolean(), z.number()]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update a menu',
  })

export type UpdateMenuInput = IdPayload & z.infer<typeof UpdateMenuSchema>

export async function updateMenu({ id, ...updates }: UpdateMenuInput): Promise<MenuRecord> {
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('A valid menu id is required to update a menu')
  }

  const parsedUpdates = UpdateMenuSchema.parse(updates)

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

  const maskedPayload = {
    ...payload,
    secret_key: '********',
  }

  console.log('[updateMenu] sending payload', maskedPayload)

  try {
    const response = await axios({
      method: 'post',
      url: buildNcdbUrl('/update/menus'),
      headers: {
        Authorization: `Bearer ${NCDB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: payload,
    })

    if (response.data?.status === 'success' && response.data?.data) {
      const parsed = MenuRecordSchema.safeParse(response.data.data)
      if (!parsed.success) {
        console.error('[updateMenu] NCDB response validation error', parsed.error.flatten())
        throw new Error('NCDB returned malformed menu record')
      }
      return parsed.data
    }

    console.error('[updateMenu] unexpected response', response.data)
    throw new Error('Failed to update menu')
  } catch (error) {
    if (axios.isAxiosError?.(error) && error.response?.data) {
      console.error('[updateMenu] NCDB error response', error.response.data)
    }
    throw extractNcdbError(error)
  }
}
