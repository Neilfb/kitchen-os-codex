import axios from 'axios'

import {
  NCDB_API_KEY,
  NCDB_SECRET_KEY,
  buildNcdbUrl,
  extractNcdbError,
  type NcdbResponse,
} from './constants'
import type { RestaurantRecord } from './types'

export interface CreateRestaurantPayload {
  name: string
  description?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  cuisine_type?: string
  owner_id: string
  logo?: string
  cover_image?: string
}

export async function createRestaurant(payload: CreateRestaurantPayload): Promise<RestaurantRecord> {
  const body = {
    secret_key: NCDB_SECRET_KEY,
    name: payload.name,
    description: payload.description ?? '',
    address: payload.address ?? '',
    phone: payload.phone ?? '',
    email: payload.email ?? '',
    website: payload.website ?? '',
    cuisine_type: payload.cuisine_type ?? '',
    owner_id: payload.owner_id,
    logo: payload.logo ?? '',
    cover_image: payload.cover_image ?? '',
    is_active: 1,
    created_at: Date.now(),
    updated_at: Date.now(),
  }

  try {
    const response = await axios<NcdbResponse<RestaurantRecord>>({
      method: 'post',
      url: buildNcdbUrl('/create/restaurants'),
      headers: {
        Authorization: `Bearer ${NCDB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: body,
    })

    if (response.data.status === 'success' && response.data.data) {
      return response.data.data
    }

    throw new Error('Restaurant creation failed')
  } catch (error) {
    throw extractNcdbError(error)
  }
}
