import { z } from 'zod'

import { jsonField } from './json'

export const QrCodeRecordSchema = z
  .object({
    id: z.union([z.number(), z.string()]),
    restaurant_id: z.union([z.number(), z.string()]).transform((value) => Number(value)),
    menu_id: z.union([z.number(), z.string()]).transform((value) => Number(value)),
    location_code: z.string().optional(),
    qr_url: z.string(),
    deeplink_url: z.string().optional(),
    download_url: z.string().optional(),
    format: z.string().optional(),
    scan_target_version: z.union([z.number(), z.string()]).transform((value) => Number(value)).optional(),
    last_regenerated_at: z
      .union([z.number(), z.string(), z.null(), z.undefined()])
      .transform((value) => {
        if (value === null || value === undefined || value === '') return undefined
        return Number(value)
      })
      .optional(),
    scan_count: z.union([z.number(), z.string()]).transform((value) => Number(value)).optional(),
    is_active: z.union([z.boolean(), z.number()]).transform((value) => value === 1 || value === true).optional(),
    created_at: z.union([z.number(), z.string()]).transform((value) => Number(value)),
    updated_at: z.union([z.number(), z.string()]).transform((value) => Number(value)),
    metadata: jsonField(z.record(z.string(), z.unknown()).default({}), () => ({})).optional(),
  })
  .strict()

export type QrCodeRecord = z.infer<typeof QrCodeRecordSchema>
