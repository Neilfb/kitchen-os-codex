import axios from 'axios'
import bcrypt from 'bcryptjs'

import { NCDB_API_KEY, NCDB_SECRET_KEY, buildNcdbUrl, extractNcdbError, type NcdbResponse } from './constants'
import type { UserRecord } from './types'

export interface UpdateUserInput {
  id: number
  email?: string
  fullName?: string
  role?: string
  assignedRestaurants?: string | string[]
  password?: string
}

export async function updateUser({
  id,
  email,
  fullName,
  role,
  assignedRestaurants,
  password,
}: UpdateUserInput): Promise<UserRecord> {
  const updates: Record<string, unknown> = {
    secret_key: NCDB_SECRET_KEY,
    record_id: id,
  }

  if (typeof email === 'string') {
    updates.email = email.trim().toLowerCase()
  }

  if (typeof fullName === 'string') {
    updates.display_name = fullName.trim()
  }

  if (typeof role === 'string') {
    updates.role = role.trim().toLowerCase()
  }

  if (Array.isArray(assignedRestaurants)) {
    updates.assigned_restaurants = JSON.stringify(assignedRestaurants)
  } else if (typeof assignedRestaurants === 'string') {
    updates.assigned_restaurants = assignedRestaurants
  }

  if (typeof password === 'string' && password.trim()) {
    const hashedPassword = password.startsWith('$2') ? password : await bcrypt.hash(password, 10)
    updates.uid = hashedPassword
    updates.password_hash = hashedPassword
  }

  try {
    const response = await axios<NcdbResponse<UserRecord>>({
      method: 'post',
      url: buildNcdbUrl('/update/users'),
      headers: {
        Authorization: `Bearer ${NCDB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: updates,
    })

    if (response.data.status === 'success' && response.data.data) {
      return response.data.data
    }

    throw new Error('Failed to update user')
  } catch (error) {
    throw extractNcdbError(error)
  }
}
