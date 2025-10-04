import axios from 'axios'
import { randomUUID } from 'crypto'
import type { z } from 'zod'

import { NCDB_API_KEY, NCDB_SECRET_KEY, buildNcdbUrl, ensureParseSuccess, extractNcdbError } from './constants'
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

  const requestBody = {
    ...stripEmptyValues(menuRecord as Record<string, unknown>),
    secret_key: NCDB_SECRET_KEY,
  }

  console.log('[DEBUG createMenu payload]', {
    ...requestBody,
    secret_key: '********',
  })

  try {
    const response = await axios({
      method: 'post',
      url: buildNcdbUrl('/create/menu'),
      headers: {
        Authorization: `Bearer ${NCDB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: requestBody,
    })

    const { status, data } = response.data ?? {}

    if (status !== 'success' || !data) {
      console.error('[createMenu] unexpected response', response.data)
      throw new Error('Failed to create menu')
    }

    return ensureParseSuccess(MenuRecordSchema, data, 'createMenu response')
  } catch (error) {
    throw extractNcdbError(error)
  }
}
