import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

import { config as loadEnv } from 'dotenv'
import type { UploadLogoOptions } from '@/lib/uploads/cloudinary'

interface SmokeDependencies {
  createMenu: typeof import('@/lib/ncb/menu').createMenu
  getMenus: typeof import('@/lib/ncb/menu').getMenus
  updateMenu: typeof import('@/lib/ncb/menu').updateMenu
  createMenuItem: typeof import('@/lib/ncb/menuItem').createMenuItem
  uploadLogoToCloudinary: typeof import('@/lib/uploads/cloudinary').uploadLogoToCloudinary
}

const REQUIRED_ENV_KEYS: string[] = [
  'NCDB_INSTANCE',
  'NCDB_API_KEY',
  'NCDB_SECRET_KEY',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'ALLERQ_SMOKE_RESTAURANT_ID',
]

const scriptDir = path.dirname(fileURLToPath(new URL(import.meta.url)))

let cachedDependencies: SmokeDependencies | null = null

function ensureEnv(name: string): string {
  const value = process.env[name]
  if (!value || !value.trim()) {
    throw new Error(`Environment variable ${name} is required for the staging smoke test`)
  }
  return value.trim()
}

function loadLocalSmokeEnvIfNeeded(): void {
  if (process.env.CI === 'true') {
    return
  }

  const smokeEnvPath = path.join(scriptDir, '.env.smoke')
  if (fs.existsSync(smokeEnvPath)) {
    loadEnv({ path: smokeEnvPath })
    console.log(`[smoke] Loaded environment variables from ${smokeEnvPath}`)
  }
}

function verifyRequiredEnv(): void {
  const missing = REQUIRED_ENV_KEYS.filter((key) => !process.env[key] || !process.env[key]!.trim())
  if (missing.length > 0) {
    throw new Error(
      `[smoke] Missing required environment variables: ${missing.join(
        ', '
      )}. Set them in your environment or add them to scripts/.env.smoke.`
    )
  }
}

async function loadDependencies(): Promise<SmokeDependencies> {
  if (cachedDependencies) {
    return cachedDependencies
  }

  const [{ createMenu, getMenus, updateMenu }, { createMenuItem }, { uploadLogoToCloudinary }] = await Promise.all([
    import('@/lib/ncb/menu'),
    import('@/lib/ncb/menuItem'),
    import('@/lib/uploads/cloudinary'),
  ])

  cachedDependencies = {
    createMenu,
    getMenus,
    updateMenu,
    createMenuItem,
    uploadLogoToCloudinary,
  }

  return cachedDependencies
}

async function maybeUploadLogo(deps: SmokeDependencies): Promise<void> {
  const logoPath = process.env.ALLERQ_SMOKE_LOGO_PATH
  if (!logoPath) {
    console.log('[smoke] Skipping logo upload (ALLERQ_SMOKE_LOGO_PATH not set)')
    return
  }

  const resolvedPath = path.resolve(process.cwd(), logoPath)
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Logo path not found: ${resolvedPath}`)
  }

  const buffer = await fs.promises.readFile(resolvedPath)
  const options: UploadLogoOptions = {
    buffer,
    filename: path.basename(resolvedPath),
    contentType: undefined,
  }

  const result = await deps.uploadLogoToCloudinary(options)
  console.log('[smoke] Logo upload successful', {
    secureUrl: result.secureUrl,
    publicId: result.publicId,
  })
}

async function runMenuLifecycle(deps: SmokeDependencies, restaurantId: number): Promise<void> {
  const existingMenus = await deps.getMenus({ restaurantId })
  console.log('[smoke] Existing menus', existingMenus.length)

  const menuName = `Smoke Menu ${new Date().toISOString()}`
  const menu = await deps.createMenu({
    name: menuName,
    restaurant_id: restaurantId,
    description: 'Automated staging smoke menu',
    menu_type: 'smoke-test',
    created_by: 'staging-smoke',
  })

  console.log('[smoke] Created menu', { id: menu.id, name: menu.name })

  const item = await deps.createMenuItem({
    menu_id: Number(menu.id),
    restaurant_id: restaurantId,
    name: 'Smoke Dish',
    description: 'Automated staging smoke item',
    price: 1.23,
    category: 'Smoke',
    allergens: 'none',
    dietary: 'vegan',
  })

  console.log('[smoke] Created menu item', { id: item.id, name: item.name })

  await deps.updateMenu({ id: Number(menu.id), is_active: false })
  console.log('[smoke] Deactivated smoke menu', { id: menu.id })
}

async function runWorkerDryRun(): Promise<void> {
  console.log('[smoke] Running menu upload worker (dry run)')
  await new Promise<void>((resolve, reject) => {
    const child = spawn('pnpm', ['--filter', '@kitchen-os/allerq', 'process-menu-uploads', '--', '--dry-run'], {
      stdio: 'inherit',
      env: process.env,
    })

    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`menu upload worker exited with code ${code}`))
      }
    })
  })
}

async function run(): Promise<void> {
  try {
    loadLocalSmokeEnvIfNeeded()
    verifyRequiredEnv()
    const deps = await loadDependencies()

    const restaurantIdValue = ensureEnv('ALLERQ_SMOKE_RESTAURANT_ID')
    const restaurantId = Number(restaurantIdValue)
    if (!Number.isFinite(restaurantId) || restaurantId <= 0) {
      throw new Error('ALLERQ_SMOKE_RESTAURANT_ID must be a positive number')
    }

    await runMenuLifecycle(deps, restaurantId)
    await maybeUploadLogo(deps)
    await runWorkerDryRun()

    console.log('\n[smoke] Staging smoke completed successfully')
  } catch (error) {
    console.error('\n[smoke] Staging smoke failed', error)
    process.exit(1)
  }
}

void run()
