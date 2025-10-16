import { z } from 'zod'

type JsonFallback<T> = () => T

/**
 * Handles NCDB fields that may be returned as JSON strings or structured objects.
 * Ensures downstream code always receives a validated value (fallback when parsing fails).
 */
export function jsonField<T>(schema: z.ZodType<T>, fallback: T | JsonFallback<T>) {
  const fallbackValue = typeof fallback === 'function' ? (fallback as JsonFallback<T>) : () => fallback

  return z
    .union([z.string(), schema, z.null(), z.undefined()])
    .transform((value) => {
      if (value === null || value === undefined) {
        return fallbackValue()
      }

      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value) as unknown
          const result = schema.safeParse(parsed)
          if (result.success) {
            return result.data
          }
          console.warn('[jsonField] schema validation failed, returning fallback', result.error.flatten())
        } catch (error) {
          console.warn('[jsonField] JSON.parse failed, returning fallback', error)
        }
        return fallbackValue()
      }

      const result = schema.safeParse(value)
      if (result.success) {
        return result.data
      }

      console.warn('[jsonField] input validation failed, returning fallback', result.error.flatten())
      return fallbackValue()
    })
}
