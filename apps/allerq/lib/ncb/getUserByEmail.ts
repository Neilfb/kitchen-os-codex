import axios, { AxiosError } from 'axios'

const API_KEY = '06b2330b6d80051a63bb878f9709e7aa91b9fc5e11aaf519037841d50dc7'
const INSTANCE = '48346_allerq'
const BASE_URL = 'https://api.nocodebackend.com'

export interface UserRecord {
  id: number
  uid: string
  email: string
  display_name: string
  role: 'admin' | 'manager' | 'staff'
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

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  const normalizedEmail = email.trim().toLowerCase()

  if (!normalizedEmail) {
    throw new Error('Email is required')
  }

  try {
    const response = await axios.get<NoCodeBackendResponse<UserRecord[] | UserRecord>>(
      `${BASE_URL}/read/users`,
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
      const fallbackMessage = payload.message ?? 'Failed to fetch users'
      throw new Error(fallbackMessage)
    }

    const records = Array.isArray(payload.data) ? payload.data : [payload.data]
    const match = records.find((user) => user.email?.toLowerCase() === normalizedEmail) ?? null

    return match
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const apiMessage = extractAxiosMessage(error)
      console.error('Failed to fetch user by email:', apiMessage)
      throw new Error(apiMessage)
    }

    const message = error instanceof Error ? error.message : 'Failed to fetch user.'
    console.error('Failed to fetch user by email:', message)
    throw new Error('Failed to fetch user.')
  }
}

function extractAxiosMessage(error: AxiosError<{ message?: string }>): string {
  if (error.response?.data?.message) return error.response.data.message
  if (error.message) return error.message
  return 'Failed to fetch user.'
}
