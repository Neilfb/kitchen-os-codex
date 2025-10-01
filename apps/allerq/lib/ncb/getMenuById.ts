import axios from 'axios'

import { NCDB_API_KEY, NCDB_SECRET_KEY, buildNcdbUrl, extractNcdbError } from './constants'
import { MenuRecordSchema, type MenuRecord } from '@/types/ncdb/menu'

export interface GetMenuByIdPayload {
  id: number
}

export async function getMenuById({ id }: GetMenuByIdPayload): Promise<MenuRecord | null> {
  const payload = {
    secret_key: NCDB_SECRET_KEY,
    filters: [
      {
        field: 'id',
        operator: '=',
        value: id,
      },
    ],
  }

  try {
    const response = await axios({
      method: 'post',
      url: buildNcdbUrl('/search/menus'),
      headers: {
        Authorization: `Bearer ${NCDB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: payload,
    })

    if (response.data.status === 'success' && response.data.data) {
      const records = Array.isArray(response.data.data) ? response.data.data : [response.data.data]
      for (const record of records) {
        const parsed = MenuRecordSchema.safeParse(record)
        if (parsed.success) {
          return parsed.data
        }
        console.error('[getMenuById] validation error', parsed.error.flatten())
      }

      throw new Error('NCDB returned malformed menu record')
    }

    return null
  } catch (error) {
    throw extractNcdbError(error)
  }
}
