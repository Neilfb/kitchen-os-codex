import bcrypt from 'bcryptjs'
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

if (process.env.NEXTAUTH_SECRET === undefined) {
  console.warn('[next-auth] NEXTAUTH_SECRET missing in process.env')
}
if (process.env.NEXTAUTH_URL === undefined) {
  console.warn('[next-auth] NEXTAUTH_URL missing in process.env')
}

import { getUserByEmail } from '@/lib/ncb/getUserByEmail'
import {
  buildSessionUser,
  listCapabilitiesForRole,
  normalizeAssignedRestaurants,
  sanitizeCapabilities,
} from '@/lib/auth/permissions'
import type { Capability, Role } from '@/types/user'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.warn('[next-auth] Missing credentials', credentials)
          throw new Error('Email and password are required')
        }

        const user = await getUserByEmail({ email: credentials.email })
        if (!user?.uid) {
          console.warn('[next-auth] User not found or missing UID hash', credentials.email)
          throw new Error('Invalid credentials')
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.uid)
        if (!isPasswordValid) {
          console.warn('[next-auth] Password mismatch for', credentials.email)
          throw new Error('Invalid credentials')
        }

        const sessionUser = buildSessionUser({
          id: String(user.id ?? user.email),
          email: user.email,
          name: user.display_name,
          role: user.role as Role,
          assignedRestaurants: user.assigned_restaurants,
        })

        return {
          id: sessionUser.id,
          email: sessionUser.email,
          name: sessionUser.name,
          role: sessionUser.role,
          assignedRestaurants: sessionUser.assignedRestaurants,
          capabilities: sessionUser.capabilities,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/sign-in',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const role = (user.role as Role) ?? 'manager'
        token.role = role
        token.assignedRestaurants = normalizeAssignedRestaurants(user.assignedRestaurants)
        token.capabilities = sanitizeCapabilities(user.capabilities, role)
      } else {
        const role = (token.role as Role) ?? 'manager'
        token.assignedRestaurants = normalizeAssignedRestaurants(token.assignedRestaurants)
        token.capabilities = sanitizeCapabilities(token.capabilities, role)
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        const role = (token.role as Role) ?? 'manager'
        session.user.role = role
        session.user.assignedRestaurants = normalizeAssignedRestaurants(token.assignedRestaurants)
        session.user.capabilities = sanitizeCapabilities(token.capabilities, role)
      }
      return session
    },
  },
}
