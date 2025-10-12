import type { RestaurantRecord } from '@/types/ncdb/restaurant'
import type { SessionUser } from '@/types/user'

function normalize(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim().toLowerCase()
  }
  if (typeof value === 'number') {
    return value.toString().trim().toLowerCase()
  }
  return ''
}

export function scopeRestaurantsForUser(
  restaurants: RestaurantRecord[],
  user: SessionUser
): RestaurantRecord[] {
  if (user.role === 'superadmin') {
    return restaurants
  }

  const assignedIds = new Set(user.assignedRestaurants.map((value) => value.toString()))
  const normalizedId = normalize(user.id)
  const normalizedEmail = normalize(user.email)
  const normalizedNcdbId = user.ncdbUserId > 0 ? normalize(user.ncdbUserId) : ''

  return restaurants.filter((restaurant) => {
    const restaurantId = restaurant.id !== undefined && restaurant.id !== null ? restaurant.id.toString() : ''
    if (restaurantId && assignedIds.has(restaurantId)) {
      return true
    }

    if (restaurant.owner_id !== undefined && restaurant.owner_id !== null) {
      const owner = normalize(restaurant.owner_id)
      if (!owner) {
        return false
      }

      if (owner === normalizedId || owner === normalizedEmail || (normalizedNcdbId && owner === normalizedNcdbId)) {
        return true
      }
    }

    return false
  })
}
