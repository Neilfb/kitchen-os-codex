export type Role = 'superadmin' | 'admin' | 'manager' | 'staff' | 'auditor'

export interface User {
  id: string
  email: string
  name?: string
  role: Role
  assigned_restaurants?: string[]
}
