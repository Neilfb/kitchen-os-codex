export type Role = 'superadmin' | 'admin' | 'manager'

export type Capability =
  | 'platform.superadmin'
  | 'platform.debug'
  | 'restaurant.create'
  | 'restaurant.manage:any'
  | 'restaurant.manage:own'
  | 'restaurant.manage:assigned'
  | 'menu.manage'
  | 'user.manage:any'
  | 'user.manage:own'
  | 'user.manage.roles'
  | 'analytics.view:any'
  | 'analytics.view:own'
  | 'billing.view:any'
  | 'billing.view:own'
  | 'qr.generate'

export interface User {
  id: string
  email: string
  name?: string
  role: Role
  assigned_restaurants?: string[]
}

export interface SessionUser {
  id: string
  email: string
  name?: string
  role: Role
  ncdbUserId: number
  assignedRestaurants: string[]
  capabilities: Capability[]
}
