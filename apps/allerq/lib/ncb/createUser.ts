'use server'

import axios from 'axios'
import bcrypt from 'bcryptjs'

import {
  NCDB_API_KEY,
  NCDB_SECRET_KEY,
  buildNcdbUrl,
  extractNcdbError,
  type NcdbResponse,
} from './constants'
import type { UserRecord } from './types'

export interface CreateUserInput {
  fullName: string
  email: string
  password: string
  role?: string
  assignedRestaurants?: string | string[]
}

export async function createUser({
  fullName,
  email,
  password,
  role = 'staff',
  assignedRestaurants,
}: CreateUserInput): Promise<UserRecord> {
  const normalizedEmail = email.trim().toLowerCase()

  const hashedPassword = password.startsWith('$2') ? password : await bcrypt.hash(password, 10)

  const assignedRestaurantsValue = Array.isArray(assignedRestaurants)
    ? JSON.stringify(assignedRestaurants)
    : assignedRestaurants ?? ''

  const payload = {
    secret_key: NCDB_SECRET_KEY,
    email: normalizedEmail,
    uid: hashedPassword,
    display_name: fullName,
    role,
    assigned_restaurants: assignedRestaurantsValue,
    external_id: `user_${Date.now()}`,
    password_hash: hashedPassword,
  }

  try {
    const response = await axios<NcdbResponse<UserRecord>>({
      method: 'post',
      url: buildNcdbUrl('/create/users'),
      headers: {
        Authorization: `Bearer ${NCDB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: payload,
    })

    if (response.data.status === 'success' && response.data.data) {
      return response.data.data
    }

    throw new Error('Failed to create user')
  } catch (error) {
    throw extractNcdbError(error)
  }
}
