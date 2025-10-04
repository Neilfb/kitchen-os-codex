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

        return {
          id: String(user.id ?? user.email),
          email: user.email,
          name: user.display_name ?? user.email,
          role: user.role,
          assignedRestaurants: user.assigned_restaurants ?? [],
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
        token.role = user.role
        token.assignedRestaurants = user.assignedRestaurants ?? []
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role
        session.user.assignedRestaurants = token.assignedRestaurants ?? []
      }
      return session
    },
  },
}
