import { randomUUID } from 'crypto'
import type { z } from 'zod'

import { ncdbRequest, isNcdbSuccess } from './client'
import { getMenuById } from './getMenuById'
import { ensureParseSuccess } from './constants'
import { MenuRecordSchema, type MenuRecord } from '@/types/ncdb/menu'

function stripEmptyValues<T extends Record<string, unknown>>(payload: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0
      }
      return value !== undefined && value !== null && value !== ''
    })
  ) as Partial<T>
}

export default async function createMenu(payload: Partial<MenuRecord>): Promise<MenuRecord> {
  const now = Date.now()

  const basePayload: Partial<MenuRecord> = {
    ...payload,
    created_at: payload.created_at ?? now,
    updated_at: now,
    external_id: payload.external_id ?? randomUUID(),
    is_active: payload.is_active ?? 1,
  }

  const name = basePayload.name?.trim()
  if (!name) {
    throw new Error('Menu name is required')
  }

  if (typeof basePayload.restaurant_id !== 'number') {
    throw new Error('Menu restaurant_id is required')
  }

  type MenuRecordInput = z.input<typeof MenuRecordSchema>

  const candidate: MenuRecordInput = {
    id: basePayload.id ?? 0,
    name,
    restaurant_id: basePayload.restaurant_id,
    description: basePayload.description,
    created_by: basePayload.created_by,
    created_at: basePayload.created_at ?? now,
    updated_at: basePayload.updated_at ?? now,
    external_id: basePayload.external_id,
    menu_type: basePayload.menu_type,
    is_active: basePayload.is_active,
    ai_processed: basePayload.ai_processed,
    upload_file_name: basePayload.upload_file_name,
  }

  const { id: unusedId, ...menuRecord } = ensureParseSuccess(MenuRecordSchema, candidate, 'createMenu input')
  void unusedId

  const strippedPayload = stripEmptyValues(menuRecord as Record<string, unknown>)

  console.log('[DEBUG createMenu payload]', strippedPayload)

  const { body } = await ncdbRequest<MenuRecord>({
    endpoint: ['/create/menus', '/create/menu'],
    payload: strippedPayload,
    context: 'createMenu',
  })

  if (isNcdbSuccess(body) && body.data) {
    return ensureParseSuccess(MenuRecordSchema, body.data, 'createMenu response')
  }

  if (isNcdbSuccess(body)) {
    const idRaw = body.id ?? body.record_id
    const parsedId = typeof idRaw === 'string' ? Number(idRaw) : idRaw
    if (Number.isFinite(parsedId)) {
      const fetched = await getMenuById({ id: Number(parsedId) })
      if (fetched) {
        return fetched
      }
    }
  }

  throw new Error(body?.message || 'Failed to create menu')
}
