import { z } from 'zod'

import { ensureParseSuccess } from './constants'
import { ncdbRequest, isNcdbSuccess, getNcdbErrorMessage } from './client'
import {
  SubscriptionProviderSchema,
  SubscriptionRecordSchema,
  SubscriptionStatusSchema,
  type SubscriptionProvider,
  type SubscriptionRecord,
  type SubscriptionStatus,
} from '@/types/ncdb/subscription'

const SubscriptionArraySchema = z.array(SubscriptionRecordSchema)

const CreateSubscriptionSchema = z.object({
  restaurant_id: z.union([z.number(), z.string()]).transform((value) => Number(value)),
  location_code: z.string().optional(),
  provider: SubscriptionProviderSchema,
  provider_customer_id: z.string(),
  provider_subscription_id: z.string(),
  plan: z.string(),
  interval: z.enum(['month', 'year']),
  amount_minor_units: z.union([z.number(), z.string()]).transform((value) => Number(value)),
  currency: z.string().default('GBP'),
  status: SubscriptionStatusSchema.default('active'),
  trial_end: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional(),
  renews_at: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional(),
  canceled_at: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional(),
  location_count: z.union([z.number(), z.string()]).transform((value) => Number(value)).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export type CreateSubscriptionInput = z.infer<typeof CreateSubscriptionSchema>

export async function createSubscriptionRecord(input: CreateSubscriptionInput): Promise<SubscriptionRecord> {
  const parsed = CreateSubscriptionSchema.parse(input)
  const timestamp = Date.now()

  const payload: Record<string, unknown> = {
    restaurant_id: parsed.restaurant_id,
    location_code: parsed.location_code,
    provider: parsed.provider,
    provider_customer_id: parsed.provider_customer_id,
    provider_subscription_id: parsed.provider_subscription_id,
    plan: parsed.plan,
    interval: parsed.interval,
    amount_minor_units: parsed.amount_minor_units,
    currency: parsed.currency,
    status: parsed.status,
    trial_end: parsed.trial_end ?? undefined,
    renews_at: parsed.renews_at ?? undefined,
    canceled_at: parsed.canceled_at ?? undefined,
    location_count: parsed.location_count,
    created_at: timestamp,
    updated_at: timestamp,
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

  console.log('[createSubscriptionRecord] sending payload', {
    ...payload,
  })

  const { body } = await ncdbRequest<SubscriptionRecord>({
    endpoint: '/create/subscriptions',
    payload,
    context: 'subscription.create',
  })

  if (isNcdbSuccess(body) && body.data) {
    return ensureParseSuccess(SubscriptionRecordSchema, body.data, 'createSubscriptionRecord response')
  }

  if (isNcdbSuccess(body) && body.id) {
    const fallbackRecord = {
      id: body.id,
      restaurant_id: parsed.restaurant_id,
      location_code: parsed.location_code,
      provider: parsed.provider,
      provider_customer_id: parsed.provider_customer_id,
      provider_subscription_id: parsed.provider_subscription_id,
      plan: parsed.plan,
      interval: parsed.interval,
      amount_minor_units: parsed.amount_minor_units,
      currency: parsed.currency,
      status: parsed.status,
      trial_end: parsed.trial_end ?? undefined,
      renews_at: parsed.renews_at ?? undefined,
      canceled_at: parsed.canceled_at ?? undefined,
      location_count: parsed.location_count,
      created_at: timestamp,
      updated_at: timestamp,
    }

    return ensureParseSuccess(SubscriptionRecordSchema, fallbackRecord, 'createSubscriptionRecord fallback record')
  }

  throw new Error(getNcdbErrorMessage(body) || 'Failed to create subscription record')
}

export interface GetSubscriptionsOptions {
  restaurantId?: number
  provider?: SubscriptionProvider
  status?: SubscriptionStatus | SubscriptionStatus[]
  locationCode?: string
}

export async function getSubscriptions(options: GetSubscriptionsOptions = {}): Promise<SubscriptionRecord[]> {
  const payload: Record<string, unknown> = {}

  if (typeof options.restaurantId === 'number') {
    payload.restaurant_id = options.restaurantId
  }
  if (options.provider) {
    payload.provider = options.provider
  }
  if (options.locationCode) {
    payload.location_code = options.locationCode
  }
  if (Array.isArray(options.status)) {
    payload.status = options.status
  } else if (options.status) {
    payload.status = options.status
  }

  console.log('[getSubscriptions] request payload', payload)

  const { body } = await ncdbRequest<SubscriptionRecord | SubscriptionRecord[]>({
    endpoint: '/search/subscriptions',
    payload,
    context: 'subscription.list',
  })

  if (isNcdbSuccess(body) && body.data) {
    const records = Array.isArray(body.data) ? body.data : [body.data]
    return ensureParseSuccess(SubscriptionArraySchema, records, 'getSubscriptions records')
  }

  if (isNcdbSuccess(body)) {
    return []
  }

  throw new Error(getNcdbErrorMessage(body) || 'Failed to fetch subscriptions')
}

const UpdateSubscriptionSchema = z
  .object({
    status: SubscriptionStatusSchema.optional(),
    interval: z.enum(['month', 'year']).optional(),
    amount_minor_units: z.union([z.number(), z.string()]).transform((value) => Number(value)).optional(),
    currency: z.string().optional(),
    trial_end: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional(),
    renews_at: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional(),
    canceled_at: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional(),
    location_count: z.union([z.number(), z.string()]).transform((value) => Number(value)).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update a subscription record',
  })

export type UpdateSubscriptionInput = { id: number } & z.infer<typeof UpdateSubscriptionSchema>

export async function updateSubscriptionRecord({
  id,
  ...updates
}: UpdateSubscriptionInput): Promise<SubscriptionRecord> {
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('A valid subscription id is required')
  }

  const parsedUpdates = UpdateSubscriptionSchema.parse(updates)

  const payload: Record<string, unknown> = {
    record_id: id,
    updated_at: Date.now(),
    ...parsedUpdates,
  }

  if (payload.metadata && typeof payload.metadata === 'object') {
    payload.metadata = JSON.stringify(payload.metadata)
  }

  if (payload.trial_end === null) payload.trial_end = undefined
  if (payload.renews_at === null) payload.renews_at = undefined
  if (payload.canceled_at === null) payload.canceled_at = undefined

  Object.keys(payload).forEach((key) => {
    const value = payload[key]
    if (value === undefined || value === null || value === '') {
      delete payload[key]
    }
  })

  console.log('[updateSubscriptionRecord] sending payload', payload)

  const { body } = await ncdbRequest<SubscriptionRecord>({
    endpoint: '/update/subscriptions',
    payload,
    context: 'subscription.update',
  })

  if (isNcdbSuccess(body) && body.data) {
    return ensureParseSuccess(SubscriptionRecordSchema, body.data, 'updateSubscriptionRecord response')
  }

  throw new Error(getNcdbErrorMessage(body) || 'Failed to update subscription record')
}
