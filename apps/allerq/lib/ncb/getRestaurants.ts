import axios from 'axios'

import { NCDB_API_KEY, NCDB_SECRET_KEY, buildNcdbUrl, ensureParseSuccess, extractNcdbError } from './constants'
import { RestaurantRecordSchema, type RestaurantRecord } from '@/types/ncdb/restaurant'

export interface GetRestaurantsOptions {
  ownerId?: string
  isActive?: boolean
  limit?: number
  offset?: number
}

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
      return records
        .map((record) => {
          try {
            return ensureParseSuccess(RestaurantRecordSchema, record, 'getRestaurants record')
          } catch {
            return null
          }
        })
        .filter((record): record is RestaurantRecord => record !== null)
    }

    return []
  } catch (error) {
    throw extractNcdbError(error)
  }
}
