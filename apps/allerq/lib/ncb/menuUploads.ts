import axios from 'axios'
import { z } from 'zod'

import {
  NCDB_API_KEY,
  NCDB_SECRET_KEY,
  buildNcdbUrl,
  ensureParseSuccess,
  extractNcdbError,
} from './constants'
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

function isUnknownColumnError(error: unknown, column: string) {
  if (!axios.isAxiosError?.(error)) {
    return false
  }

  const payload = error.response?.data
  if (!payload) {
    return false
  }

  const message = typeof payload.error === 'string' ? payload.error : payload.message
  if (typeof message === 'string' && message.includes(`Unknown column '${column}'`)) {
    return true
  }

  return false
}

function extractNcdbMessage(error: unknown): string | undefined {
  if (!axios.isAxiosError?.(error)) {
    return undefined
  }
  const payload = error.response?.data
  if (!payload) {
    return undefined
  }
  if (typeof payload.error === 'string') {
    return payload.error
  }
  if (typeof payload.message === 'string') {
    return payload.message
  }
  return undefined
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
    secret_key: NCDB_SECRET_KEY,
    file_url: parsed.file_url,
    file_name: parsed.file_name,
    file_size: parsed.file_size,
    resource_type: parsed.resource_type,
    status: parsed.status,
    parser_version: parsed.parser_version,
    created_at: timestamp,
    updated_at: timestamp,
  }

  if (supportsRestaurantIdColumn) {
    payload.restaurant_id = parsed.restaurant_id
  }
  if (supportsMenuIdColumn && parsed.menu_id !== undefined) {
    payload.menu_id = parsed.menu_id
  }

  payload.metadata = JSON.stringify(metadata)

  console.log('[createMenuUpload] sending payload', {
    ...payload,
    secret_key: '********',
  })

  try {
    const response = await axios({
      method: 'post',
      url: buildNcdbUrl('/create/menu_uploads'),
      headers: {
        Authorization: `Bearer ${NCDB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: payload,
    })

    if (response.data?.status === 'success' && response.data?.data) {
      const parsedRecord = ensureParseSuccess(MenuUploadRecordSchema, response.data.data, 'createMenuUpload response')
      const mergedMetadata = appendMetadata(parsedRecord.metadata as Record<string, unknown> | undefined, metadata)
      return {
        ...parsedRecord,
        metadata: mergedMetadata,
        restaurant_id: parsedRecord.restaurant_id ?? parsed.restaurant_id,
        menu_id: parsedRecord.menu_id ?? parsed.menu_id,
      }
    }

    if (response.data?.status === 'success' && response.data?.id) {
      const fallbackRecord = {
        id: response.data.id,
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
      }
      return ensureParseSuccess(MenuUploadRecordSchema, fallbackRecord, 'createMenuUpload fallback record')
    }

    console.error('[createMenuUpload] unexpected response', response.data)
    throw new Error('Failed to create menu upload record')
  } catch (error) {
    if (supportsRestaurantIdColumn && isUnknownColumnError(error, 'restaurant_id')) {
      supportsRestaurantIdColumn = false
      console.warn('[createMenuUpload] detected missing restaurant_id column, retrying without it')
      return createMenuUpload({
        ...input,
        restaurant_id: parsed.restaurant_id,
        menu_id: parsed.menu_id,
        metadata,
      })
    }

    if (supportsMenuIdColumn && isUnknownColumnError(error, 'menu_id')) {
      supportsMenuIdColumn = false
      console.warn('[createMenuUpload] detected missing menu_id column, retrying without it')
      return createMenuUpload({
        ...input,
        restaurant_id: parsed.restaurant_id,
        menu_id: parsed.menu_id,
        metadata,
      })
    }

    if (axios.isAxiosError?.(error) && error.response?.data) {
      console.error('[createMenuUpload] NCDB error response', error.response.data)
    }
    const upstreamMessage = extractNcdbMessage(error)
    if (upstreamMessage === 'Error creating record.' || upstreamMessage === 'Table does not exist') {
      throw new Error(
        'Menu upload storage is not provisioned in NCDB. Create the `menu_uploads` table (see docs/architecture/allerq-menus-qr-billing-plan.md) or disable uploads for now.'
      )
    }

    throw extractNcdbError(error)
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
    secret_key: NCDB_SECRET_KEY,
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
    secret_key: '********',
  })

  try {
    const response = await axios({
      method: 'post',
      url: buildNcdbUrl('/create/menu_upload_items'),
      headers: {
        Authorization: `Bearer ${NCDB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: payload,
    })

    if (response.data?.status === 'success' && response.data?.data) {
      return ensureParseSuccess(MenuUploadItemRecordSchema, response.data.data, 'createMenuUploadItem response')
    }

    if (response.data?.status === 'success' && response.data?.id) {
      return ensureParseSuccess(
        MenuUploadItemRecordSchema,
        {
          id: response.data.id,
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

    console.error('[createMenuUploadItem] unexpected response', response.data)
    throw new Error('Failed to create menu upload item')
  } catch (error) {
    if (axios.isAxiosError?.(error) && error.response?.data) {
      console.error('[createMenuUploadItem] NCDB error response', error.response.data)
    }
    throw extractNcdbError(error)
  }
}

export async function getMenuUploadById({ id }: GetMenuUploadByIdInput): Promise<MenuUploadRecord | null> {
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('A valid menu upload id is required')
  }

  const payload: Record<string, unknown> = {
    secret_key: NCDB_SECRET_KEY,
    id,
  }

  console.log('[getMenuUploadById] request payload', {
    ...payload,
    secret_key: '********',
  })

  try {
    const response = await axios({
      method: 'post',
      url: buildNcdbUrl('/search/menu_uploads'),
      headers: {
        Authorization: `Bearer ${NCDB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: payload,
    })

    if (response.data?.status === 'success' && response.data?.data) {
      const records = Array.isArray(response.data.data) ? response.data.data : [response.data.data]
      for (const record of records) {
        try {
          return ensureParseSuccess(MenuUploadRecordSchema, record, 'getMenuUploadById record')
        } catch (error) {
          console.warn('[getMenuUploadById] record failed validation', error)
          continue
        }
      }

      throw new Error('NCDB returned malformed menu upload record')
    }

    if (response.data?.status === 'success') {
      return null
    }

    console.error('[getMenuUploadById] unexpected response', response.data)
    throw new Error('Failed to fetch menu upload')
  } catch (error) {
    if (axios.isAxiosError?.(error) && error.response?.data) {
      console.error('[getMenuUploadById] NCDB error response', error.response.data)
    }
    throw extractNcdbError(error)
  }
}

export interface GetMenuUploadsOptions {
  restaurantId?: number
  menuId?: number
  status?: MenuUploadStatus | MenuUploadStatus[]
}

export async function getMenuUploads(options: GetMenuUploadsOptions = {}): Promise<MenuUploadRecord[]> {
  const payload: Record<string, unknown> = {
    secret_key: NCDB_SECRET_KEY,
  }

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

  console.log('[getMenuUploads] request payload', {
    ...payload,
    secret_key: '********',
  })

  try {
    const response = await axios({
      method: 'post',
      url: buildNcdbUrl('/search/menu_uploads'),
      headers: {
        Authorization: `Bearer ${NCDB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: payload,
    })

    if (response.data?.status === 'success' && response.data?.data) {
      const records = Array.isArray(response.data.data) ? response.data.data : [response.data.data]
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

        return true
      })
    }

    if (response.data?.status === 'success') {
      return []
    }

    console.error('[getMenuUploads] unexpected response', response.data)
    throw new Error('Failed to fetch menu uploads')
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
    if (axios.isAxiosError?.(error) && error.response?.data) {
      console.error('[getMenuUploads] NCDB error response', error.response.data)
    }
    throw extractNcdbError(error)
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
    secret_key: NCDB_SECRET_KEY,
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
    secret_key: '********',
  })

  try {
    const response = await axios({
      method: 'post',
      url: buildNcdbUrl('/update/menu_uploads'),
      headers: {
        Authorization: `Bearer ${NCDB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: payload,
    })

    if (response.data?.status === 'success' && response.data?.data) {
      return ensureParseSuccess(MenuUploadRecordSchema, response.data.data, 'updateMenuUpload response')
    }

    console.error('[updateMenuUpload] unexpected response', response.data)
    throw new Error('Failed to update menu upload')
  } catch (error) {
    if (axios.isAxiosError?.(error) && error.response?.data) {
      console.error('[updateMenuUpload] NCDB error response', error.response.data)
    }
    throw extractNcdbError(error)
  }
}

export interface GetMenuUploadItemsOptions {
  uploadId?: number
  menuId?: number
  status?: string | string[]
}

export async function getMenuUploadItems(
  options: GetMenuUploadItemsOptions = {}
): Promise<MenuUploadItemRecord[]> {
  const payload: Record<string, unknown> = {
    secret_key: NCDB_SECRET_KEY,
  }

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

  console.log('[getMenuUploadItems] request payload', {
    ...payload,
    secret_key: '********',
  })

  try {
    const response = await axios({
      method: 'post',
      url: buildNcdbUrl('/search/menu_upload_items'),
      headers: {
        Authorization: `Bearer ${NCDB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: payload,
    })

    if (response.data?.status === 'success' && response.data?.data) {
      const records = Array.isArray(response.data.data) ? response.data.data : [response.data.data]
      return ensureParseSuccess(MenuUploadItemArraySchema, records, 'getMenuUploadItems records')
    }

    if (response.data?.status === 'success') {
      return []
    }

    console.error('[getMenuUploadItems] unexpected response', response.data)
    throw new Error('Failed to fetch menu upload items')
  } catch (error) {
    if (axios.isAxiosError?.(error) && error.response?.data) {
      console.error('[getMenuUploadItems] NCDB error response', error.response.data)
    }
    throw extractNcdbError(error)
  }
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
    secret_key: NCDB_SECRET_KEY,
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
    secret_key: '********',
  })

  try {
    const response = await axios({
      method: 'post',
      url: buildNcdbUrl('/update/menu_upload_items'),
      headers: {
        Authorization: `Bearer ${NCDB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: payload,
    })

    if (response.data?.status === 'success' && response.data?.data) {
      return ensureParseSuccess(MenuUploadItemRecordSchema, response.data.data, 'updateMenuUploadItem response')
    }

    console.error('[updateMenuUploadItem] unexpected response', response.data)
    throw new Error('Failed to update menu upload item')
  } catch (error) {
    if (axios.isAxiosError?.(error) && error.response?.data) {
      console.error('[updateMenuUploadItem] NCDB error response', error.response.data)
    }
    throw extractNcdbError(error)
  }
}
