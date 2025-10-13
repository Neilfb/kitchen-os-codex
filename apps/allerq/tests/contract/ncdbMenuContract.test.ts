import { describe, expect, it } from 'vitest'

import sampleResponse from '../fixtures/ncdb/menus/sample.json'
import { MenuRecordSchema } from '@/types/ncdb/menu'

describe('NCDB menu contract', () => {
  it('parses sample menu payloads with extra fields', () => {
    const payload = sampleResponse.data

    expect(Array.isArray(payload)).toBe(true)

    const parsed = MenuRecordSchema.array().parse(payload)

    expect(parsed[0]).toMatchObject({
      id: 101,
      name: 'Summer Menu',
      restaurant_id: 55,
    })
  })
})
