import { ensureParseSuccess } from './constants'
import { ncdbRequest, isNcdbSuccess, getNcdbErrorMessage } from './client'
import { UserRecordSchema, type UserRecord } from '@/types/ncdb/user'

export interface GetUserByIdPayload {
  id: number
}

export async function getUserById({ id }: GetUserByIdPayload): Promise<UserRecord | null> {
  const payload = { id }

  const { body } = await ncdbRequest<UserRecord | UserRecord[]>({
    endpoint: '/search/users',
    payload,
    context: 'user.getById',
  })

  if (isNcdbSuccess(body) && body.data) {
    const records = Array.isArray(body.data) ? body.data : [body.data]
    for (const record of records) {
      try {
        return ensureParseSuccess(UserRecordSchema, record, 'getUserById record')
      } catch (error) {
        console.warn('[getUserById] record failed validation', error)
      }
    }

    throw new Error('NCDB returned malformed user record')
  }

  if (isNcdbSuccess(body)) {
    return null
  }

  throw new Error(getNcdbErrorMessage(body) || 'Failed to lookup user')
}
