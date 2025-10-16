import { describe, expect, it } from 'vitest'

import sampleResponse from '../fixtures/ncdb/qrCodes/sample.json'
import { QrCodeRecordSchema } from '@/types/ncdb/qrCode'

describe('NCDB QR contract', () => {
  it('parses qr code payloads with extra fields', () => {
    const payload = sampleResponse.data
    expect(Array.isArray(payload)).toBe(true)

    const parsed = QrCodeRecordSchema.array().parse(payload)

    expect(parsed[0]).toMatchObject({
      id: 501,
      restaurant_id: 55,
      menu_id: 101,
      location_code: 'bar-1',
    })
  })
})
