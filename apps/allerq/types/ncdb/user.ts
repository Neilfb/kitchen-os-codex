import { z } from 'zod'

export const RoleEnum = ['admin', 'manager', 'user'] as const
export type Role = (typeof RoleEnum)[number]

export const UserRecordSchema = z.object({
  id: z.union([z.number().int(), z.string()]).optional(),
  email: z.string().email(),
  password_hash: z.string().min(1),
  display_name: z.string().min(1),
  uid: z.string().min(1),
  role: z.enum(RoleEnum),
  created_at: z.number().int(),
  updated_at: z.number().int(),
  external_id: z.string().optional(),
  assigned_restaurants: z.array(z.string()).optional(),
})

export type UserRecord = z.infer<typeof UserRecordSchema>
