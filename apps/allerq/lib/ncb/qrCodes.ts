import { z } from 'zod'

import { ensureParseSuccess } from './constants'
import { ncdbRequest, isNcdbSuccess, getNcdbErrorMessage } from './client'
import { QrCodeRecordSchema, type QrCodeRecord } from '@/types/ncdb/qrCode'

const QrCodeArraySchema = z.array(QrCodeRecordSchema)

const CreateQrCodeSchema = z.object({
  restaurant_id: z.union([z.number(), z.string()]).transform((value) => Number(value)),
  menu_id: z.union([z.number(), z.string()]).transform((value) => Number(value)),
  location_code: z.string().min(1),
  qr_url: z.string().url(),
  deeplink_url: z.string().url().optional(),
  download_url: z.string().url().optional(),
  format: z.string().optional(),
  scan_target_version: z.union([z.number(), z.string()]).transform((value) => Number(value)).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export type CreateQrCodeInput = z.infer<typeof CreateQrCodeSchema>

export async function createQrCodeRecord(input: CreateQrCodeInput): Promise<QrCodeRecord> {
  const parsed = CreateQrCodeSchema.parse(input)
  const timestamp = Date.now()

  const payload: Record<string, unknown> = {
    restaurant_id: parsed.restaurant_id,
    menu_id: parsed.menu_id,
    location_code: parsed.location_code,
    qr_url: parsed.qr_url,
    deeplink_url: parsed.deeplink_url,
    download_url: parsed.download_url,
    format: parsed.format,
    scan_target_version: parsed.scan_target_version,
    created_at: timestamp,
    updated_at: timestamp,
    is_active: 1,
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

  console.log('[createQrCodeRecord] sending payload', {
    ...payload,
  })

  const { body } = await ncdbRequest<QrCodeRecord>({
    endpoint: '/create/qr_codes',
    payload,
    context: 'qr.create',
  })

  if (isNcdbSuccess(body) && body.data) {
    return ensureParseSuccess(QrCodeRecordSchema, body.data, 'createQrCodeRecord response')
  }

  if (isNcdbSuccess(body) && body.id) {
    const fallbackRecord = {
      id: body.id,
      restaurant_id: parsed.restaurant_id,
      menu_id: parsed.menu_id,
      location_code: parsed.location_code,
      qr_url: parsed.qr_url,
      deeplink_url: parsed.deeplink_url,
      download_url: parsed.download_url,
      format: parsed.format,
      scan_target_version: parsed.scan_target_version,
      created_at: timestamp,
      updated_at: timestamp,
      is_active: 1,
    }

    return ensureParseSuccess(QrCodeRecordSchema, fallbackRecord, 'createQrCodeRecord fallback record')
  }

  throw new Error(getNcdbErrorMessage(body) || 'Failed to create QR code record')
}

export interface GetQrCodesOptions {
  restaurantId?: number
  menuId?: number
  locationCode?: string
  isActive?: boolean
}

export async function getQrCodes(options: GetQrCodesOptions = {}): Promise<QrCodeRecord[]> {
  const payload: Record<string, unknown> = {}

  if (typeof options.restaurantId === 'number') {
    payload.restaurant_id = options.restaurantId
  }
  if (typeof options.menuId === 'number') {
    payload.menu_id = options.menuId
  }
  if (options.locationCode) {
    payload.location_code = options.locationCode
  }
  if (typeof options.isActive === 'boolean') {
    payload.is_active = options.isActive ? 1 : 0
  }

  console.log('[getQrCodes] request payload', payload)

  const { body } = await ncdbRequest<QrCodeRecord | QrCodeRecord[]>({
    endpoint: '/search/qr_codes',
    payload,
    context: 'qr.list',
  })

  if (isNcdbSuccess(body) && body.data) {
    const records = Array.isArray(body.data) ? body.data : [body.data]
    return ensureParseSuccess(QrCodeArraySchema, records, 'getQrCodes records')
  }

  if (isNcdbSuccess(body)) {
    return []
  }

  throw new Error(getNcdbErrorMessage(body) || 'Failed to fetch QR codes')
}

const UpdateQrCodeSchema = z
  .object({
    qr_url: z.string().url().optional(),
    deeplink_url: z.string().url().optional(),
    download_url: z.string().url().optional(),
    scan_target_version: z.union([z.number(), z.string()]).transform((value) => Number(value)).optional(),
    last_regenerated_at: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional(),
    scan_count: z.union([z.number(), z.string()]).transform((value) => Number(value)).optional(),
    is_active: z.union([z.boolean(), z.number()]).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update a QR code record',
  })

export type UpdateQrCodeInput = { id: number } & z.infer<typeof UpdateQrCodeSchema>

export async function updateQrCodeRecord({ id, ...updates }: UpdateQrCodeInput): Promise<QrCodeRecord> {
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('A valid QR code id is required')
  }

  const parsedUpdates = UpdateQrCodeSchema.parse(updates)

  const payload: Record<string, unknown> = {
    record_id: id,
    updated_at: Date.now(),
    ...parsedUpdates,
  }

  if (payload.metadata && typeof payload.metadata === 'object') {
    payload.metadata = JSON.stringify(payload.metadata)
  }

  if (payload.last_regenerated_at === null) {
    payload.last_regenerated_at = undefined
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

  console.log('[updateQrCodeRecord] sending payload', payload)

  const { body } = await ncdbRequest<QrCodeRecord>({
    endpoint: '/update/qr_codes',
    payload,
    context: 'qr.update',
  })

  if (isNcdbSuccess(body) && body.data) {
    return ensureParseSuccess(QrCodeRecordSchema, body.data, 'updateQrCodeRecord response')
  }

  throw new Error(getNcdbErrorMessage(body) || 'Failed to update QR code record')
}
