'use server'

import axios from 'axios'

import { NCDB_API_KEY, NCDB_SECRET_KEY, buildNcdbUrl, extractNcdbError, type NcdbResponse } from './constants'
import type { UserRecord } from './types'

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
    filters: [
      {
        field: 'email',
        operator: '=',
        value: normalizedEmail,
      },
    ],
  }

  try {
    const response = await axios<NcdbResponse<UserRecord | UserRecord[]>>({
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
      return records[0] ?? null
    }

    return null
  } catch (error) {
    throw extractNcdbError(error)
  }
}
