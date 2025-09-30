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
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('A valid user id is required to update a user')
  }

  const updates: Record<string, unknown> = {
    secret_key: NCDB_SECRET_KEY,
    record_id: id,
  }

  if (typeof email === 'string' && email.trim()) {
    updates.email = email.trim().toLowerCase()
  }

  if (typeof fullName === 'string' && fullName.trim()) {
    updates.display_name = fullName.trim()
  }

  if (typeof role === 'string' && role.trim()) {
    const normalizedRole = role.trim().toLowerCase()
    updates.role = normalizedRole
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

  const updatableKeys = Object.keys(updates).filter(
    (key) => !['secret_key', 'record_id'].includes(key)
  )

  if (updatableKeys.length === 0) {
    throw new Error('No updates supplied for user record')
  }

  const sanitizedLog = {
    ...updates,
    secret_key: '********',
    uid: updates.uid ? '*****' : undefined,
    password_hash: updates.password_hash ? '*****' : undefined,
  }

  console.log('[updateUser] sending payload', sanitizedLog)

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
