import axios from 'axios'

import { NCDB_API_KEY, NCDB_SECRET_KEY, buildNcdbUrl, ensureParseSuccess, extractNcdbError } from './constants'
import { UserRecordSchema, type UserRecord } from '@/types/ncdb/user'

export interface GetUserByIdPayload {
  id: number
}

export async function getUserById({ id }: GetUserByIdPayload): Promise<UserRecord | null> {
  const payload = {
    secret_key: NCDB_SECRET_KEY,
    id,
  }

  try {
    const response = await axios({
      method: 'post',
      url: buildNcdbUrl('/search/users'),
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
          return ensureParseSuccess(UserRecordSchema, record, 'getUserById record')
        } catch {
          continue
        }
      }

      throw new Error('NCDB returned malformed user record')
    }

    return null
  } catch (error) {
    throw extractNcdbError(error)
  }
}
