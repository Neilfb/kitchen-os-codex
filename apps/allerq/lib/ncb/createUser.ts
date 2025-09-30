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
import { RoleEnum, UserRecordSchema, type Role, type UserRecord } from '@/types/ncdb/user'

export interface CreateUserInput {
  fullName: string
  email: string
  password: string
  role?: string
  assignedRestaurants?: string | string[]
}

type AllowedRole = Role

const ALLOWED_ROLES = RoleEnum

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
    ? assignedRestaurants.map((value) => value.trim()).filter((value) => value.length > 0)
    : typeof assignedRestaurants === 'string' && assignedRestaurants.trim()
    ? [assignedRestaurants.trim()]
    : undefined

  const now = Date.now()

  const baseRecord = {
    email: normalizedEmail,
    password_hash: hashedPassword,
    display_name: trimmedName,
    uid: hashedPassword,
    role: roleValue,
    created_at: now,
    updated_at: now,
    external_id: `user_${now}`,
    assigned_restaurants: assignedRestaurantsValue,
  }

  const validatedRecord = UserRecordSchema.parse(baseRecord)

  const payload: UserRecord = {
    ...validatedRecord,
    assigned_restaurants: validatedRecord.assigned_restaurants,
  }

  const ncdbPayload: Record<string, unknown> = {
    ...payload,
    secret_key: NCDB_SECRET_KEY,
  }

  if (!ncdbPayload.external_id) {
    delete ncdbPayload.external_id
  }

  if (!payload.assigned_restaurants?.length) {
    delete ncdbPayload.assigned_restaurants
  }

  const maskedPayload = {
    ...ncdbPayload,
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
      data: ncdbPayload,
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
