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
  const userRecord = await getUserByEmail({ email })

  if (!userRecord) {
    throw new Error('User not found')
  }

  const passwordMatch = await bcrypt.compare(password, userRecord.uid)

  if (!passwordMatch) {
    throw new Error('Invalid password')
  }

  const requiredFields = ['id', 'email', 'uid', 'display_name', 'role'] as const

  const missing = requiredFields.filter((field) => {
    const value = userRecord[field]
    return value === undefined || value === null || (typeof value === 'string' && !value.trim())
  })

  if (missing.length > 0) {
    throw new Error(`User record missing required fields: ${missing.join(', ')}`)
  }

  const user: User = {
    id: Number(userRecord.id),
    email: String(userRecord.email),
    uid: String(userRecord.uid),
    display_name: String(userRecord.display_name),
    role: String(userRecord.role),
    assigned_restaurants: typeof userRecord.assigned_restaurants === 'string' ? userRecord.assigned_restaurants : '',
    created_at: typeof userRecord.created_at === 'number' ? userRecord.created_at : Date.now(),
    updated_at: typeof userRecord.updated_at === 'number' ? userRecord.updated_at : Date.now(),
    external_id: typeof userRecord.external_id === 'string' ? userRecord.external_id : '',
  }

  // ✅ Validated NCDB record mapped to User
  return user
}
