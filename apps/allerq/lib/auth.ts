import bcrypt from 'bcryptjs'

const API_KEY = '06b2330b6d80051a63bb878f9709e7aa91b9fc5e11aaf519037841d50dc7'
const INSTANCE = '48346_allerq'
const BASE_URL = 'https://api.nocodebackend.com'

export interface User {
  id: number
  email: string
  uid: string // hashed password
  display_name: string
  role: string
  assigned_restaurants: string
  created_at: number
  updated_at: number
  external_id: string
}

export async function loginWithNoCodeBackend(email: string, password: string): Promise<User> {
  const res = await fetch(`${BASE_URL}/read/users?Instance=${INSTANCE}`, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    }
  })

  const data = await res.json()

  if (!res.ok || data.status !== 'success') {
    throw new Error('Unable to connect to user database.')
  }

  const users: User[] = data.data

  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase())

  if (!user) {
    throw new Error('User not found')
  }

  const passwordMatch = await bcrypt.compare(password, user.uid)

  if (!passwordMatch) {
    throw new Error('Invalid password')
  }

  return user
}
