import { ncdbRequest, isNcdbSuccess, getNcdbErrorMessage } from './client'
import { ensureParseSuccess } from './constants'
import { RestaurantRecordSchema, type RestaurantRecord } from '@/types/ncdb/restaurant'

export interface GetRestaurantByIdPayload {
  id: number
}

export async function getRestaurantById({ id }: GetRestaurantByIdPayload): Promise<RestaurantRecord | null> {
  const payload = { id }

  const { body } = await ncdbRequest<RestaurantRecord | RestaurantRecord[]>({
    endpoint: '/search/restaurants',
    payload,
    context: 'restaurant.getById',
  })

  if (isNcdbSuccess(body) && body.data) {
    const records = Array.isArray(body.data) ? body.data : [body.data]
    for (const record of records) {
      try {
        return ensureParseSuccess(RestaurantRecordSchema, record, 'getRestaurantById record')
      } catch (error) {
        console.warn('[getRestaurantById] skipping malformed record', { record, error })
      }
    }

    throw new Error('NCDB returned malformed restaurant record')
  }

  if (isNcdbSuccess(body)) {
    return null
  }

  throw new Error(getNcdbErrorMessage(body) || 'Failed to fetch restaurant')
}
