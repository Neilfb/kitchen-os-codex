import axios from 'axios'
import { z } from 'zod'

import { NCDB_API_KEY, NCDB_SECRET_KEY, buildNcdbUrl, extractNcdbError, type NcdbResponse } from './constants'
import { UserRecordSchema, type UserRecord } from '@/types/ncdb/user'

export interface GetUsersOptions {
  role?: string
  limit?: number
  offset?: number
}

const UsersArraySchema = z.array(UserRecordSchema)

export async function getUsers(options: GetUsersOptions = {}): Promise<UserRecord[]> {
  const filters = [] as Array<{ field: string; operator: string; value: string | number }>

  if (typeof options.role === 'string' && options.role.trim()) {
    filters.push({ field: 'role', operator: '=', value: options.role.trim().toLowerCase() })
  }

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

  console.log('[getUsers] request payload', {
    ...payload,
    secret_key: '********',
  })

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
      const parsed = UsersArraySchema.safeParse(records)
      if (!parsed.success) {
        console.error('[getUsers] validation error', parsed.error.flatten())
        throw new Error('Received malformed user records from NCDB')
      }
      return parsed.data
    }

    if (response.data.status === 'success') {
      return []
    }

    console.error('[getUsers] unexpected response', response.data)
    throw new Error('Failed to fetch users')
  } catch (error) {
    if (axios.isAxiosError?.(error) && error.response?.data) {
      console.error('[getUsers] NCDB error response', error.response.data)
    }
    throw extractNcdbError(error)
  }
}
