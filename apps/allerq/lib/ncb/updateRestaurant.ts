import axios from 'axios'

import { NCDB_API_KEY, NCDB_SECRET_KEY, buildNcdbUrl, extractNcdbError, type NcdbResponse } from './constants'
import type { RestaurantRecord } from './types'

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
  cover_image?: string
  is_active?: boolean
}

export async function updateRestaurant({ id, ...updates }: UpdateRestaurantInput): Promise<RestaurantRecord> {
  const payload: Record<string, unknown> = {
    secret_key: NCDB_SECRET_KEY,
    record_id: id,
  }

  if (typeof updates.name === 'string') payload.name = updates.name
  if (typeof updates.description === 'string') payload.description = updates.description
  if (typeof updates.address === 'string') payload.address = updates.address
  if (typeof updates.phone === 'string') payload.phone = updates.phone
  if (typeof updates.email === 'string') payload.email = updates.email
  if (typeof updates.website === 'string') payload.website = updates.website
  if (typeof updates.cuisine_type === 'string') payload.cuisine_type = updates.cuisine_type
  if (typeof updates.owner_id === 'string') payload.owner_id = updates.owner_id
  if (typeof updates.logo === 'string') payload.logo = updates.logo
  if (typeof updates.cover_image === 'string') payload.cover_image = updates.cover_image
  if (typeof updates.is_active === 'boolean') payload.is_active = updates.is_active ? 1 : 0

  payload.updated_at = Date.now()

  try {
    const response = await axios<NcdbResponse<RestaurantRecord>>({
      method: 'post',
      url: buildNcdbUrl('/update/restaurants'),
      headers: {
        Authorization: `Bearer ${NCDB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: payload,
    })

    if (response.data.status === 'success' && response.data.data) {
      return response.data.data
    }

    throw new Error('Failed to update restaurant')
  } catch (error) {
    throw extractNcdbError(error)
  }
}
