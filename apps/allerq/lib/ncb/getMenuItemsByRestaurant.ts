import axios from 'axios'

import { NCDB_API_KEY, NCDB_SECRET_KEY, buildNcdbUrl, extractNcdbError } from './constants'
import { MenuItemRecordSchema, type MenuItemRecord } from '@/types/ncdb/menu'

export interface GetMenuItemsByRestaurantPayload {
  restaurantId: number
}

export async function getMenuItemsByRestaurant({
  restaurantId,
}: GetMenuItemsByRestaurantPayload): Promise<MenuItemRecord[]> {
  const payload = {
    secret_key: NCDB_SECRET_KEY,
    filters: [
      {
        field: 'restaurant_id',
        operator: '=',
        value: restaurantId,
      },
    ],
  }

  try {
    const response = await axios({
      method: 'post',
      url: buildNcdbUrl('/search/menu_items'),
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
          const parsed = MenuItemRecordSchema.safeParse(record)
          if (!parsed.success) {
            console.error('[getMenuItemsByRestaurant] validation error', parsed.error.flatten())
            return null
          }
          return parsed.data
        })
        .filter((record): record is MenuItemRecord => record !== null)
    }

    return []
  } catch (error) {
    throw extractNcdbError(error)
  }
}
