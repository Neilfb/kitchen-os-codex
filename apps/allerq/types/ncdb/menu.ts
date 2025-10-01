import { z } from 'zod'

export const MenuRecordSchema = z.object({
  id: z.union([z.number(), z.string()]),
  name: z.string(),
  description: z.string().optional().default(''),
  restaurant_id: z.union([z.number(), z.string()]).transform((value) => Number(value)),
  created_by: z.string().optional(),
  created_at: z.union([z.number(), z.string()]).transform((value) => Number(value)),
  updated_at: z.union([z.number(), z.string()]).transform((value) => Number(value)),
  external_id: z.string().optional(),
  menu_type: z.string().optional(),
  is_active: z.union([z.number(), z.boolean()]).optional().default(1),
  ai_processed: z.union([z.number(), z.boolean()]).optional(),
  upload_file_name: z.string().optional(),
})

export type MenuRecord = z.infer<typeof MenuRecordSchema>

export const MenuItemRecordSchema = z.object({
  id: z.union([z.number(), z.string()]),
  menu_id: z.union([z.number(), z.string()]).transform((value) => Number(value)),
  restaurant_id: z.union([z.number(), z.string()]).transform((value) => Number(value)),
  name: z.string(),
  description: z.string().optional().default(''),
  price: z.union([z.number(), z.string()]).transform((value) => Number(value)),
  category: z.string().optional(),
  allergens: z.string().optional(),
  dietary: z.string().optional(),
  created_at: z.union([z.number(), z.string()]).transform((value) => Number(value)),
  updated_at: z.union([z.number(), z.string()]).transform((value) => Number(value)),
  external_id: z.string().optional(),
  ai_confidence: z.union([z.number(), z.string()]).optional(),
  manual_override: z.union([z.number(), z.boolean()]).optional(),
  category_id: z.union([z.number(), z.string()]).optional(),
  is_active: z.union([z.number(), z.boolean()]).optional(),
  ai_processed: z.union([z.number(), z.boolean()]).optional(),
  ai_needs_review: z.union([z.number(), z.boolean()]).optional(),
})

export type MenuItemRecord = z.infer<typeof MenuItemRecordSchema>
