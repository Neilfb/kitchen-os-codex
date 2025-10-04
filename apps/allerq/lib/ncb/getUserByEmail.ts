'use server'

import axios from 'axios'

import { NCDB_API_KEY, NCDB_SECRET_KEY, buildNcdbUrl, ensureParseSuccess, extractNcdbError } from './constants'
import { UserRecordSchema, type UserRecord } from '@/types/ncdb/user'

export interface GetUserByEmailPayload {
  email: string
}

export async function getUserByEmail({ email }: GetUserByEmailPayload): Promise<UserRecord | null> {
  if (!email.trim()) {
    throw new Error('Invalid input: email required')
  }

  const normalizedEmail = email.trim().toLowerCase()
  const payload = {
    secret_key: NCDB_SECRET_KEY,
    email: normalizedEmail,
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
          return ensureParseSuccess(UserRecordSchema, record, 'getUserByEmail record')
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
