import axios from 'axios'

import { NCDB_API_KEY, NCDB_SECRET_KEY, buildNcdbUrl, ensureParseSuccess, extractNcdbError } from './constants'
import { RestaurantRecordSchema, type RestaurantRecord } from '@/types/ncdb/restaurant'

export interface GetRestaurantByIdPayload {
  id: number
}

export async function getRestaurantById({ id }: GetRestaurantByIdPayload): Promise<RestaurantRecord | null> {
  const payload = {
    secret_key: NCDB_SECRET_KEY,
    id,
  }

  try {
    const response = await axios({
      method: 'post',
      url: buildNcdbUrl('/search/restaurants'),
      headers: {
        Authorization: `Bearer ${NCDB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: payload,
    })

    if (response.data.status === 'success' && response.data.data) {
      const records = Array.isArray(response.data.data) ? response.data.data : [response.data.data]
      for (const record of records) {
        try {
          return ensureParseSuccess(RestaurantRecordSchema, record, 'getRestaurantById record')
        } catch {
          continue
        }
      }

      throw new Error('NCDB returned malformed restaurant record')
    }

    return null
  } catch (error) {
    throw extractNcdbError(error)
  }
}
