import axios from 'axios'
import { z } from 'zod'

import { ensureParseSuccess } from './constants'
import { ncdbRequest, isNcdbSuccess, getNcdbErrorMessage } from './client'
import {
  MenuUploadItemRecordSchema,
  MenuUploadItemStatusSchema,
  MenuUploadRecordSchema,
  MenuUploadStatusSchema,
  type MenuUploadItemRecord,
  type MenuUploadItemStatus,
  type MenuUploadRecord,
  type MenuUploadStatus,
} from '@/types/ncdb/menuUpload'
import { IdentifiedTagSchema } from '@/types/ncdb/menu'

let supportsRestaurantIdColumn = true
let supportsMenuIdColumn = true

function resolveAxiosError(error: unknown): import('axios').AxiosError | undefined {
  if (axios.isAxiosError?.(error)) {
    return error
  }

  if (error && typeof error === 'object' && 'cause' in error) {
    return resolveAxiosError((error as { cause?: unknown }).cause)
  }

  return undefined
}

function isUnknownColumnError(error: unknown, column: string) {
  const axiosError = resolveAxiosError(error)
  if (!axiosError) {
    return false
  }

  const payload = axiosError.response?.data as { error?: unknown; message?: unknown } | undefined
  if (!payload) {
    return false
  }

  const message =
    (typeof payload?.error === 'string' && payload.error.trim() ? payload.error : undefined) ??
    (typeof payload?.message === 'string' && payload.message.trim() ? payload.message : undefined)
  return typeof message === 'string' && message.includes(`Unknown column '${column}'`)
}

function appendMetadata(
  baseMetadata: Record<string, unknown> | undefined,
  overrides: Record<string, unknown>
): Record<string, unknown> {
  return {
    ...(baseMetadata ?? {}),
    ...overrides,
  }
}

const MenuUploadArraySchema = z.array(MenuUploadRecordSchema)
const MenuUploadItemArraySchema = z.array(MenuUploadItemRecordSchema)

function getNumericMetadataValue(metadata: Record<string, unknown> | undefined, key: string): number | undefined {
  const value = metadata?.[key]
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.trim())
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }
  return undefined
}

function coerceNumber(
  value: unknown,
  field: string,
  { optional = false }: { optional?: boolean } = {}
): number | undefined {
  if (value === undefined || value === null || value === '') {
    if (optional) {
      return undefined
    }
    throw new Error(`${field} is required`)
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error(`${field} must be a finite number`)
    }
    return value
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) {
      if (optional) {
        return undefined
      }
      throw new Error(`${field} is required`)
    }
    const parsed = Number(trimmed)
    if (!Number.isFinite(parsed)) {
      throw new Error(`${field} must be a finite number`)
    }
    return parsed
  }

  throw new Error(`${field} must be a number`)
}

const CreateMenuUploadSchema = z.object({
  restaurant_id: z
    .union([z.number(), z.string()])
    .transform((value) => coerceNumber(value, 'restaurant_id')!),
  menu_id: z
    .union([z.number(), z.string(), z.null(), z.undefined()])
    .transform((value) => coerceNumber(value, 'menu_id', { optional: true }))
    .optional(),
  file_url: z.string().url(),
  file_name: z.string(),
  file_size: z
    .union([z.number(), z.string()])
    .transform((value) => coerceNumber(value, 'file_size')!),
  resource_type: z.string().default('raw'),
  status: MenuUploadStatusSchema.default('pending'),
  parser_version: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export type CreateMenuUploadInput = z.infer<typeof CreateMenuUploadSchema>

const CreateMenuUploadItemSchema = z
  .object({
    upload_id: z
      .union([z.number(), z.string()])
      .transform((value) => coerceNumber(value, 'upload_id')!),
    restaurant_id: z
      .union([z.number(), z.string(), z.null(), z.undefined()])
      .transform((value) => coerceNumber(value, 'restaurant_id', { optional: true }))
      .optional(),
    menu_id: z
      .union([z.number(), z.string(), z.null(), z.undefined()])
      .transform((value) => coerceNumber(value, 'menu_id', { optional: true }))
      .optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    price: z
      .union([z.number(), z.string(), z.null(), z.undefined()])
      .transform((value) => {
        if (value === null || value === undefined || value === '') return undefined
        const numeric = Number(value)
        return Number.isFinite(numeric) ? numeric : undefined
      })
      .optional(),
    raw_text: z.string().optional(),
    status: z.union([MenuUploadItemStatusSchema, z.string()]).optional(),
    confidence: z
      .union([z.number(), z.string(), z.null(), z.undefined()])
      .transform((value) => {
        if (value === null || value === undefined || value === '') return undefined
        const numeric = Number(value)
        return Number.isFinite(numeric) ? numeric : undefined
      })
      .optional(),
    suggested_category: z.string().optional(),
    suggested_allergens: z.array(IdentifiedTagSchema).optional(),
    suggested_dietary: z.array(IdentifiedTagSchema).optional(),
    ai_payload: z.record(z.string(), z.unknown()).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .refine(
    (data) => {
      return Boolean(data.name?.trim() || data.description?.trim() || data.raw_text?.trim())
    },
    { message: 'Menu upload item requires at least a name, description, or raw_text' }
  )

export type CreateMenuUploadItemInput = z.infer<typeof CreateMenuUploadItemSchema>

export async function createMenuUpload(input: CreateMenuUploadInput): Promise<MenuUploadRecord> {
  const parsed = CreateMenuUploadSchema.parse(input)
  const timestamp = Date.now()

  const metadata = appendMetadata(parsed.metadata, {
    restaurantId: parsed.restaurant_id,
    menuId: parsed.menu_id,
  })

  const payload: Record<string, unknown> = {
    file_url: parsed.file_url,
    file_name: parsed.file_name,
    file_size: parsed.file_size,
    resource_type: parsed.resource_type,
    status: parsed.status,
    parser_version: parsed.parser_version,
    created_at: timestamp,
    updated_at: timestamp,
    metadata: JSON.stringify(metadata),
  }

  if (supportsRestaurantIdColumn) {
    payload.restaurant_id = parsed.restaurant_id
  }
  if (supportsMenuIdColumn && parsed.menu_id !== undefined) {
    payload.menu_id = parsed.menu_id
  }

  console.log('[createMenuUpload] sending payload', payload)

  try {
    const { body } = await ncdbRequest<MenuUploadRecord>({
      endpoint: '/create/menu_uploads',
      payload,
      context: 'menuUpload.create',
    })

    if (isNcdbSuccess(body) && body.data) {
      const parsedRecord = ensureParseSuccess(MenuUploadRecordSchema, body.data, 'createMenuUpload response')
      const mergedMetadata = appendMetadata(parsedRecord.metadata as Record<string, unknown> | undefined, metadata)
      return {
        ...parsedRecord,
        metadata: mergedMetadata,
        restaurant_id: parsedRecord.restaurant_id ?? parsed.restaurant_id,
        menu_id: parsedRecord.menu_id ?? parsed.menu_id,
      }
    }

    if (isNcdbSuccess(body) && body.id) {
      const fallbackRecord = ensureParseSuccess(
        MenuUploadRecordSchema,
        {
          id: body.id,
          restaurant_id: parsed.restaurant_id,
          menu_id: parsed.menu_id,
          file_url: parsed.file_url,
          file_name: parsed.file_name,
          file_size: parsed.file_size,
          resource_type: parsed.resource_type,
          status: parsed.status,
          parser_version: parsed.parser_version,
          metadata,
          created_at: timestamp,
          updated_at: timestamp,
        },
        'createMenuUpload fallback record'
      )
      return fallbackRecord
    }

    if (isNcdbSuccess(body)) {
      throw new Error('NCDB did not return a menu upload record')
    }

    throw new Error(getNcdbErrorMessage(body) || 'Failed to create menu upload record')
  } catch (error) {
    if (supportsRestaurantIdColumn && isUnknownColumnError(error, 'restaurant_id')) {
      supportsRestaurantIdColumn = false
      console.warn('[createMenuUpload] detected missing restaurant_id column, retrying without it')
      return createMenuUpload(input)
    }

    if (supportsMenuIdColumn && isUnknownColumnError(error, 'menu_id')) {
      supportsMenuIdColumn = false
      console.warn('[createMenuUpload] detected missing menu_id column, retrying without it')
      return createMenuUpload(input)
    }

    const axiosError = resolveAxiosError(error)
    const errorPayload = axiosError?.response?.data as { error?: unknown; message?: unknown } | undefined
    const upstreamMessage =
      (typeof errorPayload?.error === 'string' && errorPayload.error.trim() ? errorPayload.error : undefined) ??
      (typeof errorPayload?.message === 'string' && errorPayload.message.trim() ? errorPayload.message : undefined)

    if (upstreamMessage === 'Error creating record.' || upstreamMessage === 'Table does not exist') {
      throw new Error(
        'Menu upload storage is not provisioned in NCDB. Create the `menu_uploads` table (see docs/architecture/allerq-menus-qr-billing-plan.md) or disable uploads for now.'
      )
    }

    throw error
  }
}

export interface GetMenuUploadByIdInput {
  id: number
}

export async function createMenuUploadItem(input: CreateMenuUploadItemInput): Promise<MenuUploadItemRecord> {
  const parsed = CreateMenuUploadItemSchema.parse(input)
  const timestamp = Date.now()
  const status = (parsed.status ?? 'pending') as MenuUploadItemStatus

  const payload: Record<string, unknown> = {
    upload_id: parsed.upload_id,
    created_at: timestamp,
    updated_at: timestamp,
    status,
  }

  if (parsed.restaurant_id !== undefined) {
    payload.restaurant_id = parsed.restaurant_id
  }
  if (parsed.menu_id !== undefined) {
    payload.menu_id = parsed.menu_id
  }
  if (parsed.name !== undefined) {
    payload.name = parsed.name
  }
  if (parsed.description !== undefined) {
    payload.description = parsed.description
  }
  if (parsed.price !== undefined) {
    payload.price = parsed.price
  }
  if (parsed.raw_text !== undefined) {
    payload.raw_text = parsed.raw_text
  }
  if (parsed.confidence !== undefined) {
    payload.confidence = parsed.confidence
  }
  if (parsed.suggested_category !== undefined) {
    payload.suggested_category = parsed.suggested_category
  }
  if (parsed.suggested_allergens) {
    payload.suggested_allergens = JSON.stringify(parsed.suggested_allergens)
  }
  if (parsed.suggested_dietary) {
    payload.suggested_dietary = JSON.stringify(parsed.suggested_dietary)
  }
  if (parsed.ai_payload) {
    payload.ai_payload = JSON.stringify(parsed.ai_payload)
  }
  if (parsed.metadata) {
    payload.metadata = JSON.stringify(parsed.metadata)
  }

  Object.keys(payload).forEach((key) => {
    const value = payload[key]
    if (value === undefined || value === null || value === '') {
      delete payload[key]
    }
  })

  console.log('[createMenuUploadItem] sending payload', {
    ...payload,
  })

  const { body } = await ncdbRequest<MenuUploadItemRecord>({
    endpoint: '/create/menu_upload_items',
    payload,
    context: 'menuUploadItem.create',
  })

  if (isNcdbSuccess(body) && body.data) {
    return ensureParseSuccess(MenuUploadItemRecordSchema, body.data, 'createMenuUploadItem response')
  }

  if (isNcdbSuccess(body) && body.id) {
    return ensureParseSuccess(
      MenuUploadItemRecordSchema,
      {
        id: body.id,
        upload_id: parsed.upload_id,
        restaurant_id: parsed.restaurant_id,
        menu_id: parsed.menu_id,
        name: parsed.name,
        description: parsed.description,
        price: parsed.price,
        raw_text: parsed.raw_text,
        status,
        confidence: parsed.confidence,
        suggested_category: parsed.suggested_category,
        suggested_allergens: parsed.suggested_allergens,
        suggested_dietary: parsed.suggested_dietary,
        ai_payload: parsed.ai_payload,
        metadata: parsed.metadata,
        created_at: timestamp,
        updated_at: timestamp,
      },
      'createMenuUploadItem fallback record'
    )
  }

  if (isNcdbSuccess(body)) {
    throw new Error('NCDB did not return a menu upload item record')
  }

  throw new Error(getNcdbErrorMessage(body) || 'Failed to create menu upload item')
}

export async function getMenuUploadById({ id }: GetMenuUploadByIdInput): Promise<MenuUploadRecord | null> {
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('A valid menu upload id is required')
  }

  const payload: Record<string, unknown> = { id }

  console.log('[getMenuUploadById] request payload', payload)

  const { body } = await ncdbRequest<MenuUploadRecord | MenuUploadRecord[]>({
    endpoint: '/search/menu_uploads',
    payload,
    context: 'menuUpload.getById',
  })

  if (isNcdbSuccess(body) && body.data) {
    const records = Array.isArray(body.data) ? body.data : [body.data]
    for (const record of records) {
      try {
        return ensureParseSuccess(MenuUploadRecordSchema, record, 'getMenuUploadById record')
      } catch (error) {
        console.warn('[getMenuUploadById] record failed validation', error)
      }
    }

    throw new Error('NCDB returned malformed menu upload record')
  }

  if (isNcdbSuccess(body)) {
    return null
  }

  throw new Error(getNcdbErrorMessage(body) || 'Failed to fetch menu upload')
}

export interface GetMenuUploadsOptions {
  restaurantId?: number
  menuId?: number
  status?: MenuUploadStatus | MenuUploadStatus[]
}

export async function getMenuUploads(options: GetMenuUploadsOptions = {}): Promise<MenuUploadRecord[]> {
  const payload: Record<string, unknown> = {}

  if (supportsRestaurantIdColumn && typeof options.restaurantId === 'number') {
    payload.restaurant_id = options.restaurantId
  }
  if (supportsMenuIdColumn && typeof options.menuId === 'number') {
    payload.menu_id = options.menuId
  }
  if (Array.isArray(options.status)) {
    payload.status = options.status
  } else if (options.status) {
    payload.status = options.status
  }

  console.log('[getMenuUploads] request payload', payload)

  try {
    const { body } = await ncdbRequest<MenuUploadRecord | MenuUploadRecord[]>({
      endpoint: '/search/menu_uploads',
      payload,
      context: 'menuUpload.list',
    })

    if (isNcdbSuccess(body) && body.data) {
      const records = Array.isArray(body.data) ? body.data : [body.data]
      const parsedRecords = ensureParseSuccess(MenuUploadArraySchema, records, 'getMenuUploads records')

      return parsedRecords.filter((record) => {
        if (typeof options.restaurantId === 'number') {
          const recordRestaurantId =
            record.restaurant_id ?? getNumericMetadataValue(record.metadata as Record<string, unknown> | undefined, 'restaurantId')
          if (!recordRestaurantId || Number(recordRestaurantId) !== options.restaurantId) {
            return false
          }
        }

        if (typeof options.menuId === 'number') {
          const recordMenuId =
            record.menu_id ?? getNumericMetadataValue(record.metadata as Record<string, unknown> | undefined, 'menuId')
          if (!recordMenuId || Number(recordMenuId) !== options.menuId) {
            return false
          }
        }

        if (Array.isArray(options.status)) {
          return options.status.includes(record.status)
        }

        if (options.status) {
          return record.status === options.status
        }

        return true
      })
    }

    if (isNcdbSuccess(body)) {
      return []
    }

    throw new Error(getNcdbErrorMessage(body) || 'Failed to fetch menu uploads')
  } catch (error) {
    if (supportsRestaurantIdColumn && isUnknownColumnError(error, 'restaurant_id')) {
      supportsRestaurantIdColumn = false
      console.warn('[getMenuUploads] detected missing restaurant_id column, retrying without it')
      return getMenuUploads(options)
    }
    if (supportsMenuIdColumn && isUnknownColumnError(error, 'menu_id')) {
      supportsMenuIdColumn = false
      console.warn('[getMenuUploads] detected missing menu_id column, retrying without it')
      return getMenuUploads(options)
    }

    throw error
  }
}

const UpdateMenuUploadSchema = z
  .object({
    status: MenuUploadStatusSchema.optional(),
    menu_id: z
      .union([z.number(), z.string(), z.null(), z.undefined()])
      .transform((value) => coerceNumber(value, 'menu_id', { optional: true }))
      .optional(),
    parser_version: z.string().optional(),
    ai_model: z.string().optional(),
    processed_at: z
      .union([z.number(), z.string(), z.null(), z.undefined()])
      .transform((value) => coerceNumber(value, 'processed_at', { optional: true }))
      .optional(),
    failure_reason: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update a menu upload',
  })

export type UpdateMenuUploadInput = { id: number } & z.infer<typeof UpdateMenuUploadSchema>

export async function updateMenuUpload({ id, ...updates }: UpdateMenuUploadInput): Promise<MenuUploadRecord> {
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('A valid menu upload id is required')
  }

  const parsedUpdates = UpdateMenuUploadSchema.parse(updates)

  const payload: Record<string, unknown> = {
    record_id: id,
    updated_at: Date.now(),
    ...parsedUpdates,
  }

  if (payload.metadata && typeof payload.metadata === 'object') {
    payload.metadata = JSON.stringify(payload.metadata)
  }

  if (payload.processed_at === null) {
    payload.processed_at = undefined
  }

  Object.keys(payload).forEach((key) => {
    const value = payload[key]
    if (value === undefined || value === null || value === '') {
      delete payload[key]
    }
  })

  console.log('[updateMenuUpload] sending payload', {
    ...payload,
  })

  const { body } = await ncdbRequest<MenuUploadRecord>({
    endpoint: '/update/menu_uploads',
    payload,
    context: 'menuUpload.update',
  })

  if (isNcdbSuccess(body) && body.data) {
    return ensureParseSuccess(MenuUploadRecordSchema, body.data, 'updateMenuUpload response')
  }

  throw new Error(getNcdbErrorMessage(body) || 'Failed to update menu upload')
}

export interface GetMenuUploadItemsOptions {
  uploadId?: number
  menuId?: number
  status?: string | string[]
}

export async function getMenuUploadItems(
  options: GetMenuUploadItemsOptions = {}
): Promise<MenuUploadItemRecord[]> {
  const payload: Record<string, unknown> = {}

  if (typeof options.uploadId === 'number') {
    payload.upload_id = options.uploadId
  }
  if (typeof options.menuId === 'number') {
    payload.menu_id = options.menuId
  }
  if (Array.isArray(options.status)) {
    payload.status = options.status
  } else if (options.status) {
    payload.status = options.status
  }

  console.log('[getMenuUploadItems] request payload', payload)

  const { body } = await ncdbRequest<MenuUploadItemRecord | MenuUploadItemRecord[]>({
    endpoint: '/search/menu_upload_items',
    payload,
    context: 'menuUploadItem.list',
  })

  if (isNcdbSuccess(body) && body.data) {
    const records = Array.isArray(body.data) ? body.data : [body.data]
    return ensureParseSuccess(MenuUploadItemArraySchema, records, 'getMenuUploadItems records')
  }

  if (isNcdbSuccess(body)) {
    return []
  }

  throw new Error(getNcdbErrorMessage(body) || 'Failed to fetch menu upload items')
}

const UpdateMenuUploadItemSchema = z
  .object({
    status: z.union([z.string(), MenuUploadItemStatusSchema]).optional(),
    menu_id: z
      .union([z.number(), z.string(), z.null(), z.undefined()])
      .transform((value) => coerceNumber(value, 'menu_id', { optional: true }))
      .optional(),
    restaurant_id: z
      .union([z.number(), z.string(), z.null(), z.undefined()])
      .transform((value) => coerceNumber(value, 'restaurant_id', { optional: true }))
      .optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    price: z
      .union([z.number(), z.string(), z.null(), z.undefined()])
      .transform((value) => {
        if (value === null || value === undefined || value === '') return undefined
        const numeric = Number(value)
        return Number.isFinite(numeric) ? numeric : undefined
      })
      .optional(),
    suggested_category: z.string().optional(),
    suggested_allergens: z.array(IdentifiedTagSchema).optional(),
    suggested_dietary: z.array(IdentifiedTagSchema).optional(),
    ai_payload: z.record(z.string(), z.unknown()).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update a menu upload item',
  })

export type UpdateMenuUploadItemInput = { id: number } & z.infer<typeof UpdateMenuUploadItemSchema>

export async function updateMenuUploadItem({
  id,
  ...updates
}: UpdateMenuUploadItemInput): Promise<MenuUploadItemRecord> {
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('A valid menu upload item id is required')
  }

  const parsedUpdates = UpdateMenuUploadItemSchema.parse(updates)

  const payload: Record<string, unknown> = {
    record_id: id,
    updated_at: Date.now(),
    ...parsedUpdates,
  }

  if (payload.suggested_allergens && Array.isArray(payload.suggested_allergens)) {
    payload.suggested_allergens = JSON.stringify(payload.suggested_allergens)
  }
  if (payload.suggested_dietary && Array.isArray(payload.suggested_dietary)) {
    payload.suggested_dietary = JSON.stringify(payload.suggested_dietary)
  }
  if (payload.ai_payload && typeof payload.ai_payload === 'object') {
    payload.ai_payload = JSON.stringify(payload.ai_payload)
  }
  if (payload.metadata && typeof payload.metadata === 'object') {
    payload.metadata = JSON.stringify(payload.metadata)
  }

  Object.keys(payload).forEach((key) => {
    const value = payload[key]
    if (value === undefined || value === null || value === '') {
      delete payload[key]
    }
  })

  console.log('[updateMenuUploadItem] sending payload', {
    ...payload,
  })

  const { body } = await ncdbRequest<MenuUploadItemRecord>({
    endpoint: '/update/menu_upload_items',
    payload,
    context: 'menuUploadItem.update',
  })

  if (isNcdbSuccess(body) && body.data) {
    return ensureParseSuccess(MenuUploadItemRecordSchema, body.data, 'updateMenuUploadItem response')
  }

  throw new Error(getNcdbErrorMessage(body) || 'Failed to update menu upload item')
}
