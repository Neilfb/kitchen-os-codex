import axios from 'axios'
import { z } from 'zod'

import { NCDB_API_KEY, NCDB_SECRET_KEY, buildNcdbUrl, ensureParseSuccess, extractNcdbError } from './constants'
import { RestaurantRecordSchema, type RestaurantRecord } from '@/types/ncdb/restaurant'

export interface GetRestaurantsOptions {
  ownerId?: string
  isActive?: boolean
  limit?: number
  offset?: number
}

const RestaurantsArraySchema = z.array(RestaurantRecordSchema)

export async function getRestaurants(options: GetRestaurantsOptions = {}): Promise<RestaurantRecord[]> {
  const payload: Record<string, unknown> = {
    secret_key: NCDB_SECRET_KEY,
  }

  if (typeof options.ownerId === 'string' && options.ownerId.trim()) {
    payload.owner_id = options.ownerId.trim()
  }

  if (typeof options.isActive === 'boolean') {
    payload.is_active = options.isActive ? 1 : 0
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
      return ensureParseSuccess(RestaurantsArraySchema, records, 'getRestaurants records')
    }

    if (response.data.status === 'success') {
      return []
    }

    console.error('[getRestaurants] unexpected response', response.data)
    throw new Error('Failed to fetch restaurants')
  } catch (error) {
    throw extractNcdbError(error)
  }
}
