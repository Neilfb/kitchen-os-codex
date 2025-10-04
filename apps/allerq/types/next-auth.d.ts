import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user?: DefaultSession['user'] & {
      role?: string
      assignedRestaurants?: string[]
    }
  }

  interface User {
    role?: string
    assignedRestaurants?: string[]
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string
    assignedRestaurants?: string[]
  }
}
