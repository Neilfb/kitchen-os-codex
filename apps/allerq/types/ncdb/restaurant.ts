import { z } from 'zod'

export const RestaurantRecordSchema = z.object({
  id: z.union([z.number(), z.string()]),
  name: z.string().min(1),
  description: z.string().optional().default(''),
  address: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  email: z.string().email().optional(),
  website: z.string().optional(),
  cuisine_type: z.string().optional(),
  owner_id: z.string().min(1),
  logo: z.string().optional(),
  cover_image: z.string().optional(),
  is_active: z.union([z.number(), z.boolean()]).optional().default(1),
  created_at: z.union([z.number(), z.string()]).transform((value) => Number(value)),
  updated_at: z.union([z.number(), z.string()]).transform((value) => Number(value)),
  external_id: z.string().optional(),
})

export type RestaurantRecord = z.infer<typeof RestaurantRecordSchema>
