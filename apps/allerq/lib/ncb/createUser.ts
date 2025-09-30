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

type AllowedRole = 'admin' | 'manager' | 'superadmin'

interface CreateUserPayload {
  email: string
  password_hash: string
  display_name?: string
  role: AllowedRole
  secret_key: string
  uid: string
  external_id?: string
  assigned_restaurants?: string
}

const ALLOWED_ROLES: AllowedRole[] = ['admin', 'manager', 'superadmin']

export async function createUser({
  fullName,
  email,
  password,
  role = 'manager',
  assignedRestaurants,
}: CreateUserInput): Promise<UserRecord> {
  const trimmedName = fullName.trim()
  if (!trimmedName) {
    throw new Error('Full name is required to create a user')
  }

  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail) {
    throw new Error('Email is required to create a user')
  }

  const hashedPassword = password.startsWith('$2') ? password : await bcrypt.hash(password, 10)

  const normalizedRoleInput =
    typeof role === 'string' && role.trim() ? role.trim().toLowerCase() : 'manager'
  const roleValue: AllowedRole = ALLOWED_ROLES.includes(normalizedRoleInput as AllowedRole)
    ? (normalizedRoleInput as AllowedRole)
    : 'manager'

  const assignedRestaurantsValue = Array.isArray(assignedRestaurants)
    ? JSON.stringify(assignedRestaurants)
    : assignedRestaurants ?? ''

  const payload: CreateUserPayload = {
    email: normalizedEmail,
    password_hash: hashedPassword,
    display_name: trimmedName,
    role: roleValue,
    secret_key: NCDB_SECRET_KEY,
    uid: hashedPassword,
    external_id: `user_${Date.now()}`,
    assigned_restaurants: assignedRestaurantsValue,
  }

  if (!payload.email || !payload.password_hash || !payload.role || !payload.secret_key || !payload.uid) {
    console.error('❌ createUser validation failed. Payload:', {
      ...payload,
      password_hash: '*****',
      secret_key: '********',
      uid: '*****',
    })
    throw new Error('Missing required field(s) in createUser payload')
  }

  const maskedPayload = {
    ...payload,
    password_hash: '*****',
    secret_key: '********',
    uid: '*****',
  }

  console.log('🔍 Sending payload to NCDB:', maskedPayload)

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
      console.log('✅ createUser response', {
        status: response.data.status,
        data: response.data.data ? { id: response.data.data.id, email: response.data.data.email } : null,
      })
      return response.data.data
    }

    console.error('❌ createUser unexpected response', response.data)
    throw new Error('Failed to create user')
  } catch (error) {
    if (axios.isAxiosError?.(error) && error.response?.data) {
      console.error('❌ createUser NCDB error response', error.response.data)
    }
    throw extractNcdbError(error)
  }
}
