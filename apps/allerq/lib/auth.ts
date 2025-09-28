import bcrypt from 'bcryptjs'

import { getUserByEmail } from './ncb/getUserByEmail'

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
  const user = await getUserByEmail({ email })

  if (!user) {
    throw new Error('User not found')
  }

  const passwordMatch = await bcrypt.compare(password, user.uid)

  if (!passwordMatch) {
    throw new Error('Invalid password')
  }

  return user
}
