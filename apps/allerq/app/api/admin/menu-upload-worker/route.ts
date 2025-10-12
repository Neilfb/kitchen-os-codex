import { NextResponse } from 'next/server'

import { createMenuUploadWorker } from '@/workers/menuUploadWorker'
import { sendSlackMessage } from '@/lib/notifications/slack'

export const runtime = 'nodejs'

async function buildWorker() {
  const [{ parseMenuTextWithAi }, uploadTextModule, menuUploadsModule] = await Promise.all([
    import('@/lib/ai/menuUploadParser'),
    import('@/lib/menus/uploadText'),
    import('@/lib/ncb/menuUploads'),
  ])

  return createMenuUploadWorker({
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
}

async function triggerWorker() {
  const worker = await buildWorker()
  const summary = await worker.run({})
  return summary
}

async function handleRequest(request: Request) {
  const secret = process.env.ALLERQ_WORKER_SECRET?.trim()
  if (secret) {
    const provided = request.headers.get('x-cron-secret') ?? request.headers.get('authorization')
    if (provided !== secret) {
      return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const summary = await triggerWorker()

    if (summary.failedCount > 0) {
      await sendSlackMessage(
        `⚠️ AllerQ menu upload worker completed with ${summary.failedCount} failure(s).`,
        {
          severity: 'warning',
          metadata: {
            uploads: summary.uploadCount,
            processed: summary.processedCount,
            durationMs: summary.durationMs,
          },
        }
      )
    } else {
      await sendSlackMessage(`✅ AllerQ menu upload worker processed ${summary.processedCount} items.`, {
        severity: 'info',
        metadata: {
          uploads: summary.uploadCount,
          totalTokens: summary.totalTokens,
          durationMs: summary.durationMs,
        },
      })
    }

    return NextResponse.json({ status: 'success', data: summary }, { status: 200 })
  } catch (error) {
    await sendSlackMessage(
      `🚨 AllerQ menu upload worker failed: ${(error as Error).message ?? 'Unknown error'}`,
      {
        severity: 'error',
      }
    )

    return NextResponse.json(
      { status: 'error', message: 'Worker failed to process menu uploads' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  return handleRequest(request)
}

export async function GET(request: Request) {
  return handleRequest(request)
}
