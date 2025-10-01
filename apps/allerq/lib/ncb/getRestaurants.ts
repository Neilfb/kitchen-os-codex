import axios from 'axios'

import { NCDB_API_KEY, NCDB_SECRET_KEY, buildNcdbUrl, extractNcdbError } from './constants'
import { RestaurantRecordSchema, type RestaurantRecord } from '@/types/ncdb/restaurant'

export interface GetRestaurantsOptions {
  ownerId?: string
  isActive?: boolean
  limit?: number
  offset?: number
}

export async function getRestaurants(options: GetRestaurantsOptions = {}): Promise<RestaurantRecord[]> {
  const filters = [] as Array<{ field: string; operator: string; value: string | number }>

  if (typeof options.ownerId === 'string' && options.ownerId.trim()) {
    filters.push({ field: 'owner_id', operator: '=', value: options.ownerId.trim() })
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

  try {
    const response = await axios({
      method: 'post',
      url: buildNcdbUrl('/search/restaurants'),
      headers: {
        Authorization: `Bearer ${NCDB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: payload,
    })

    if (response.data.status === 'success' && response.data.data) {
      const records = Array.isArray(response.data.data) ? response.data.data : [response.data.data]
      return records
        .map((record) => {
          const parsed = RestaurantRecordSchema.safeParse(record)
          if (!parsed.success) {
            console.error('[getRestaurants] validation error', parsed.error.flatten())
            return null
          }
          return parsed.data
        })
        .filter((record): record is RestaurantRecord => record !== null)
    }

    return []
  } catch (error) {
    throw extractNcdbError(error)
  }
}
