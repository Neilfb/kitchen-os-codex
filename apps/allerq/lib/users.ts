import axios, { AxiosError } from 'axios'
import bcrypt from 'bcryptjs'

const API_KEY = '06b2330b6d80051a63bb878f9709e7aa91b9fc5e11aaf519037841d50dc7'
const INSTANCE = '48346_allerq'
const BASE_URL = 'https://api.nocodebackend.com'

export type UserRole = 'admin' | 'manager' | 'staff'

export interface CreateUserArgs {
  email: string
  password: string
  displayName: string
  role?: UserRole
}

export interface UserRecord {
  id: number
  uid: string
  email: string
  display_name: string
  role: UserRole
  assigned_restaurants: string
  created_at: number
  updated_at: number
  external_id: string
}

interface NoCodeBackendResponse<T> {
  status: 'success' | 'error'
  data?: T
  message?: string
}

export async function createUser({
  email,
  password,
  displayName,
  role = 'admin'
}: CreateUserArgs): Promise<UserRecord> {
  const normalizedEmail = email.trim().toLowerCase()

  if (!normalizedEmail) {
    throw new Error('Email is required')
  }

  if (!password) {
    throw new Error('Password is required')
  }

  const timestamp = Date.now()
  const externalId = `user_${timestamp}_${Math.random().toString(36).slice(2, 8)}`

  try {
    const hashedPassword = await bcrypt.hash(password, 10)

    const response = await axios.post<NoCodeBackendResponse<UserRecord | UserRecord[]>>(
      `${BASE_URL}/create/users`,
      {
        secret_key: API_KEY,
        email: normalizedEmail,
        uid: hashedPassword,
        display_name: displayName,
        role,
        assigned_restaurants: '',
        created_at: timestamp,
        updated_at: timestamp,
        external_id: externalId
      },
      {
        params: { Instance: INSTANCE },
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const payload = response.data

    if (payload.status !== 'success' || !payload.data) {
      const fallbackMessage = payload.message ?? 'Failed to create user'
      throw new Error(fallbackMessage)
    }

    const record = Array.isArray(payload.data) ? payload.data[0] : payload.data

    if (!record) {
      throw new Error('User creation succeeded but no user data was returned')
    }

    return record
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const apiMessage =
        error.response?.data && typeof error.response.data === 'object'
          ? (error.response.data as { message?: string }).message
          : undefined
      const message = apiMessage ?? error.message ?? 'Unable to create user right now'
      throw new Error(message)
    }

    if (error instanceof Error) {
      throw error
    }

    throw new Error('Unable to create user right now')
  }
}
