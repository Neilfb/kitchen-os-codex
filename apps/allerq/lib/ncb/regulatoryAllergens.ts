import axios from 'axios'
import { z } from 'zod'

import {
  NCDB_API_KEY,
  NCDB_SECRET_KEY,
  buildNcdbUrl,
  ensureParseSuccess,
  extractNcdbError,
} from './constants'
import { RegulatoryAllergenRecordSchema, type RegulatoryAllergenRecord } from '@/types/ncdb/regulatoryAllergen'

const RegulatoryAllergenArraySchema = z.array(RegulatoryAllergenRecordSchema)

export interface GetRegulatoryAllergensOptions {
  region?: string
  code?: string
  limit?: number
  offset?: number
}

export async function getRegulatoryAllergens(
  options: GetRegulatoryAllergensOptions = {}
): Promise<RegulatoryAllergenRecord[]> {
  const payload: Record<string, unknown> = {
    secret_key: NCDB_SECRET_KEY,
  }

  if (options.region) {
    payload.region = options.region
  }
  if (options.code) {
    payload.code = options.code
  }
  if (typeof options.limit === 'number') payload.limit = options.limit
  if (typeof options.offset === 'number') payload.offset = options.offset

  console.log('[getRegulatoryAllergens] request payload', {
    ...payload,
    secret_key: '********',
  })

  try {
    const response = await axios({
      method: 'post',
      url: buildNcdbUrl('/search/regulatory_allergens'),
      headers: {
        Authorization: `Bearer ${NCDB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: payload,
    })

    if (response.data?.status === 'success' && response.data?.data) {
      const records = Array.isArray(response.data.data) ? response.data.data : [response.data.data]
      return ensureParseSuccess(RegulatoryAllergenArraySchema, records, 'getRegulatoryAllergens records')
    }

    if (response.data?.status === 'success') {
      return []
    }

    console.error('[getRegulatoryAllergens] unexpected response', response.data)
    throw new Error('Failed to fetch regulatory allergens')
  } catch (error) {
    if (axios.isAxiosError?.(error) && error.response?.data) {
      console.error('[getRegulatoryAllergens] NCDB error response', error.response.data)
    }
    throw extractNcdbError(error)
  }
}
