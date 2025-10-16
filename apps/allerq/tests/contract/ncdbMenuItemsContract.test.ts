import { describe, expect, it } from 'vitest'

import sampleResponse from '../fixtures/ncdb/menuItems/sample.json'
import { MenuItemRecordSchema } from '@/types/ncdb/menu'

describe('NCDB menu item contract', () => {
  it('parses sample menu item payloads with nullish fields', () => {
    const payload = sampleResponse.data

    expect(Array.isArray(payload)).toBe(true)

    const parsed = MenuItemRecordSchema.array().parse(payload)

    expect(parsed[0]).toMatchObject({
      id: 501,
      menu_id: 148,
      restaurant_id: 55,
      name: 'Fallback Dish',
      description: '',
      price: 1.23,
      category: undefined,
      allergens: undefined,
      dietary: undefined,
      is_active: 1,
      ai_processed: undefined,
      manual_override: false,
      category_id: undefined,
      ai_confidence: undefined,
      ai_needs_review: 0,
    })
  })
})
