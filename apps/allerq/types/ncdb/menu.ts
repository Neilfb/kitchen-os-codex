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
    description: z
      .union([z.string(), z.null(), z.undefined()])
      .transform((value) => (typeof value === 'string' ? value : '')),
    restaurant_id: z.union([z.number(), z.string()]).transform((value) => Number(value)),
    created_by: z
      .union([z.string(), z.null(), z.undefined()])
      .transform((value) => {
        if (typeof value !== 'string') return undefined
        const trimmed = value.trim()
        return trimmed.length > 0 ? trimmed : undefined
      }),
    created_at: z.union([z.number(), z.string()]).transform((value) => Number(value)),
    updated_at: z.union([z.number(), z.string()]).transform((value) => Number(value)),
    external_id: z
      .union([z.string(), z.null(), z.undefined()])
      .transform((value) => (typeof value === 'string' ? value : undefined)),
    menu_type: z
      .union([z.string(), z.null(), z.undefined()])
      .transform((value) => {
        if (typeof value !== 'string') return undefined
        const trimmed = value.trim()
        return trimmed.length > 0 ? trimmed : undefined
      }),
    is_active: z
      .union([z.number(), z.boolean(), z.string()])
      .transform((value) => {
        if (typeof value === 'string') {
          const trimmed = value.trim()
          if (trimmed === '') return undefined
          const numeric = Number(trimmed)
          if (Number.isFinite(numeric)) {
            return numeric
          }
          if (trimmed.toLowerCase() === 'true') return 1
          if (trimmed.toLowerCase() === 'false') return 0
        }
        return value
      })
      .optional()
      .default(1),
    ai_processed: z
      .union([z.number(), z.boolean(), z.null(), z.undefined()])
      .transform((value) => (value === null ? undefined : value)),
    upload_file_name: z
      .union([z.string(), z.null(), z.undefined()])
      .transform((value) => (typeof value === 'string' ? value : undefined)),
    source_upload_id: z
      .union([z.number(), z.string(), z.null(), z.undefined()])
      .transform((value) => {
        if (value === null || value === undefined || value === '') {
          return undefined
        }
        const numeric = Number(value)
        return Number.isFinite(numeric) ? numeric : undefined
      }),
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
    description: z
      .union([z.string(), z.null(), z.undefined()])
      .transform((value) => (typeof value === 'string' ? value : '')),
    price: z
      .union([z.number(), z.string(), z.null(), z.undefined()])
      .transform((value) => {
        if (value === null || value === undefined) return undefined
        if (typeof value === 'string') {
          const trimmed = value.trim()
          if (!trimmed) return undefined
          const numeric = Number(trimmed)
          return Number.isFinite(numeric) ? numeric : undefined
        }
        return Number.isFinite(value) ? value : undefined
      })
      .optional(),
    category: z
      .union([z.string(), z.null(), z.undefined()])
      .transform((value) => {
        if (typeof value !== 'string') return undefined
        const trimmed = value.trim()
        return trimmed.length > 0 ? trimmed : undefined
      }),
    allergens: z
      .union([z.string(), z.null(), z.undefined()])
      .transform((value) => {
        if (typeof value !== 'string') return undefined
        const trimmed = value.trim()
        return trimmed.length > 0 ? trimmed : undefined
      }),
    dietary: z
      .union([z.string(), z.null(), z.undefined()])
      .transform((value) => {
        if (typeof value !== 'string') return undefined
        const trimmed = value.trim()
        return trimmed.length > 0 ? trimmed : undefined
      }),
    created_at: z.union([z.number(), z.string()]).transform((value) => Number(value)),
    updated_at: z.union([z.number(), z.string()]).transform((value) => Number(value)),
    external_id: z
      .union([z.string(), z.null(), z.undefined()])
      .transform((value) => (typeof value === 'string' ? value : undefined)),
    ai_confidence: z
      .union([z.number(), z.string(), z.null(), z.undefined()])
      .transform((value) => {
        if (value === null || value === undefined) return undefined
        if (typeof value === 'number') return value
        const trimmed = value.trim()
        if (!trimmed) return undefined
        const numeric = Number(trimmed)
        return Number.isFinite(numeric) ? numeric : undefined
      })
      .optional(),
    manual_override: z
      .union([z.number(), z.boolean(), z.string(), z.null(), z.undefined()])
      .transform((value) => {
        if (value === null || value === undefined) return undefined
        if (typeof value === 'boolean') return value
        if (typeof value === 'number') return value
        const trimmed = value.trim().toLowerCase()
        if (!trimmed) return undefined
        if (trimmed === 'true') return true
        if (trimmed === 'false') return false
        const numeric = Number(trimmed)
        return Number.isFinite(numeric) ? numeric : undefined
      })
      .optional(),
    category_id: z
      .union([z.number(), z.string(), z.null(), z.undefined()])
      .transform((value) => {
        if (value === null || value === undefined) return undefined
        const raw = typeof value === 'string' ? value.trim() : value
        if (raw === '') return undefined
        const numeric = Number(raw)
        return Number.isFinite(numeric) ? numeric : undefined
      })
      .optional(),
    is_active: z
      .union([z.number(), z.boolean(), z.string(), z.null(), z.undefined()])
      .transform((value) => {
        if (value === null || value === undefined) return undefined
        if (typeof value === 'number') return value
        if (typeof value === 'boolean') return value ? 1 : 0
        const trimmed = value.trim()
        if (!trimmed) return undefined
        const numeric = Number(trimmed)
        if (Number.isFinite(numeric)) return numeric
        if (trimmed.toLowerCase() === 'true') return 1
        if (trimmed.toLowerCase() === 'false') return 0
        return undefined
      })
      .optional(),
    ai_processed: z
      .union([z.number(), z.boolean(), z.null(), z.undefined()])
      .transform((value) => (value === null ? undefined : value)),
    ai_needs_review: z
      .union([z.number(), z.boolean(), z.string(), z.null(), z.undefined()])
      .transform((value) => {
        if (value === null || value === undefined) return undefined
        if (typeof value === 'boolean') return value
        if (typeof value === 'number') return value
        const trimmed = value.trim()
        if (!trimmed) return undefined
        if (trimmed.toLowerCase() === 'true') return true
        if (trimmed.toLowerCase() === 'false') return false
        const numeric = Number(trimmed)
        return Number.isFinite(numeric) ? numeric : undefined
      })
      .optional(),
    identified_allergens: jsonField(z.array(IdentifiedTagSchema).default([]), []).optional(),
    identified_dietary: jsonField(z.array(IdentifiedTagSchema).default([]), []).optional(),
    regulatory_highlights: jsonField(z.array(RegulatoryHighlightSchema).default([]), []).optional(),
  })
  .passthrough()

export type MenuItemRecord = z.infer<typeof MenuItemRecordSchema>
