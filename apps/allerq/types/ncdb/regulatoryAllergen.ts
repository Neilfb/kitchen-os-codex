import { z } from 'zod'

import { jsonField } from './json'

export const RegulatoryAllergenRecordSchema = z
  .object({
    id: z.union([z.number(), z.string()]),
    region: z.string(),
    code: z.string(),
    label: z.string(),
    icon: z.string().optional(),
    description: z.string().optional(),
    required: z.union([z.boolean(), z.number()]).transform((value) => value === 1 || value === true).optional(),
    priority: z.union([z.number(), z.string()]).transform((value) => Number(value)).optional(),
    reference_url: z.string().optional(),
    locale_labels: jsonField(
      z
        .record(
          z.string(),
          z.object({
            label: z.string().optional(),
            description: z.string().optional(),
          })
        )
        .default({}),
      () => ({})
    ).optional(),
    created_at: z.union([z.number(), z.string()]).transform((value) => Number(value)),
    updated_at: z.union([z.number(), z.string()]).transform((value) => Number(value)),
  })
  .strict()

export type RegulatoryAllergenRecord = z.infer<typeof RegulatoryAllergenRecordSchema>
