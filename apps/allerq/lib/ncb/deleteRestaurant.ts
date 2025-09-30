import axios from 'axios'

import { NCDB_API_KEY, NCDB_SECRET_KEY, buildNcdbUrl, extractNcdbError, type NcdbResponse } from './constants'

export interface DeleteRestaurantPayload {
  id: number
}

export async function deleteRestaurant({ id }: DeleteRestaurantPayload): Promise<boolean> {
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('A valid restaurant id is required to delete a restaurant')
  }

  const payload = {
    secret_key: NCDB_SECRET_KEY,
    record_id: id,
  }

  console.log('[deleteRestaurant] sending payload', {
    ...payload,
    secret_key: '********',
  })

  try {
    const response = await axios<NcdbResponse<null>>({
      method: 'post',
      url: buildNcdbUrl('/delete/restaurants'),
      headers: {
        Authorization: `Bearer ${NCDB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: payload,
    })

    if (response.data.status === 'success') {
      return true
    }

    throw new Error('Failed to delete restaurant')
  } catch (error) {
    throw extractNcdbError(error)
  }
}
