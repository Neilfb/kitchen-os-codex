import axios from 'axios'

import { NCDB_API_KEY, buildNcdbUrl, ensureParseSuccess, extractNcdbError } from './constants'
import { RestaurantRecordSchema, type RestaurantRecord } from '@/types/ncdb/restaurant'
import { getRestaurantById } from './getRestaurantById'

export interface UpdateRestaurantInput {
  id: number
  name?: string
  description?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  cuisine_type?: string
  owner_id?: string
  logo?: string
  logo_url?: string
  cover_image?: string
  is_active?: boolean
}

export async function updateRestaurant({ id, ...updates }: UpdateRestaurantInput): Promise<RestaurantRecord> {
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('A valid restaurant id is required to update a restaurant')
  }

  const payload: Record<string, unknown> = {}

  if (typeof updates.name === 'string' && updates.name.trim()) payload.name = updates.name.trim()
  if (typeof updates.description === 'string') payload.description = updates.description
  if (typeof updates.address === 'string') payload.address = updates.address
  if (typeof updates.phone === 'string') payload.phone = updates.phone
  if (typeof updates.email === 'string') payload.email = updates.email
  if (typeof updates.website === 'string') payload.website = updates.website
  if (typeof updates.cuisine_type === 'string') payload.cuisine_type = updates.cuisine_type
  if (typeof updates.owner_id === 'string' && updates.owner_id.trim()) payload.owner_id = updates.owner_id.trim()
  if (typeof updates.logo === 'string') payload.logo = updates.logo
  if (typeof updates.logo_url === 'string') payload.logo_url = updates.logo_url
  if (typeof updates.cover_image === 'string') payload.cover_image = updates.cover_image
  if (typeof updates.is_active === 'boolean') payload.is_active = updates.is_active

  payload.updated_at = Date.now()

  const updatableKeys = Object.keys(payload).filter((key) => !['updated_at'].includes(key))

  if (updatableKeys.length === 0) {
    throw new Error('No updates supplied for restaurant record')
  }

  console.log('[updateRestaurant] sending payload', {
    ...payload,
  })

  try {
    const response = await axios({
      method: 'put',
      url: buildNcdbUrl(`/update/restaurants/${id}`),
      headers: {
        Authorization: `Bearer ${NCDB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: payload,
    })

    const status = response.data?.status
    const data = response.data?.data

    if (status === 'success') {
      if (data) {
        return ensureParseSuccess(RestaurantRecordSchema, data, 'updateRestaurant response')
      }

      const refreshed = await getRestaurantById({ id })
      if (refreshed) {
        return refreshed
      }
    }

    throw new Error('Failed to update restaurant')
  } catch (error) {
    throw extractNcdbError(error)
  }
}
