export interface UserRecord {
  id: number
  email: string
  uid: string
  display_name?: string
  role?: string
  assigned_restaurants?: string
  password_hash?: string
  external_id?: string
  created_at?: number
  updated_at?: number
}

export interface RestaurantRecord {
  id: number
  name: string
  description: string
  address: string
  phone: string
  email: string
  website: string
  cuisine_type: string
  owner_id: string
  logo: string
  cover_image: string
  is_active: number
  created_at: number
  updated_at: number
}

export interface MenuRecord {
  id: number
  name: string
  description: string
  restaurant_id: number
  created_by: string
  created_at: number
  updated_at: number
  external_id: string
  menu_type: string
  is_active: number
  ai_processed: number
  upload_file_name: string
}

export interface MenuItemRecord {
  id: number
  menu_id: number
  restaurant_id: number
  name: string
  description: string
  price: number
  category: string
  allergens: string
  dietary: string
  created_at: number
  updated_at: number
  external_id: string
  ai_confidence: number
  manual_override: number
  category_id: number
  is_active: number
  ai_processed: number
  ai_needs_review: number
}
