import axios from 'axios'

import { NCDB_API_KEY, buildNcdbUrl, extractNcdbError } from './constants'

export interface DeleteRestaurantPayload {
  id: number
}

export async function deleteRestaurant({ id }: DeleteRestaurantPayload): Promise<boolean> {
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('A valid restaurant id is required to delete a restaurant')
  }

  console.log('[deleteRestaurant] sending request', { id })

  try {
    const response = await axios({
      method: 'delete',
      url: buildNcdbUrl(`/delete/restaurants/${id}`),
      headers: {
        Authorization: `Bearer ${NCDB_API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.data?.status === 'success') {
      return true
    }

    console.error('[deleteRestaurant] unexpected response', response.data)
    throw new Error('Failed to delete restaurant')
  } catch (error) {
    if (axios.isAxiosError?.(error) && error.response?.data) {
      console.error('[deleteRestaurant] NCDB error response', error.response.data)
    }
    throw extractNcdbError(error)
  }
}
