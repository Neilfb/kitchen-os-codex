import axios from 'axios'
import { z } from 'zod'

import {
  NCDB_API_KEY,
  NCDB_SECRET_KEY,
  buildNcdbUrl,
  ensureParseSuccess,
  extractNcdbError,
} from './constants'
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

export async function createMenu(input: CreateMenuInput): Promise<MenuRecord> {
  const parsedInput = CreateMenuSchema.parse(input)

  const now = Date.now()

  const basePayload: Record<string, unknown> = {
    secret_key: NCDB_SECRET_KEY,
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

  const endpoints = ['/create/menus', '/create/menu']
  let lastError: unknown = new Error('Failed to create menu')

  for (const endpoint of endpoints) {
    console.log('[createMenu] sending payload', {
      ...basePayload,
      secret_key: '********',
      _endpoint: endpoint,
    })

    try {
      const response = await axios({
        method: 'post',
        url: buildNcdbUrl(endpoint),
        headers: {
          Authorization: `Bearer ${NCDB_API_KEY}`,
          'Content-Type': 'application/json',
        },
        data: basePayload,
      })

      if (response.data?.status === 'success' && response.data?.data) {
        return ensureParseSuccess(MenuRecordSchema, response.data.data, 'createMenu response')
      }

      console.error('[createMenu] unexpected response', {
        endpoint,
        data: response.data,
      })

      lastError = new Error(
        typeof response.data?.message === 'string' ? response.data.message : 'Failed to create menu'
      )
    } catch (error) {
      if (axios.isAxiosError?.(error) && error.response?.data) {
        console.error('[createMenu] NCDB error response', {
          endpoint,
          data: error.response.data,
        })
      }
      lastError = error
    }
  }

  throw extractNcdbError(lastError)
}

export interface GetMenusOptions {
  restaurantId?: number
  isActive?: boolean
  limit?: number
  offset?: number
}

export async function getMenus(options: GetMenusOptions = {}): Promise<MenuRecord[]> {
  const payload: Record<string, unknown> = {
    secret_key: NCDB_SECRET_KEY,
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
    secret_key: '********',
  })

  try {
    const response = await axios({
      method: 'post',
      url: buildNcdbUrl('/search/menus'),
      headers: {
        Authorization: `Bearer ${NCDB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: payload,
    })

    if (response.data?.status === 'success' && response.data?.data) {
      const records = Array.isArray(response.data.data) ? response.data.data : [response.data.data]
      return ensureParseSuccess(MenuArraySchema, records, 'getMenus records')
    }

    if (response.data?.status === 'success') {
      return []
    }

    console.error('[getMenus] unexpected response', response.data)
    throw new Error('Failed to fetch menus')
  } catch (error) {
    if (axios.isAxiosError?.(error) && error.response?.data) {
      console.error('[getMenus] NCDB error response', error.response.data)
    }
    throw extractNcdbError(error)
  }
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
    secret_key: NCDB_SECRET_KEY,
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
    secret_key: '********',
  })

  try {
    const response = await axios({
      method: 'post',
      url: buildNcdbUrl('/update/menus'),
      headers: {
        Authorization: `Bearer ${NCDB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: payload,
    })

    if (response.data?.status === 'success' && response.data?.data) {
      return ensureParseSuccess(MenuRecordSchema, response.data.data, 'updateMenu response')
    }

    console.error('[updateMenu] unexpected response', response.data)
    throw new Error('Failed to update menu')
  } catch (error) {
    if (axios.isAxiosError?.(error) && error.response?.data) {
      console.error('[updateMenu] NCDB error response', error.response.data)
    }
    throw extractNcdbError(error)
  }
}

export async function deleteMenu({ id }: IdPayload): Promise<boolean> {
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('A valid menu id is required to delete a menu')
  }

  const payload = {
    secret_key: NCDB_SECRET_KEY,
    record_id: id,
  }

  console.log('[deleteMenu] sending payload', {
    ...payload,
    secret_key: '********',
  })

  try {
    const response = await axios({
      method: 'post',
      url: buildNcdbUrl('/delete/menus'),
      headers: {
        Authorization: `Bearer ${NCDB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: payload,
    })

    if (response.data?.status === 'success') {
      return true
    }

    console.error('[deleteMenu] unexpected response', response.data)
    throw new Error('Failed to delete menu')
  } catch (error) {
    if (axios.isAxiosError?.(error) && error.response?.data) {
      console.error('[deleteMenu] NCDB error response', error.response.data)
    }
    throw extractNcdbError(error)
  }
}
