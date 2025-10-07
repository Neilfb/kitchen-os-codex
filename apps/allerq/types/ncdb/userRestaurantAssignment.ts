import { z } from 'zod'

export const UserRestaurantAssignmentSchema = z
  .object({
    id: z.union([z.number().int(), z.string()]).transform((value) => Number(value)),
    user_id: z.union([z.number().int(), z.string()]).transform((value) => Number(value)),
    restaurant_id: z.union([z.number().int(), z.string()]).transform((value) => Number(value)),
    role: z.enum(['owner', 'manager']),
    created_at: z.union([z.number(), z.string()]).transform((value) => Number(value)),
    updated_at: z.union([z.number(), z.string(), z.null(), z.undefined()]).transform((value) =>
      value === null || value === undefined ? undefined : Number(value)
    ),
  })
  .passthrough()

export type UserRestaurantAssignment = z.infer<typeof UserRestaurantAssignmentSchema>
