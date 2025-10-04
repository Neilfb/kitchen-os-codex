import axios from 'axios'
import bcrypt from 'bcryptjs'
import { NCDB_API_KEY, NCDB_SECRET_KEY, buildNcdbUrl, ensureParseSuccess, extractNcdbError } from './constants'
import { RoleEnum, UserRecordSchema, type UserRecord } from '@/types/ncdb/user'
import type { IdPayload } from '@/types/ncdb/shared'

export interface UpdateUserInput extends IdPayload {
  email?: string
  fullName?: string
  role?: string
  assignedRestaurants?: string | string[]
  password?: string
}

const UpdateUserSchema = UserRecordSchema.pick({
  email: true,
  display_name: true,
  role: true,
  assigned_restaurants: true,
  password_hash: true,
  uid: true,
}).partial()

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

  const updates: Partial<UserRecord> = {}

  if (typeof email === 'string' && email.trim()) {
    updates.email = email.trim().toLowerCase()
  }

  if (typeof fullName === 'string' && fullName.trim()) {
    updates.display_name = fullName.trim()
  }

  if (typeof role === 'string' && role.trim()) {
    const normalizedRole = role.trim().toLowerCase()
    if (!RoleEnum.includes(normalizedRole as typeof RoleEnum[number])) {
      throw new Error(`Invalid user role "${role}". Allowed roles: ${RoleEnum.join(', ')}`)
    }
    updates.role = normalizedRole as UserRecord['role']
  }

  if (Array.isArray(assignedRestaurants)) {
    const cleaned = assignedRestaurants.map((value) => value.trim()).filter((value) => value.length > 0)
    if (cleaned.length > 0) {
      updates.assigned_restaurants = cleaned
    }
  } else if (typeof assignedRestaurants === 'string' && assignedRestaurants.trim()) {
    updates.assigned_restaurants = [assignedRestaurants.trim()]
  }

  if (typeof password === 'string' && password.trim()) {
    const hashedPassword = password.startsWith('$2') ? password : await bcrypt.hash(password, 10)
    updates.password_hash = hashedPassword
    updates.uid = hashedPassword
  }

  if (Object.keys(updates).length === 0) {
    throw new Error('No updates supplied for user record')
  }

  const validatedUpdates = UpdateUserSchema.parse(updates)

  const payload: Record<string, unknown> = {
    secret_key: NCDB_SECRET_KEY,
    record_id: id,
    updated_at: Date.now(),
    ...validatedUpdates,
  }

  if (!payload.assigned_restaurants) {
    delete payload.assigned_restaurants
  }

  if (!payload.display_name) {
    delete payload.display_name
  }

  if (!payload.password_hash) {
    delete payload.password_hash
    delete payload.uid
  }

  const maskedPayload = {
    ...payload,
    password_hash: payload.password_hash ? '*****' : undefined,
    uid: payload.uid ? '*****' : undefined,
    secret_key: '********',
  }

  console.log('[updateUser] sending payload', maskedPayload)

  try {
    const response = await axios({
      method: 'post',
      url: buildNcdbUrl('/update/users'),
      headers: {
        Authorization: `Bearer ${NCDB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: payload,
    })

    if (response.data.status === 'success' && response.data.data) {
      return ensureParseSuccess(UserRecordSchema, response.data.data, 'updateUser response')
    }

    console.error('[updateUser] unexpected response', response.data)
    throw new Error('Failed to update user')
  } catch (error) {
    if (axios.isAxiosError?.(error) && error.response?.data) {
      console.error('[updateUser] NCDB error response', error.response.data)
    }
    throw extractNcdbError(error)
  }
}
