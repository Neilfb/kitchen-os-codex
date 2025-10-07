import axios from 'axios'

import { NCDB_API_KEY, NCDB_SECRET_KEY, buildNcdbUrl, ensureParseSuccess, extractNcdbError } from './constants'
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
  const payload: Record<string, unknown> = {
    secret_key: NCDB_SECRET_KEY,
  }

  if (typeof options.userId === 'number') {
    payload.user_id = options.userId
  }

  if (options.restaurantId !== undefined) {
    payload.restaurant_id = Number(options.restaurantId)
  }

  if (options.role) {
    payload.role = options.role
  }

  try {
    const response = await axios({
      method: 'post',
      url: buildNcdbUrl('/search/user_restaurant_assignments'),
      headers: {
        Authorization: `Bearer ${NCDB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: payload,
    })

    if (response.data.status === 'success' && response.data.data) {
      const records = Array.isArray(response.data.data) ? response.data.data : [response.data.data]
      return ensureParseSuccess(AssignmentsArraySchema, records, 'userRestaurantAssignments records')
    }

    if (response.data.status === 'success') {
      return []
    }

    console.error('[getUserRestaurantAssignments] unexpected response', response.data)
    throw new Error('Failed to fetch assignments')
  } catch (error) {
    throw extractNcdbError(error)
  }
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
    secret_key: NCDB_SECRET_KEY,
    user_id: userId,
    restaurant_id: restaurantId,
    role,
    created_at: Date.now(),
    updated_at: Date.now(),
  }

  try {
    const response = await axios({
      method: 'post',
      url: buildNcdbUrl('/create/user_restaurant_assignments'),
      headers: {
        Authorization: `Bearer ${NCDB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: payload,
    })

    if (response.data.status === 'success' && response.data.data) {
      return ensureParseSuccess(UserRestaurantAssignmentSchema, response.data.data, 'createUserRestaurantAssignment response')
    }

    console.error('[createUserRestaurantAssignment] unexpected response', response.data)
    throw new Error('Failed to create user assignment')
  } catch (error) {
    throw extractNcdbError(error)
  }
}
