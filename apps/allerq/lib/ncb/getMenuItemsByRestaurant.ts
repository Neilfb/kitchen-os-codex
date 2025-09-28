import axios from 'axios'

import { BASE_URL, INSTANCE, getNcdbCredentials } from './config'

export interface MenuItemRecord {
  id: number
  menu_id: number
  restaurant_id: number
  name: string
  description: string
  price: number
  category: string
  allergens: string
  dietary: string
  created_at: number
  updated_at: number
  external_id: string
  ai_confidence: number
  manual_override: number
  category_id: number
  is_active: number
  ai_processed: number
  ai_needs_review: number
}

export interface GetMenuItemsByRestaurantPayload {
  restaurantId: number
}

export async function getMenuItemsByRestaurant({
  restaurantId,
}: GetMenuItemsByRestaurantPayload): Promise<MenuItemRecord[]> {
  try {
    const { apiKey, secret } = getNcdbCredentials()

    const payload = {
      secret_key: secret,
      filters: [
        {
          field: 'restaurant_id',
          operator: '=',
          value: restaurantId,
        },
      ],
    }

    const url = `${BASE_URL}/search/menu_items`

    console.log('[getMenuItemsByRestaurant] request', {
      url: `${url}?Instance=${INSTANCE}`,
      body: JSON.stringify({ ...payload, secret_key: '********' }),
      headers: { Authorization: 'Bearer ********' },
    })

    const response = await axios.post<{ status: string; data?: MenuItemRecord[] | MenuItemRecord; message?: string }>(
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
      return records
    }

    return []
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[getMenuItemsByRestaurant] axios error', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      })
    } else {
      console.error('[getMenuItemsByRestaurant] unexpected error', error)
    }

    throw new Error('Unable to fetch menu items')
  }
}
