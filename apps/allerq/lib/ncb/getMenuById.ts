import { ensureParseSuccess } from './constants'
import { ncdbRequest, isNcdbSuccess, getNcdbErrorMessage } from './client'
import { MenuRecordSchema, type MenuRecord } from '@/types/ncdb/menu'

export interface GetMenuByIdPayload {
  id: number
}

export async function getMenuById({ id }: GetMenuByIdPayload): Promise<MenuRecord | null> {
  const payload = { id }

  const { body } = await ncdbRequest<MenuRecord | MenuRecord[]>({
    endpoint: '/search/menus',
    payload,
    context: 'menu.getById',
  })

  if (isNcdbSuccess(body) && body.data) {
    const records = Array.isArray(body.data) ? body.data : [body.data]
    for (const record of records) {
      try {
        return ensureParseSuccess(MenuRecordSchema, record, 'getMenuById record')
      } catch (error) {
        console.warn('[getMenuById] record failed validation', error)
      }
    }

    throw new Error('NCDB returned malformed menu record')
  }

  if (isNcdbSuccess(body)) {
    return null
  }

  throw new Error(getNcdbErrorMessage(body) || 'Failed to fetch menu')
}
