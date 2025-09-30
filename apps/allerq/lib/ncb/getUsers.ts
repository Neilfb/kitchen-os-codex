import axios from 'axios'

import { NCDB_API_KEY, NCDB_SECRET_KEY, buildNcdbUrl, extractNcdbError, type NcdbResponse } from './constants'
import type { UserRecord } from './types'

export interface GetUsersOptions {
  role?: string
  limit?: number
  offset?: number
}

export async function getUsers(options: GetUsersOptions = {}): Promise<UserRecord[]> {
  const filters = options.role
    ? [
        {
          field: 'role',
          operator: '=',
          value: options.role,
        },
      ]
    : []

  const payload: Record<string, unknown> = {
    secret_key: NCDB_SECRET_KEY,
  }

  if (filters.length > 0) {
    payload.filters = filters
  }

  if (typeof options.limit === 'number') {
    payload.limit = options.limit
  }

  if (typeof options.offset === 'number') {
    payload.offset = options.offset
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
      return Array.isArray(response.data.data) ? response.data.data : [response.data.data]
    }

    return []
  } catch (error) {
    throw extractNcdbError(error)
  }
}
