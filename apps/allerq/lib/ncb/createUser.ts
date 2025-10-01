'use server'

import axios from 'axios'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

import { NCDB_API_KEY, NCDB_SECRET_KEY, buildNcdbUrl, extractNcdbError } from './constants'
import { RoleEnum, UserRecordSchema, type Role } from '@/types/ncdb/user'

export interface CreateUserInput {
  fullName: string
  email: string
  password: string
  role?: string
  assignedRestaurants?: string | string[]
}

const ALLOWED_ROLES = RoleEnum.filter((role): role is Exclude<Role, 'user'> => role !== 'user') as Role[]

function normalizeAssignedRestaurants(input?: string | string[]): string[] | undefined {
  if (Array.isArray(input)) {
    const cleaned = input.map((value) => value.trim()).filter((value) => value.length > 0)
    return cleaned.length > 0 ? cleaned : undefined
  }

  if (typeof input === 'string' && input.trim()) {
    return [input.trim()]
  }

  return undefined
}

function stripEmptyValues<T extends Record<string, unknown>>(payload: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(payload).filter(([_, value]) => value !== undefined && value !== null && value !== '')
  ) as Partial<T>
}

export async function createUser({
  fullName,
  email,
  password,
  role = 'manager',
  assignedRestaurants,
}: CreateUserInput): Promise<boolean> {
  const trimmedName = fullName.trim()
  if (!trimmedName) {
    throw new Error('Full name is required to create a user')
  }

  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail) {
    throw new Error('Email is required to create a user')
  }

  const hashedPassword = password.startsWith('$2') ? password : await bcrypt.hash(password, 10)

  const normalizedRoleInput = role.trim().toLowerCase() as Role
  const roleValue: Role = ALLOWED_ROLES.includes(normalizedRoleInput as Role)
    ? (normalizedRoleInput as Role)
    : 'manager'

  const now = Date.now()

  const assignedRestaurantsValue = normalizeAssignedRestaurants(assignedRestaurants)

  const recordCandidate = {
    email: normalizedEmail,
    password_hash: hashedPassword,
    display_name: trimmedName,
    uid: hashedPassword,
    role: roleValue,
    created_at: now,
    updated_at: now,
    external_id: randomUUID(),
    assigned_restaurants: assignedRestaurantsValue,
  }

  await UserRecordSchema.parseAsync(recordCandidate)

  const payload = stripEmptyValues({
    ...recordCandidate,
    secret_key: NCDB_SECRET_KEY,
  })

  const loggedPayload = {
    ...payload,
    password_hash: '*****',
    uid: '*****',
    secret_key: '********',
  }

  console.log('[DEBUG createUser payload]', loggedPayload)

  try {
    const response = await axios({
      method: 'post',
      url: buildNcdbUrl('/create/users'),
      headers: {
        Authorization: `Bearer ${NCDB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: payload,
    })

    if (response.data?.status === 'success') {
      return true
    }

    console.error('[createUser] unexpected response', response.data)
    throw new Error('Failed to create user')
  } catch (error) {
    if (axios.isAxiosError?.(error) && error.response?.data) {
      console.error('[createUser] NCDB error response', error.response.data)
    }
    throw extractNcdbError(error)
  }
}
