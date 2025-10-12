export interface MenuCategoryDefinition {
  slug: string
  label: string
  description?: string
  icon?: string
}

export const DEFAULT_MENU_CATEGORIES: MenuCategoryDefinition[] = [
  { slug: 'starters', label: 'Starters' },
  { slug: 'main-courses', label: 'Main Courses' },
  { slug: 'side-orders', label: 'Side Orders' },
  { slug: 'desserts', label: 'Desserts' },
  { slug: 'drinks', label: 'Drinks' },
  { slug: 'pizzas', label: 'Pizzas' },
  { slug: 'tapas', label: 'Tapas' },
  { slug: 'sandwiches', label: 'Sandwiches' },
  { slug: 'soups', label: 'Soups' },
]

export const MENU_UPLOAD_ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx']

export const MENU_UPLOAD_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export const MAX_MENU_UPLOAD_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
