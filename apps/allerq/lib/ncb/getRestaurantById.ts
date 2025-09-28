import axios from 'axios'

import { BASE_URL, INSTANCE, getNcdbCredentials } from './config'

export interface RestaurantRecord {
  id: number
  name: string
  description: string
  address: string
  phone: string
  email: string
  website: string
  cuisine_type: string
  owner_id: string
  logo: string
  cover_image: string
  is_active: number
  created_at: number
  updated_at: number
}

export interface GetRestaurantByIdPayload {
  id: number
}

export async function getRestaurantById({ id }: GetRestaurantByIdPayload): Promise<RestaurantRecord | null> {
  try {
    const { apiKey, secret } = getNcdbCredentials()

    const payload = {
      secret_key: secret,
      filters: [
        {
          field: 'id',
          operator: '=',
          value: id,
        },
      ],
    }

    const url = `${BASE_URL}/search/restaurants`

    console.log('[getRestaurantById] request', {
      url: `${url}?Instance=${INSTANCE}`,
      body: JSON.stringify({ ...payload, secret_key: '********' }),
      headers: { Authorization: 'Bearer ********' },
    })

    const response = await axios.post<{ status: string; data?: RestaurantRecord | RestaurantRecord[]; message?: string }>(
      `${url}?Instance=${INSTANCE}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (response.data.status === 'success' && response.data.data) {
      const records = Array.isArray(response.data.data) ? response.data.data : [response.data.data]
      return records[0] ?? null
    }

    return null
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[getRestaurantById] axios error', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      })
    } else {
      console.error('[getRestaurantById] unexpected error', error)
    }

    throw new Error('Unable to fetch restaurant')
  }
}
