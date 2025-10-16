import { ncdbRequest, isNcdbSuccess, getNcdbErrorMessage } from './client'
import type { IdPayload } from '@/types/ncdb/shared'

export async function deleteUser({ id }: IdPayload): Promise<boolean> {
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('A valid user id is required to delete a user')
  }

  const payload = {
    record_id: id,
  }

  console.log('[deleteUser] sending payload', payload)

  const { body } = await ncdbRequest({
    endpoint: '/delete/users',
    payload,
    context: 'user.delete',
  })

  if (isNcdbSuccess(body)) {
    return true
  }

  throw new Error(getNcdbErrorMessage(body) || 'Failed to delete user')
}
