import { z } from 'zod'

import { ensureParseSuccess } from './constants'
import { ncdbRequest, isNcdbSuccess, getNcdbErrorMessage } from './client'
import { UserRecordSchema, type UserRecord } from '@/types/ncdb/user'

export interface GetUsersOptions {
  role?: string
  limit?: number
  offset?: number
}

const UsersArraySchema = z.array(UserRecordSchema)

export async function getUsers(options: GetUsersOptions = {}): Promise<UserRecord[]> {
  const payload: Record<string, unknown> = {}

  if (typeof options.role === 'string' && options.role.trim()) {
    payload.role = options.role.trim().toLowerCase()
  }

  if (typeof options.limit === 'number') {
    payload.limit = options.limit
  }

  if (typeof options.offset === 'number') {
    payload.offset = options.offset
  }

  console.log('[getUsers] request payload', payload)

  const { body } = await ncdbRequest<UserRecord | UserRecord[]>({
    endpoint: '/search/users',
    payload,
    context: 'user.list',
  })

  if (isNcdbSuccess(body) && body.data) {
    const records = Array.isArray(body.data) ? body.data : [body.data]
    return ensureParseSuccess(UsersArraySchema, records, 'getUsers records')
  }

  if (isNcdbSuccess(body)) {
    return []
  }

  throw new Error(getNcdbErrorMessage(body) || 'Failed to fetch users')
}
