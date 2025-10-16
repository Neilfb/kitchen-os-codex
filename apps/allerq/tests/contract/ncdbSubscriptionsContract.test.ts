import { describe, expect, it } from 'vitest'

import sampleResponse from '../fixtures/ncdb/subscriptions/sample.json'
import { SubscriptionRecordSchema } from '@/types/ncdb/subscription'

describe('NCDB subscriptions contract', () => {
  it('parses subscription payloads with extra fields', () => {
    const payload = sampleResponse.data
    expect(Array.isArray(payload)).toBe(true)

    const parsed = SubscriptionRecordSchema.array().parse(payload)

    expect(parsed[0]).toMatchObject({
      id: 301,
      restaurant_id: 55,
      provider: 'stripe',
      status: 'active',
    })
  })
})
