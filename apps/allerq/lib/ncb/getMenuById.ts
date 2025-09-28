import axios from 'axios'

import { BASE_URL, INSTANCE, getNcdbCredentials } from './config'

export interface MenuRecord {
  id: number
  name: string
  description: string
  restaurant_id: number
  created_by: string
  created_at: number
  updated_at: number
  external_id: string
  menu_type: string
  is_active: number
  ai_processed: number
  upload_file_name: string
}

export interface GetMenuByIdPayload {
  id: number
}

export async function getMenuById({ id }: GetMenuByIdPayload): Promise<MenuRecord | null> {
  try {
    const { apiKey, secret } = getNcdbCredentials()

    const payload = {
      secret_key: secret,
      filters: [
        {
          field: 'id',
          operator: '=',
          value: id,
        },
      ],
    }

    const url = `${BASE_URL}/search/menus`

    console.log('[getMenuById] request', {
      url: `${url}?Instance=${INSTANCE}`,
      body: JSON.stringify({ ...payload, secret_key: '********' }),
      headers: { Authorization: 'Bearer ********' },
    })

    const response = await axios.post<{ status: string; data?: MenuRecord | MenuRecord[]; message?: string }>(
      `${url}?Instance=${INSTANCE}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (response.data.status === 'success' && response.data.data) {
      const records = Array.isArray(response.data.data) ? response.data.data : [response.data.data]
      return records[0] ?? null
    }

    return null
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[getMenuById] axios error', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      })
    } else {
      console.error('[getMenuById] unexpected error', error)
    }

    throw new Error('Unable to fetch menu')
  }
}
