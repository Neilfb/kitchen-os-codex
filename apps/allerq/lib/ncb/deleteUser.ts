import axios from 'axios'

import { NCDB_API_KEY, NCDB_SECRET_KEY, buildNcdbUrl, extractNcdbError, type NcdbResponse } from './constants'

export interface DeleteUserPayload {
  id: number
}

export async function deleteUser({ id }: DeleteUserPayload): Promise<boolean> {
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('A valid user id is required to delete a user')
  }

  const payload = {
    secret_key: NCDB_SECRET_KEY,
    record_id: id,
  }

  console.log('[deleteUser] sending payload', {
    ...payload,
    secret_key: '********',
  })

  try {
    const response = await axios<NcdbResponse<null>>({
      method: 'post',
      url: buildNcdbUrl('/delete/users'),
      headers: {
        Authorization: `Bearer ${NCDB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: payload,
    })

    if (response.data.status === 'success') {
      return true
    }

    throw new Error('Failed to delete user')
  } catch (error) {
    throw extractNcdbError(error)
  }
}
