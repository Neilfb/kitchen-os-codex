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

    expect(parsed[1]).toMatchObject({
      id: '202',
      name: 'Winter Menu',
      description: '',
      restaurant_id: 55,
      created_by: undefined,
      menu_type: undefined,
      is_active: 1,
      ai_processed: undefined,
      upload_file_name: undefined,
      source_upload_id: undefined,
    })
  })
})
