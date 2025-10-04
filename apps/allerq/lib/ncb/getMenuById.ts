import axios from 'axios'

import { NCDB_API_KEY, NCDB_SECRET_KEY, buildNcdbUrl, ensureParseSuccess, extractNcdbError } from './constants'
import { MenuRecordSchema, type MenuRecord } from '@/types/ncdb/menu'

export interface GetMenuByIdPayload {
  id: number
}

export async function getMenuById({ id }: GetMenuByIdPayload): Promise<MenuRecord | null> {
  const payload = {
    secret_key: NCDB_SECRET_KEY,
    id,
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
        try {
          return ensureParseSuccess(MenuRecordSchema, record, 'getMenuById record')
        } catch {
          continue
        }
      }

      throw new Error('NCDB returned malformed menu record')
    }

    return null
  } catch (error) {
    throw extractNcdbError(error)
  }
}
