import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth/nextAuth'

type RequiredRole = 'superadmin' | 'admin' | 'manager'

export async function getAuthSession() {
  return getServerSession(authOptions)
}

export async function requireAuthSession() {
  const session = await getAuthSession()
  if (!session || !session.user) {
    throw new Error('Authentication required')
  }
  return session
}

export async function requireRole(roles: RequiredRole | RequiredRole[]) {
  const allowed = Array.isArray(roles) ? roles : [roles]
  const session = await requireAuthSession()
  const role = session.user?.role

  if (!role || !allowed.includes(role as RequiredRole)) {
    throw new Error('Insufficient permissions')
  }

  return session
}
