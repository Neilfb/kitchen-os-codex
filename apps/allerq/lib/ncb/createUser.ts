'use server'

import axios from 'axios'
import bcrypt from 'bcryptjs'

import { BASE_URL, INSTANCE, getNcdbCredentials } from './config'

interface CreateUserInput {
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
}: CreateUserInput) {
  const normalizedEmail = email.trim().toLowerCase()

  const { apiKey, secret } = getNcdbCredentials()

  const hashedPassword = await bcrypt.hash(password, 10)
  if (!hashedPassword) {
    throw new Error('Failed to generate password hash')
  }

  const assigned_restaurants = Array.isArray(assignedRestaurants)
    ? JSON.stringify(assignedRestaurants)
    : assignedRestaurants || ''

  const payload = {
    secret_key: secret,
    email: normalizedEmail,
    uid: hashedPassword,
    display_name: fullName,
    role,
    assigned_restaurants,
    external_id: `user_${Date.now()}`,
    password_hash: hashedPassword,
  }

  const url = `${BASE_URL}/create/users?Instance=${INSTANCE}`

  console.log('[createUser] request', {
    url,
    payload: { ...payload, secret_key: '********' },
  })

  try {
    const response = await axios.post(
      url,
      payload,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        transformRequest: [(data) => JSON.stringify(data)],
      }
    )

    if (response.data?.status === 'success') {
      return response.data.data
      }

    throw new Error(response.data?.error || 'Unknown NCDB error')
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status ?? 500
      const data = error.response?.data
      const message =
        (typeof data === 'object' && data && 'message' in data && typeof data.message === 'string'
          ? data.message
          : undefined) || error.message

      console.error('[createUser] axios error', {
        status,
        data,
        message,
      })

      if (error.response) {
        ;(error as any).status = status
        ;(error as any).message = message
      }

      throw error
    }

    console.error('[createUser] unexpected error', error)
    throw error
  }
}
