import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import dotenv from 'dotenv'

import { createMenuUploadWorker } from '@/workers/menuUploadWorker'

type CliArgs = {
  uploadId?: number
  dryRun?: boolean
}

function loadEnv() {
  const candidates = [
    process.env.ALLERQ_MENU_WORKER_ENV?.trim(),
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), 'apps/allerq/.env.local'),
  ].filter((entry): entry is string => Boolean(entry))

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      dotenv.config({ path: candidate, override: false })
    }
  }
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {}

  for (const argument of argv) {
    if (argument === '--dry-run') {
      args.dryRun = true
      continue
    }

    if (argument.startsWith('--upload=')) {
      const value = Number(argument.split('=')[1])
      if (Number.isFinite(value) && value > 0) {
        args.uploadId = value
      }
      continue
    }

    if (argument === '--help' || argument === '-h') {
      console.log('Usage: pnpm --filter @kitchen-os/allerq process-menu-uploads [--upload=<id>] [--dry-run]')
      process.exit(0)
    }
  }

  return args
}

async function run(): Promise<void> {
  loadEnv()
  const args = parseArgs(process.argv.slice(2))

  try {
    const [{ parseMenuTextWithAi }, uploadTextModule, menuUploadsModule] = await Promise.all([
      import('@/lib/ai/menuUploadParser'),
      import('@/lib/menus/uploadText'),
      import('@/lib/ncb/menuUploads'),
    ])

    const worker = createMenuUploadWorker({
      parseMenuTextWithAi,
      extractUploadText: uploadTextModule.extractUploadText,
      UnsupportedMenuUploadError: uploadTextModule.UnsupportedMenuUploadError,
      createMenuUploadItem: menuUploadsModule.createMenuUploadItem,
      getMenuUploadById: menuUploadsModule.getMenuUploadById,
      getMenuUploadItems: menuUploadsModule.getMenuUploadItems,
      getMenuUploads: menuUploadsModule.getMenuUploads,
      updateMenuUpload: menuUploadsModule.updateMenuUpload,
      updateMenuUploadItem: menuUploadsModule.updateMenuUploadItem,
      logger: console,
    })

    const summary = await worker.run({
      uploadId: args.uploadId,
      dryRun: args.dryRun,
    })
    console.log('[menu-worker] run summary', summary)
  } catch (error) {
    console.error('[menu-worker] Fatal error while processing uploads:', error)
    process.exit(1)
  }
}

void run()
