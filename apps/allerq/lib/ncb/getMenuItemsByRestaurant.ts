import type { MenuItemRecord } from '@/types/ncdb/menu'

import { getMenuItems } from './menuItem'

export interface GetMenuItemsByRestaurantPayload {
  restaurantId: number
}

export async function getMenuItemsByRestaurant({
  restaurantId,
}: GetMenuItemsByRestaurantPayload): Promise<MenuItemRecord[]> {
  return getMenuItems({ restaurantId })
}
