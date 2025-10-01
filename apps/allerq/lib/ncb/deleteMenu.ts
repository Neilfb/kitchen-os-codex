import axios from 'axios'

import { NCDB_API_KEY, NCDB_SECRET_KEY, buildNcdbUrl, extractNcdbError } from './constants'
import type { IdPayload } from '@/types/ncdb/shared'

export interface DeleteMenuInput extends IdPayload {}

export async function deleteMenu({ id }: DeleteMenuInput): Promise<boolean> {
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('A valid menu id is required to delete a menu')
  }

  const payload = {
    secret_key: NCDB_SECRET_KEY,
    record_id: id,
  }

  console.log('[deleteMenu] sending payload', {
    ...payload,
    secret_key: '********',
  })

  try {
    const response = await axios({
      method: 'post',
      url: buildNcdbUrl('/delete/menus'),
      headers: {
        Authorization: `Bearer ${NCDB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: payload,
    })

    if (response.data?.status === 'success') {
      return true
    }

    console.error('[deleteMenu] unexpected response', response.data)
    throw new Error('Failed to delete menu')
  } catch (error) {
    if (axios.isAxiosError?.(error) && error.response?.data) {
      console.error('[deleteMenu] NCDB error response', error.response.data)
    }
    throw extractNcdbError(error)
  }
}
