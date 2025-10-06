import { z } from 'zod'

export const RoleEnum = ['superadmin', 'admin', 'manager'] as const
export type Role = (typeof RoleEnum)[number]

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

const timestampSchema = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === null || value === undefined) {
      return undefined
    }

    const numericValue = typeof value === 'string' ? Number(value) : value
    return Number.isFinite(numericValue) ? Number(numericValue) : undefined
  })

const assignedRestaurantsSchema = z
  .union([z.array(z.any()), z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === null || value === undefined) {
      return undefined
    }

    if (Array.isArray(value)) {
      const cleaned = value
        .map((item) => (typeof item === 'string' ? item.trim() : String(item).trim()))
        .filter((item) => item.length > 0)
      return cleaned.length > 0 ? cleaned : undefined
    }

    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (!trimmed) {
        return undefined
      }

      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) {
          const cleaned = parsed
            .map((item) => (typeof item === 'string' ? item.trim() : String(item).trim()))
            .filter((item) => item.length > 0)

          return cleaned.length > 0 ? cleaned : undefined
        }
      } catch {
        return [trimmed]
      }

      return [trimmed]
    }

    return undefined
  })

export const UserRecordSchema = z
  .object({
    id: z.union([z.number().int(), z.string()]).optional(),
    email: stringWithFallback().transform((email) => email.toLowerCase()),
    password_hash: stringWithFallback(),
    display_name: stringWithFallback(),
    uid: stringWithFallback(),
    role: z.enum(RoleEnum),
    created_at: timestampSchema,
    updated_at: timestampSchema,
    external_id: optionalString(),
    assigned_restaurants: assignedRestaurantsSchema.optional(),
  })
  .passthrough()

export type UserRecord = z.infer<typeof UserRecordSchema>
