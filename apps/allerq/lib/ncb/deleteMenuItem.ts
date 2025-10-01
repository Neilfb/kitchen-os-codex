import axios from 'axios'

import { NCDB_API_KEY, NCDB_SECRET_KEY, buildNcdbUrl, extractNcdbError } from './constants'
import type { IdPayload } from '@/types/ncdb/shared'

export interface DeleteMenuItemInput extends IdPayload {}

export async function deleteMenuItem({ id }: DeleteMenuItemInput): Promise<boolean> {
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('A valid menu item id is required to delete a menu item')
  }

  const payload = {
    secret_key: NCDB_SECRET_KEY,
    record_id: id,
  }

  console.log('[deleteMenuItem] sending payload', {
    ...payload,
    secret_key: '********',
  })

  try {
    const response = await axios({
      method: 'post',
      url: buildNcdbUrl('/delete/menu_items'),
      headers: {
        Authorization: `Bearer ${NCDB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: payload,
    })

    if (response.data?.status === 'success') {
      return true
    }

    console.error('[deleteMenuItem] unexpected response', response.data)
    throw new Error('Failed to delete menu item')
  } catch (error) {
    if (axios.isAxiosError?.(error) && error.response?.data) {
      console.error('[deleteMenuItem] NCDB error response', error.response.data)
    }
    throw extractNcdbError(error)
  }
}
