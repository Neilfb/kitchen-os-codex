import { z } from 'zod'

const stringWithFallback = (fallback = '') =>
  z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((value) => {
      if (value === null || value === undefined) {
        return fallback
      }

      const asString = typeof value === 'number' ? value.toString() : value
      const trimmed = asString.trim()
      return trimmed.length > 0 ? trimmed : fallback
    })

const optionalString = () =>
  z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((value) => {
      if (value === null || value === undefined) {
        return undefined
      }

      const asString = typeof value === 'number' ? value.toString() : value
      const trimmed = asString.trim()
      return trimmed.length > 0 ? trimmed : undefined
    })

const emailSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (typeof value !== 'string') {
      return undefined
    }

    const trimmed = value.trim()
    if (!trimmed) {
      return undefined
    }

    const result = z.string().email().safeParse(trimmed)
    return result.success ? trimmed.toLowerCase() : undefined
  })

const timestampSchema = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === null || value === undefined) {
      return undefined
    }

    const numericValue = typeof value === 'string' ? Number(value) : value
    return Number.isFinite(numericValue) ? Number(numericValue) : undefined
  })

const booleanSchema = z
  .union([z.boolean(), z.number(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === null || value === undefined) {
      return undefined
    }

    if (typeof value === 'boolean') {
      return value
    }

    if (typeof value === 'number') {
      return value !== 0
    }

    return undefined
  })

export const RestaurantRecordSchema = z
  .object({
    id: z.union([z.number().int(), z.string()]),
    name: stringWithFallback(),
    description: stringWithFallback(),
    address: stringWithFallback(),
    phone: optionalString(),
    email: emailSchema,
    website: optionalString(),
    cuisine_type: optionalString(),
    owner_id: stringWithFallback(),
    logo: optionalString(),
    cover_image: optionalString(),
    logo_url: optionalString(),
    region: optionalString(),
    location: optionalString(),
    is_active: booleanSchema,
    created_at: timestampSchema,
    updated_at: timestampSchema,
    external_id: optionalString(),
  })
  .passthrough()

export type RestaurantRecord = z.infer<typeof RestaurantRecordSchema>
