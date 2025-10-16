import { ensureParseSuccess } from './constants'
import { ncdbRequest, isNcdbSuccess, getNcdbErrorMessage } from './client'
import {
  UserRestaurantAssignmentSchema,
  type UserRestaurantAssignment,
} from '@/types/ncdb/userRestaurantAssignment'

export interface AssignmentQueryOptions {
  userId?: number
  restaurantId?: number | string
  role?: 'owner' | 'manager'
}

const AssignmentsArraySchema = UserRestaurantAssignmentSchema.array()

export async function getUserRestaurantAssignments(options: AssignmentQueryOptions = {}): Promise<UserRestaurantAssignment[]> {
  const payload: Record<string, unknown> = {}

  if (typeof options.userId === 'number') {
    payload.user_id = options.userId
  }

  if (options.restaurantId !== undefined) {
    payload.restaurant_id = Number(options.restaurantId)
  }

  if (options.role) {
    payload.role = options.role
  }

  const { body } = await ncdbRequest<UserRestaurantAssignment | UserRestaurantAssignment[]>({
    endpoint: '/search/user_restaurant_assignments',
    payload,
    context: 'assignment.list',
  })

  if (isNcdbSuccess(body) && body.data) {
    const records = Array.isArray(body.data) ? body.data : [body.data]
    return ensureParseSuccess(AssignmentsArraySchema, records, 'userRestaurantAssignments records')
  }

  if (isNcdbSuccess(body)) {
    return []
  }

  throw new Error(getNcdbErrorMessage(body) || 'Failed to fetch assignments')
}

export interface CreateAssignmentInput {
  userId: number
  restaurantId: number
  role: 'owner' | 'manager'
}

export async function createUserRestaurantAssignment({
  userId,
  restaurantId,
  role,
}: CreateAssignmentInput): Promise<UserRestaurantAssignment> {
  const payload = {
    user_id: userId,
    restaurant_id: restaurantId,
    role,
    created_at: Date.now(),
    updated_at: Date.now(),
  }

  const { body } = await ncdbRequest<UserRestaurantAssignment>({
    endpoint: '/create/user_restaurant_assignments',
    payload,
    context: 'assignment.create',
  })

  if (isNcdbSuccess(body) && body.data) {
    return ensureParseSuccess(UserRestaurantAssignmentSchema, body.data, 'createUserRestaurantAssignment response')
  }

  throw new Error(getNcdbErrorMessage(body) || 'Failed to create user assignment')
}
