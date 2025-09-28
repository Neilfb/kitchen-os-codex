import bcrypt from 'bcryptjs'

import { getUserByEmail } from '@/lib/ncb/getUserByEmail'

export async function signInUser(email: string, password: string) {
  try {
    const user = await getUserByEmail({ email })
    if (!user) throw new Error('Invalid email or password')

    const passwordMatch = await bcrypt.compare(password, user.uid)
    if (!passwordMatch) throw new Error('Invalid email or password')

    return user
  } catch (error) {
    console.error('[signInUser] error', error)
    throw new Error('Sign-in failed')
  }
}
