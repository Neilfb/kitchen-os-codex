import axios from 'axios'

import { NCDB_API_KEY, NCDB_SECRET_KEY, buildNcdbUrl, extractNcdbError, type NcdbResponse } from './constants'
import type { MenuItemRecord } from './types'

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
    const response = await axios<NcdbResponse<MenuItemRecord | MenuItemRecord[]>>({
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
    }

    return []
  } catch (error) {
    throw extractNcdbError(error)
  }
}
