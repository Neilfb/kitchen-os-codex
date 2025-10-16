import { z } from 'zod'

import { ncdbRequest, isNcdbSuccess, getNcdbErrorMessage } from './client'
import { ensureParseSuccess } from './constants'
import { RestaurantRecordSchema, type RestaurantRecord } from '@/types/ncdb/restaurant'

export interface GetRestaurantsOptions {
  ownerId?: string
  isActive?: boolean
  limit?: number
  offset?: number
}

const RestaurantsArraySchema = z.array(RestaurantRecordSchema)

export async function getRestaurants(options: GetRestaurantsOptions = {}): Promise<RestaurantRecord[]> {
  const payload: Record<string, unknown> = {}

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

  const { body } = await ncdbRequest<RestaurantRecord | RestaurantRecord[]>({
    endpoint: '/search/restaurants',
    payload,
    context: 'restaurant.list',
  })

  if (isNcdbSuccess(body) && body.data) {
    const records = Array.isArray(body.data) ? body.data : [body.data]
    return ensureParseSuccess(RestaurantsArraySchema, records, 'getRestaurants records')
  }

  if (isNcdbSuccess(body)) {
    return []
  }

  throw new Error(getNcdbErrorMessage(body) || 'Failed to fetch restaurants')
}
