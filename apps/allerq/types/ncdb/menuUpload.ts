import { z } from 'zod'

import { jsonField } from './json'
import { IdentifiedTagSchema } from './menu'

export const MenuUploadStatusSchema = z.enum(['pending', 'processing', 'completed', 'failed', 'needs_review'])
export type MenuUploadStatus = z.infer<typeof MenuUploadStatusSchema>

export const MenuUploadRecordSchema = z
  .object({
    id: z.union([z.number(), z.string()]),
    restaurant_id: z
      .union([z.number(), z.string(), z.null(), z.undefined()])
      .transform((value) => {
        if (value === null || value === undefined || value === '') {
          return undefined
        }
        return Number(value)
      })
      .optional(),
    menu_id: z
      .union([z.number(), z.string(), z.null(), z.undefined()])
      .transform((value) => {
        if (value === null || value === undefined || value === '') {
          return undefined
        }
        return Number(value)
      })
      .optional(),
    file_url: z.string(),
    file_name: z.string(),
    file_size: z.union([z.number(), z.string()]).transform((value) => Number(value)),
    resource_type: z.string().optional(),
    status: MenuUploadStatusSchema,
    ai_model: z.string().optional(),
    parser_version: z.string().optional(),
    processed_at: z
      .union([z.number(), z.string(), z.null(), z.undefined()])
      .transform((value) => {
        if (value === null || value === undefined || value === '') return undefined
        return Number(value)
      })
      .optional(),
    created_at: z.union([z.number(), z.string()]).transform((value) => Number(value)),
    updated_at: z.union([z.number(), z.string()]).transform((value) => Number(value)),
    failure_reason: z.string().optional(),
    metadata: jsonField(z.record(z.string(), z.unknown()).default({}), () => ({})).optional(),
  })
  .strict()

export type MenuUploadRecord = z.infer<typeof MenuUploadRecordSchema>

export const MenuUploadItemStatusSchema = z.enum(['pending', 'completed', 'discarded', 'needs_review'])
export type MenuUploadItemStatus = z.infer<typeof MenuUploadItemStatusSchema>

export const MenuUploadItemRecordSchema = z
  .object({
    id: z.union([z.number(), z.string()]),
    upload_id: z.union([z.number(), z.string()]).transform((value) => Number(value)),
    restaurant_id: z.union([z.number(), z.string()]).transform((value) => Number(value)).optional(),
    menu_id: z.union([z.number(), z.string()]).transform((value) => Number(value)).optional(),
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
    status: MenuUploadItemStatusSchema.optional(),
    confidence: z
      .union([z.number(), z.string(), z.null(), z.undefined()])
      .transform((value) => {
        if (value === null || value === undefined || value === '') return undefined
        const numeric = Number(value)
        return Number.isFinite(numeric) ? numeric : undefined
      })
      .optional(),
    suggested_category: z.string().optional(),
    suggested_allergens: jsonField(z.array(IdentifiedTagSchema).default([]), []).optional(),
    suggested_dietary: jsonField(z.array(IdentifiedTagSchema).default([]), []).optional(),
    ai_payload: jsonField(z.record(z.string(), z.unknown()).default({}), () => ({})).optional(),
    metadata: jsonField(z.record(z.string(), z.unknown()).default({}), () => ({})).optional(),
    created_at: z.union([z.number(), z.string()]).transform((value) => Number(value)),
    updated_at: z.union([z.number(), z.string()]).transform((value) => Number(value)),
  })
  .strict()

export type MenuUploadItemRecord = z.infer<typeof MenuUploadItemRecordSchema>
