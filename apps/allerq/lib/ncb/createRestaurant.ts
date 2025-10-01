import axios from 'axios'

import { NCDB_API_KEY, NCDB_SECRET_KEY, buildNcdbUrl, extractNcdbError } from './constants'
import { RestaurantRecordSchema, type RestaurantRecord } from '@/types/ncdb/restaurant'

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
  const name = payload.name?.trim()
  const ownerId = payload.owner_id?.trim()

  if (!name) {
    throw new Error('Restaurant name is required')
  }

  if (!ownerId) {
    throw new Error('Restaurant owner_id is required')
  }

  const body = {
    secret_key: NCDB_SECRET_KEY,
    name,
    description: payload.description ?? '',
    address: payload.address ?? '',
    phone: payload.phone ?? '',
    email: payload.email ?? '',
    website: payload.website ?? '',
    cuisine_type: payload.cuisine_type ?? '',
    owner_id: ownerId,
    logo: payload.logo ?? '',
    cover_image: payload.cover_image ?? '',
    is_active: 1,
    created_at: Date.now(),
    updated_at: Date.now(),
  }

  console.log('[createRestaurant] sending payload', {
    ...body,
    secret_key: '********',
  })

  try {
    const response = await axios({
      method: 'post',
      url: buildNcdbUrl('/create/restaurants'),
      headers: {
        Authorization: `Bearer ${NCDB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: body,
    })

    const status = response.data?.status
    const data = response.data?.data

    if (status === 'success' && data) {
      const parsed = RestaurantRecordSchema.safeParse(data)
      if (!parsed.success) {
        console.error('[createRestaurant] validation error', parsed.error.flatten())
        throw new Error('NCDB returned malformed restaurant record')
      }
      return parsed.data
    }

    throw new Error('Restaurant creation failed')
  } catch (error) {
    throw extractNcdbError(error)
  }
}
