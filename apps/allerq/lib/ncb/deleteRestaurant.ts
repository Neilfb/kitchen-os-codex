import { ncdbRequest, isNcdbSuccess, getNcdbErrorMessage } from './client'

export interface DeleteRestaurantPayload {
  id: number
}

export async function deleteRestaurant({ id }: DeleteRestaurantPayload): Promise<boolean> {
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('A valid restaurant id is required to delete a restaurant')
  }

  console.log('[deleteRestaurant] sending request', { id })

  const { body } = await ncdbRequest({
    endpoint: `/delete/restaurants/${id}`,
    method: 'delete',
    includeSecretKey: false,
    payload: {},
    context: 'restaurant.delete',
  })

  if (isNcdbSuccess(body)) {
    return true
  }

  throw new Error(getNcdbErrorMessage(body) || 'Failed to delete restaurant')
}
