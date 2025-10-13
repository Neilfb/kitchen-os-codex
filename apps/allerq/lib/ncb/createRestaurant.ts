import { ncdbRequest, isNcdbSuccess } from './client'
import { getRestaurantById } from './getRestaurantById'
import { ensureParseSuccess } from './constants'
import { RestaurantRecordSchema, type RestaurantRecord } from '@/types/ncdb/restaurant'

export interface CreateRestaurantPayload {
  name: string
  description?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  cuisine_type?: string
  owner_id: string
  logo_url?: string
  cover_image?: string
}

export async function createRestaurant(payload: CreateRestaurantPayload): Promise<RestaurantRecord> {
  const name = payload.name?.trim()
  const ownerId = payload.owner_id?.trim()

  if (!name) {
    throw new Error('Restaurant name is required')
  }

  if (!ownerId) {
    throw new Error('Restaurant owner_id is required')
  }

  const now = Date.now()

  const body = {
    name,
    address: payload.address ?? '',
    phone: payload.phone ?? '',
    email: payload.email ?? '',
    website: payload.website ?? '',
    owner_id: ownerId,
    logo_url: payload.logo_url ?? '',
    created_at: now,
    updated_at: now,
  }

  console.log('[createRestaurant] sending payload', body)

  const { body: responseBody } = await ncdbRequest<RestaurantRecord>({
    endpoint: '/create/restaurants',
    payload: body,
    context: 'restaurant.create',
  })

  if (isNcdbSuccess(responseBody) && responseBody.data) {
    const restaurantRecord = ensureParseSuccess(
      RestaurantRecordSchema,
      responseBody.data,
      'createRestaurant response'
    )

    return restaurantRecord
  }

  if (isNcdbSuccess(responseBody)) {
    const idRaw = responseBody.id ?? responseBody.record_id
      const parsedId = typeof idRaw === 'string' ? Number(idRaw) : idRaw
      const restaurantId = Number.isFinite(parsedId) ? Number(parsedId) : null

      if (restaurantId !== null) {
        const record = await getRestaurantById({ id: restaurantId })
        if (record) {
          return record
        }

        console.warn('[createRestaurant] unable to fetch newly created restaurant', {
          restaurantId,
          response: responseBody,
        })

        const fallbackRecord = ensureParseSuccess(
          RestaurantRecordSchema,
          {
            id: restaurantId,
            name,
            description: '',
            address: payload.address ?? '',
            phone: payload.phone ?? '',
            email: payload.email ?? '',
            website: payload.website ?? '',
            cuisine_type: payload.cuisine_type ?? '',
            owner_id: ownerId,
            logo: '',
            cover_image: '',
            logo_url: payload.logo_url ?? '',
            region: '',
            location: '',
            is_active: true,
            created_at: body.created_at,
            updated_at: body.updated_at,
            external_id: '',
          },
          'createRestaurant fallback record'
        )

        return fallbackRecord
      }

      console.warn('[createRestaurant] success response missing record payload', responseBody)
      throw new Error('Restaurant created but record payload missing in NCDB response')
    }

  const message =
    typeof responseBody?.message === 'string' && responseBody.message.trim()
      ? responseBody.message.trim()
      : typeof responseBody?.error?.message === 'string' && responseBody.error.message.trim()
        ? responseBody.error.message.trim()
        : null

  console.error('[createRestaurant] unexpected response', {
    data: responseBody,
  })

  throw new Error(message || 'Restaurant creation failed')
}
