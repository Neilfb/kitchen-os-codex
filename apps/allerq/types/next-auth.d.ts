import type { Capability, Role } from '@/types/user'
import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user?: DefaultSession['user'] & {
      role?: Role
      assignedRestaurants?: string[]
      capabilities?: Capability[]
    }
  }

  interface User {
    role?: Role
    assignedRestaurants?: string[]
    capabilities?: Capability[]
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: Role
    assignedRestaurants?: string[]
    capabilities?: Capability[]
  }
}
