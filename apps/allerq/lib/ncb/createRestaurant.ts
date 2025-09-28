import axios from 'axios'

import { BASE_URL, INSTANCE, getNcdbCredentials } from './config'
import type { RestaurantRecord } from './getRestaurantById'

export interface CreateRestaurantPayload {
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  cuisine_type?: string;
  owner_id: string;
  logo?: string;
  cover_image?: string;
}

export async function createRestaurant({
  name,
  description = '',
  address = '',
  phone = '',
  email = '',
  website = '',
  cuisine_type = '',
  owner_id,
  logo = '',
  cover_image = '',
}: CreateRestaurantPayload): Promise<RestaurantRecord> {
  try {
    const { apiKey, secret } = getNcdbCredentials()

    const timestamp = Date.now()

    const payload = {
      secret_key: secret,
      name,
      description,
      address,
      phone,
      email,
      website,
      cuisine_type,
      owner_id,
      logo,
      cover_image,
      is_active: 1,
      created_at: timestamp,
      updated_at: timestamp,
    }

    const url = `${BASE_URL}/create/restaurants`

    console.log('[createRestaurant] request', {
      url: `${url}?Instance=${INSTANCE}`,
      body: { ...payload, secret_key: '********' },
      headers: { Authorization: 'Bearer ********' },
    })

    const response = await axios.post(
      `${url}?Instance=${INSTANCE}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (response.data?.status === 'success') {
      return response.data.data as RestaurantRecord
    }

    throw new Error('Restaurant creation failed: Unexpected response format.')
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[createRestaurant] axios error', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      })
    } else {
      console.error('[createRestaurant] unexpected error', error)
    }

    throw new Error('Restaurant creation failed.')
  }
}
