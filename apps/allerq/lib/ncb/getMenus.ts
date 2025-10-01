import axios from 'axios'
import { z } from 'zod'

import { NCDB_API_KEY, NCDB_SECRET_KEY, buildNcdbUrl, extractNcdbError } from './constants'
import { MenuRecordSchema, type MenuRecord } from '@/types/ncdb/menu'

export interface GetMenusOptions {
  restaurantId?: number
  isActive?: boolean
  limit?: number
  offset?: number
}

const MenuArraySchema = z.array(MenuRecordSchema)

export async function getMenus(options: GetMenusOptions = {}): Promise<MenuRecord[]> {
  const filters: Array<{ field: string; operator: string; value: string | number }> = []

  if (typeof options.restaurantId === 'number') {
    filters.push({ field: 'restaurant_id', operator: '=', value: options.restaurantId })
  }

  if (typeof options.isActive === 'boolean') {
    filters.push({ field: 'is_active', operator: '=', value: options.isActive ? 1 : 0 })
  }

  const payload: Record<string, unknown> = {
    secret_key: NCDB_SECRET_KEY,
  }

  if (filters.length > 0) {
    payload.filters = filters
  }

  if (typeof options.limit === 'number') {
    payload.limit = options.limit
  }

  if (typeof options.offset === 'number') {
    payload.offset = options.offset
  }

  console.log('[getMenus] request payload', {
    ...payload,
    secret_key: '********',
  })

  try {
    const response = await axios({
      method: 'post',
      url: buildNcdbUrl('/search/menus'),
      headers: {
        Authorization: `Bearer ${NCDB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: payload,
    })

    if (response.data?.status === 'success' && response.data?.data) {
      const records = Array.isArray(response.data.data) ? response.data.data : [response.data.data]
      const parsed = MenuArraySchema.safeParse(records)
      if (!parsed.success) {
        console.error('[getMenus] validation error', parsed.error.flatten())
        throw new Error('NCDB returned malformed menu records')
      }
      return parsed.data
    }

    if (response.data?.status === 'success') {
      return []
    }

    console.error('[getMenus] unexpected response', response.data)
    throw new Error('Failed to fetch menus')
  } catch (error) {
    if (axios.isAxiosError?.(error) && error.response?.data) {
      console.error('[getMenus] NCDB error response', error.response.data)
    }
    throw extractNcdbError(error)
  }
}
