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

type AllowedRole = 'admin' | 'manager' | 'user'

interface CreateUserPayload {
  email: string
  password: string
  display_name: string
  uid: string
  role: AllowedRole
  secret_key: string
}

const ALLOWED_ROLES: AllowedRole[] = ['admin', 'manager', 'user']

export async function createUser({
  fullName,
  email,
  password,
  role = 'user',
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
    typeof role === 'string' && role.trim() ? role.trim().toLowerCase() : 'user'
  const roleValue: AllowedRole = ALLOWED_ROLES.includes(normalizedRoleInput as AllowedRole)
    ? (normalizedRoleInput as AllowedRole)
    : 'user'

  const payload: CreateUserPayload = {
    email: normalizedEmail,
    password: hashedPassword,
    display_name: trimmedName,
    uid: hashedPassword,
    role: roleValue,
    secret_key: NCDB_SECRET_KEY,
  }

  if (
    !payload.email ||
    !payload.password ||
    !payload.display_name ||
    !payload.uid ||
    !payload.role ||
    !payload.secret_key
  ) {
    console.error('❌ createUser validation failed. Payload:', {
      ...payload,
      secret_key: '********',
    })
    throw new Error('Missing required field(s) in createUser payload')
  }

  const maskedPayload = {
    ...payload,
    password: '*****',
    uid: '*****',
    secret_key: '********',
  }

  console.log('🔍 Sending payload to NCDB:', maskedPayload)

  const assignedRestaurantsValue = Array.isArray(assignedRestaurants)
    ? JSON.stringify(assignedRestaurants)
    : assignedRestaurants ?? ''

  const requestBody = {
    ...payload,
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
      data: requestBody,
    })

    if (response.data.status === 'success' && response.data.data) {
      return response.data.data
    }

    throw new Error('Failed to create user')
  } catch (error) {
    throw extractNcdbError(error)
  }
}
