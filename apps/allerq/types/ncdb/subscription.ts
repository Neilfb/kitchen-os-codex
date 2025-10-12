import { z } from 'zod'

import { jsonField } from './json'

export const SubscriptionProviderSchema = z.enum(['stripe', 'gocardless'])
export type SubscriptionProvider = z.infer<typeof SubscriptionProviderSchema>

export const SubscriptionStatusSchema = z.enum([
  'active',
  'trialing',
  'past_due',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'unpaid',
  'scheduled',
  'paused',
])
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>

export const SubscriptionRecordSchema = z
  .object({
    id: z.union([z.number(), z.string()]),
    restaurant_id: z.union([z.number(), z.string()]).transform((value) => Number(value)),
    location_code: z.string().optional(),
    provider: SubscriptionProviderSchema,
    provider_customer_id: z.string(),
    provider_subscription_id: z.string(),
    plan: z.string(),
    interval: z.enum(['month', 'year']).optional(),
    amount_minor_units: z.union([z.number(), z.string()]).transform((value) => Number(value)),
    currency: z.string().default('GBP'),
    status: SubscriptionStatusSchema,
    trial_end: z
      .union([z.number(), z.string(), z.null(), z.undefined()])
      .transform((value) => {
        if (value === null || value === undefined || value === '') return undefined
        return Number(value)
      })
      .optional(),
    renews_at: z
      .union([z.number(), z.string(), z.null(), z.undefined()])
      .transform((value) => {
        if (value === null || value === undefined || value === '') return undefined
        return Number(value)
      })
      .optional(),
    canceled_at: z
      .union([z.number(), z.string(), z.null(), z.undefined()])
      .transform((value) => {
        if (value === null || value === undefined || value === '') return undefined
        return Number(value)
      })
      .optional(),
    location_count: z.union([z.number(), z.string()]).transform((value) => Number(value)).optional(),
    metadata: jsonField(z.record(z.string(), z.unknown()).default({}), () => ({})).optional(),
    created_at: z.union([z.number(), z.string()]).transform((value) => Number(value)),
    updated_at: z.union([z.number(), z.string()]).transform((value) => Number(value)),
  })
  .strict()

export type SubscriptionRecord = z.infer<typeof SubscriptionRecordSchema>
