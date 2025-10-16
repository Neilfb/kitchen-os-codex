'use server'

import { ensureParseSuccess } from './constants'
import { ncdbRequest, isNcdbSuccess, getNcdbErrorMessage } from './client'
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
    email: normalizedEmail,
  }

  const { body } = await ncdbRequest<UserRecord | UserRecord[]>({
    endpoint: '/search/users',
    payload,
    context: 'user.getByEmail',
  })

  if (isNcdbSuccess(body) && body.data) {
    const records = Array.isArray(body.data) ? body.data : [body.data]

    for (const record of records) {
      try {
        return ensureParseSuccess(UserRecordSchema, record, 'getUserByEmail record')
      } catch (error) {
        console.warn('[getUserByEmail] record failed validation', error)
      }
    }

    throw new Error('NCDB returned malformed user record')
  }

  if (isNcdbSuccess(body)) {
    return null
  }

  throw new Error(getNcdbErrorMessage(body) || 'Failed to lookup user by email')
}
