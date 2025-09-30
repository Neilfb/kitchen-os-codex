import axios from 'axios'

import { NCDB_API_KEY, NCDB_SECRET_KEY, buildNcdbUrl, extractNcdbError, type NcdbResponse } from './constants'
import type { MenuRecord } from './types'

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
    const response = await axios<NcdbResponse<MenuRecord | MenuRecord[]>>({
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
      return records[0] ?? null
    }

    return null
  } catch (error) {
    throw extractNcdbError(error)
  }
}
