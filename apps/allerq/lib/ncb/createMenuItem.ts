import { randomUUID } from 'crypto'
import type { z } from 'zod'

import { ncdbRequest, isNcdbSuccess } from './client'
import { ensureParseSuccess } from './constants'
import { MenuItemRecordSchema, type MenuItemRecord } from '@/types/ncdb/menu'

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

export default async function createMenuItem(payload: Partial<MenuItemRecord>): Promise<MenuItemRecord> {
  const now = Date.now()

  const basePayload: Partial<MenuItemRecord> = {
    ...payload,
    created_at: payload.created_at ?? now,
    updated_at: now,
    external_id: payload.external_id ?? randomUUID(),
    is_active: payload.is_active ?? 1,
  }

  const name = basePayload.name?.trim()
  if (!name) {
    throw new Error('Menu item name is required')
  }

  if (typeof basePayload.menu_id !== 'number') {
    throw new Error('Menu item menu_id is required')
  }

  if (typeof basePayload.restaurant_id !== 'number') {
    throw new Error('Menu item restaurant_id is required')
  }

  if (typeof basePayload.price !== 'number') {
    throw new Error('Menu item price is required')
  }

  type MenuItemRecordInput = z.input<typeof MenuItemRecordSchema>

  const candidate: MenuItemRecordInput = {
    id: basePayload.id ?? 0,
    menu_id: basePayload.menu_id,
    restaurant_id: basePayload.restaurant_id,
    name,
    description: basePayload.description,
    price: basePayload.price,
    category: basePayload.category,
    allergens: basePayload.allergens,
    dietary: basePayload.dietary,
    created_at: basePayload.created_at ?? now,
    updated_at: basePayload.updated_at ?? now,
    external_id: basePayload.external_id,
    ai_confidence: basePayload.ai_confidence,
    manual_override: basePayload.manual_override,
    category_id: basePayload.category_id,
    is_active: basePayload.is_active,
    ai_processed: basePayload.ai_processed,
    ai_needs_review: basePayload.ai_needs_review,
  }

  const { id: unusedId, ...menuItemRecord } = ensureParseSuccess(
    MenuItemRecordSchema,
    candidate,
    'createMenuItem input'
  )
  void unusedId

  const strippedPayload = stripEmptyValues(menuItemRecord as Record<string, unknown>)

  console.log('[DEBUG createMenuItem payload]', strippedPayload)

  const { body } = await ncdbRequest<MenuItemRecord>({
    endpoint: ['/create/menu_items', '/create/menuItem'],
    payload: strippedPayload,
    context: 'menuItem.create',
  })

  if (isNcdbSuccess(body) && body.data) {
    return ensureParseSuccess(MenuItemRecordSchema, body.data, 'createMenuItem response')
  }

  const errorBody = body as { message?: unknown; error?: { message?: unknown } }
  const message =
    (typeof errorBody.message === 'string' && errorBody.message.trim()) ||
    (typeof errorBody.error?.message === 'string' && errorBody.error.message.trim()) ||
    null

  throw new Error(message || 'Failed to create menu item')
}
