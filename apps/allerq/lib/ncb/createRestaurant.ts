import axios from 'axios'

import { getRestaurantById } from './getRestaurantById'
import { NCDB_API_KEY, NCDB_SECRET_KEY, buildNcdbUrl, ensureParseSuccess, extractNcdbError } from './constants'
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

interface CreateRestaurantResponse {
  status?: string
  data?: unknown
  id?: number | string
  record_id?: number | string
  message?: string
  error?: {
    message?: string
  }
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
    secret_key: NCDB_SECRET_KEY,
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

  console.log('[createRestaurant] sending payload', {
    ...body,
    secret_key: '********',
  })

  try {
    const response = await axios<CreateRestaurantResponse>({
      method: 'post',
      url: buildNcdbUrl('/create/restaurants'),
      headers: {
        Authorization: `Bearer ${NCDB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: body,
    })

    const status = response.data?.status
    const data = response.data?.data

    if (status === 'success' && data) {
      const restaurantRecord = ensureParseSuccess(
        RestaurantRecordSchema,
        data,
        'createRestaurant response'
      )

      return restaurantRecord
    }

    if (status === 'success') {
      const idRaw = response.data?.id ?? response.data?.record_id
      const parsedId = typeof idRaw === 'string' ? Number(idRaw) : idRaw
      const restaurantId = Number.isFinite(parsedId) ? Number(parsedId) : null

      if (restaurantId !== null) {
        const record = await getRestaurantById({ id: restaurantId })
        if (record) {
          return record
        }

        console.warn('[createRestaurant] unable to fetch newly created restaurant', {
          restaurantId,
          response: response.data,
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

      console.warn('[createRestaurant] success response missing record payload', response.data)
      throw new Error('Restaurant created but record payload missing in NCDB response')
    }

    const message =
      typeof response.data?.message === 'string' && response.data.message.trim()
        ? response.data.message.trim()
        : typeof response.data?.error?.message === 'string' && response.data.error.message.trim()
          ? response.data.error.message.trim()
          : null

    console.error('[createRestaurant] unexpected response', {
      status,
      data: response.data,
    })

    throw new Error(message || 'Restaurant creation failed')
  } catch (error) {
    if (axios.isAxiosError?.(error) && error.response?.data) {
      console.error('[createRestaurant] NCDB error response', error.response.data)
    }
    throw extractNcdbError(error)
  }
}
