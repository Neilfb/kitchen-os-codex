import { z } from 'zod'

import { ncdbRequest, isNcdbSuccess, type NcdbResponse } from './client'
import { ensureParseSuccess } from './constants'
import { getMenuById } from './getMenuById'
import { MenuRecordSchema, type MenuRecord } from '@/types/ncdb/menu'
import type { IdPayload } from '@/types/ncdb/shared'

const MenuArraySchema = z.array(MenuRecordSchema)

const CreateMenuSchema = z.object({
  name: z.string().min(1),
  restaurant_id: z.union([z.number(), z.string()]).transform((value) => Number(value)),
  description: z.string().optional(),
  menu_type: z.string().optional(),
  created_by: z.string().optional(),
})

export type CreateMenuInput = z.infer<typeof CreateMenuSchema>

function extractMessage(body: NcdbResponse): string | undefined {
  const messageCandidate = (body as { message?: unknown; error?: { message?: unknown } })
    .message
  if (typeof messageCandidate === 'string' && messageCandidate.trim()) {
    return messageCandidate.trim()
  }

  const errorMessage = (body as { error?: { message?: unknown } }).error?.message
  if (typeof errorMessage === 'string' && errorMessage.trim()) {
    return errorMessage.trim()
  }
  return undefined
}

export async function createMenu(input: CreateMenuInput): Promise<MenuRecord> {
  const parsedInput = CreateMenuSchema.parse(input)

  const now = Date.now()

  const basePayload: Record<string, unknown> = {
    name: parsedInput.name,
    restaurant_id: parsedInput.restaurant_id,
    description: parsedInput.description ?? '',
    menu_type: parsedInput.menu_type ?? '',
    created_by: parsedInput.created_by ?? '',
    created_at: now,
    updated_at: now,
    is_active: 1,
  }

  Object.keys(basePayload).forEach((key) => {
    const value = basePayload[key]
    if (value === undefined || value === null || value === '') {
      delete basePayload[key]
    }
  })

  console.log('[createMenu] sending payload', basePayload)

  const { body } = await ncdbRequest<MenuRecord>({
    endpoint: ['/create/menus', '/create/menu'],
    payload: basePayload,
    context: 'menu.create',
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

  throw new Error(extractMessage(body) || 'Failed to create menu')
}

export interface GetMenusOptions {
  restaurantId?: number
  isActive?: boolean
  limit?: number
  offset?: number
}

export async function getMenus(options: GetMenusOptions = {}): Promise<MenuRecord[]> {
  const payload: Record<string, unknown> = {
  }

  if (typeof options.restaurantId === 'number') {
    payload.restaurant_id = options.restaurantId
  }

  if (typeof options.isActive === 'boolean') {
    payload.is_active = options.isActive ? 1 : 0
  }
  if (typeof options.limit === 'number') payload.limit = options.limit
  if (typeof options.offset === 'number') payload.offset = options.offset

  console.log('[getMenus] request payload', {
    ...payload,
  })

  const { body } = await ncdbRequest<MenuRecord | MenuRecord[]>({
    endpoint: '/search/menus',
    payload,
    context: 'menu.list',
  })

  if (isNcdbSuccess(body) && body.data) {
    const records = Array.isArray(body.data) ? body.data : [body.data]
    return ensureParseSuccess(MenuArraySchema, records, 'getMenus records')
  }

  if (isNcdbSuccess(body)) {
    return []
  }

  throw new Error(extractMessage(body) || 'Failed to fetch menus')
}

const UpdateMenuSchema = z
  .object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    menu_type: z.string().optional(),
    created_by: z.string().optional(),
    restaurant_id: z.union([z.number(), z.string()]).transform((value) => Number(value)).optional(),
    is_active: z.union([z.boolean(), z.number()]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update a menu',
  })

export type UpdateMenuInput = IdPayload & z.infer<typeof UpdateMenuSchema>

export async function updateMenu({ id, ...updates }: UpdateMenuInput): Promise<MenuRecord> {
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('A valid menu id is required to update a menu')
  }

  const parsedUpdates = UpdateMenuSchema.parse(updates)

  const payload: Record<string, unknown> = {
    record_id: id,
    updated_at: Date.now(),
    ...parsedUpdates,
  }

  if (payload.is_active !== undefined) {
    payload.is_active = payload.is_active ? 1 : 0
  }

  Object.keys(payload).forEach((key) => {
    const value = payload[key]
    if (value === undefined || value === null || value === '') {
      delete payload[key]
    }
  })

  console.log('[updateMenu] sending payload', {
    ...payload,
  })

  const { body } = await ncdbRequest<MenuRecord>({
    endpoint: '/update/menus',
    payload,
    context: 'menu.update',
  })

  if (isNcdbSuccess(body) && body.data) {
    return ensureParseSuccess(MenuRecordSchema, body.data, 'updateMenu response')
  }

  throw new Error(extractMessage(body) || 'Failed to update menu')
}

export async function deleteMenu({ id }: IdPayload): Promise<boolean> {
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('A valid menu id is required to delete a menu')
  }

  const payload = {
    record_id: id,
  }

  console.log('[deleteMenu] sending payload', payload)

  const { body } = await ncdbRequest({
    endpoint: '/delete/menus',
    payload,
    context: 'menu.delete',
  })

  if (isNcdbSuccess(body)) {
    return true
  }

  throw new Error(extractMessage(body) || 'Failed to delete menu')
}
