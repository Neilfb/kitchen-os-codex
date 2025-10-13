import { z } from 'zod'

import { jsonField } from './json'

export const IdentifiedTagSchema = z
  .object({
    code: z.string(),
    label: z.string(),
    icon: z.string().optional(),
    confidence: z
      .union([z.number(), z.string()])
      .transform((value) => (value === '' ? undefined : Number(value)))
      .optional(),
    source: z.enum(['ai', 'manual', 'regulatory']).optional(),
    notes: z.string().optional(),
  })
  .passthrough()

export type IdentifiedTag = z.infer<typeof IdentifiedTagSchema>

export const RegulatoryHighlightSchema = z
  .object({
    code: z.string(),
    label: z.string(),
    region: z.string(),
    required: z.union([z.boolean(), z.number()]).transform((value) => value === 1 || value === true).optional(),
    message: z.string().optional(),
    reference_url: z.string().url().optional(),
  })
  .passthrough()

export type RegulatoryHighlight = z.infer<typeof RegulatoryHighlightSchema>

export const MenuRecordSchema = z
  .object({
    id: z.union([z.number(), z.string()]),
    name: z.string(),
    description: z.string().optional().default(''),
    restaurant_id: z.union([z.number(), z.string()]).transform((value) => Number(value)),
    created_by: z.string().optional(),
    created_at: z.union([z.number(), z.string()]).transform((value) => Number(value)),
    updated_at: z.union([z.number(), z.string()]).transform((value) => Number(value)),
    external_id: z.string().optional(),
    menu_type: z.string().optional(),
    is_active: z.union([z.number(), z.boolean()]).optional().default(1),
    ai_processed: z.union([z.number(), z.boolean()]).optional(),
    upload_file_name: z.string().optional(),
    source_upload_id: z.union([z.number(), z.string()]).transform((value) => Number(value)).optional(),
    ai_summary: z
      .union([z.string(), z.null(), z.undefined()])
      .transform((value) => (typeof value === 'string' ? value : undefined)),
  })
  .passthrough()

export type MenuRecord = z.infer<typeof MenuRecordSchema>

export const MenuItemRecordSchema = z
  .object({
    id: z.union([z.number(), z.string()]),
    menu_id: z.union([z.number(), z.string()]).transform((value) => Number(value)),
    restaurant_id: z.union([z.number(), z.string()]).transform((value) => Number(value)),
    name: z.string(),
    description: z.string().optional().default(''),
    price: z
      .union([z.number(), z.string(), z.null(), z.undefined()])
      .transform((value) => {
        if (value === null || value === undefined || value === '') return undefined
        const numeric = Number(value)
        return Number.isFinite(numeric) ? numeric : undefined
      })
      .optional(),
    category: z.string().optional(),
    allergens: z.string().optional(),
    dietary: z.string().optional(),
    created_at: z.union([z.number(), z.string()]).transform((value) => Number(value)),
    updated_at: z.union([z.number(), z.string()]).transform((value) => Number(value)),
    external_id: z.string().optional(),
    ai_confidence: z.union([z.number(), z.string()]).optional(),
    manual_override: z.union([z.number(), z.boolean()]).optional(),
    category_id: z.union([z.number(), z.string()]).optional(),
    is_active: z.union([z.number(), z.boolean()]).optional(),
    ai_processed: z.union([z.number(), z.boolean()]).optional(),
    ai_needs_review: z.union([z.number(), z.boolean()]).optional(),
    identified_allergens: jsonField(z.array(IdentifiedTagSchema).default([]), []).optional(),
    identified_dietary: jsonField(z.array(IdentifiedTagSchema).default([]), []).optional(),
    regulatory_highlights: jsonField(z.array(RegulatoryHighlightSchema).default([]), []).optional(),
  })
  .passthrough()

export type MenuItemRecord = z.infer<typeof MenuItemRecordSchema>
