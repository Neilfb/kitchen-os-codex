import { describe, expect, it } from 'vitest'

import sampleResponse from '../fixtures/ncdb/assignments/sample.json'
import { UserRestaurantAssignmentSchema } from '@/types/ncdb/userRestaurantAssignment'

describe('NCDB assignments contract', () => {
  it('parses assignment payloads with extra fields', () => {
    const payload = sampleResponse.data
    expect(Array.isArray(payload)).toBe(true)

    const parsed = UserRestaurantAssignmentSchema.array().parse(payload)

    expect(parsed[0]).toMatchObject({
      id: 901,
      user_id: 42,
      restaurant_id: 55,
      role: 'manager',
    })
  })
})
