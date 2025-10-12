import type { ParsedMenuItem, ParsedMenuTag } from '@/lib/ai/menuUploadParser'
import type { IdentifiedTag } from '@/types/ncdb/menu'
import type {
  MenuUploadItemRecord,
  MenuUploadItemStatus,
  MenuUploadRecord,
  MenuUploadStatus,
} from '@/types/ncdb/menuUpload'
import { appendActivityEvent, type ActivityEvent } from '@/lib/menus/activity'

export interface MenuUploadWorkerDeps {
  parseMenuTextWithAi: (input: {
    text: string
    restaurantName?: string
    menuName?: string
    uploadFileName?: string
    locale?: string
  }) => Promise<{
    model: string
    items: ParsedMenuItem[]
    summary?: string
    warnings: string[]
    usage?: {
      inputTokens?: number
      outputTokens?: number
      totalTokens?: number
    }
  }>
  extractUploadText: (upload: MenuUploadRecord) => Promise<{ text: string; source: string }>
  UnsupportedMenuUploadError: new (message: string) => Error
  createMenuUploadItem: (input: CreateMenuUploadItemInput) => Promise<MenuUploadItemRecord>
  getMenuUploadById: (input: { id: number }) => Promise<MenuUploadRecord | null>
  getMenuUploadItems: (input: { uploadId?: number; menuId?: number; status?: string | string[] }) => Promise<MenuUploadItemRecord[]>
  getMenuUploads: (input?: { status?: MenuUploadStatus | MenuUploadStatus[] }) => Promise<MenuUploadRecord[]>
  updateMenuUpload: (input: { id: number; status?: MenuUploadStatus; metadata?: Record<string, unknown>; parser_version?: string | undefined; ai_model?: string | undefined; processed_at?: number | undefined; failure_reason?: string | undefined }) => Promise<MenuUploadRecord>
  updateMenuUploadItem: (input: { id: number } & Partial<CreateMenuUploadItemInput>) => Promise<MenuUploadItemRecord>
  logger?: Console
}

export type CreateMenuUploadItemInput = {
  upload_id: number
  restaurant_id?: number
  menu_id?: number
  name?: string
  description?: string
  price?: number
  raw_text?: string
  status?: MenuUploadItemStatus
  confidence?: number
  suggested_category?: string
  suggested_allergens?: IdentifiedTag[]
  suggested_dietary?: IdentifiedTag[]
  ai_payload?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

export interface ProcessUploadOptions {
  dryRun?: boolean
}

export interface RunOptions extends ProcessUploadOptions {
  uploadId?: number
}

export interface RunSummary {
  uploadCount: number
  processedCount: number
  totalInputTokens: number
  totalOutputTokens: number
  totalTokens: number
  durationMs: number
  failedCount: number
}

type ProcessResult = {
  processedCount: number
  tokenUsage?: Record<string, unknown>
  durationMs: number
  failed: boolean
}

const DISCARDABLE_STATUSES: MenuUploadItemStatus[] = ['pending', 'needs_review']

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.trim())
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }
  return undefined
}

function resolveRestaurantId(upload: MenuUploadRecord): number | undefined {
  if (upload.restaurant_id) {
    const parsed = asNumber(upload.restaurant_id)
    if (parsed) {
      return parsed
    }
  }

  const metadata = upload.metadata as Record<string, unknown> | undefined
  return asNumber(metadata?.restaurantId ?? metadata?.restaurant_id)
}

function resolveMenuId(upload: MenuUploadRecord): number | undefined {
  if (upload.menu_id) {
    const parsed = asNumber(upload.menu_id)
    if (parsed) {
      return parsed
    }
  }

  const metadata = upload.metadata as Record<string, unknown> | undefined
  return asNumber(metadata?.menuId ?? metadata?.menu_id)
}

function getMetadataString(metadata: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = metadata?.[key]
  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }
  return undefined
}

function mergeMetadata(
  existing: Record<string, unknown> | undefined,
  updates: Record<string, unknown>
): Record<string, unknown> {
  return {
    ...(existing ?? {}),
    ...updates,
  }
}

function mapTagToIdentifiedTag(tag: ParsedMenuTag): IdentifiedTag {
  return {
    code: tag.code,
    label: tag.label,
    confidence: tag.confidence,
    source: 'ai',
  }
}

function clampConfidence(value: number | undefined): number | undefined {
  if (value === undefined || Number.isNaN(value)) {
    return undefined
  }
  return Math.max(0, Math.min(1, value))
}

async function discardExistingItems(
  deps: MenuUploadWorkerDeps,
  uploadId: number,
  items: MenuUploadItemRecord[],
  dryRun: boolean
): Promise<void> {
  const { logger = console } = deps
  const targets = items.filter((item) => {
    const status = (item.status as MenuUploadItemStatus | undefined) ?? 'pending'
    return DISCARDABLE_STATUSES.includes(status)
  })

  if (targets.length === 0) {
    return
  }

  logger.log(
    `[menu-worker] Upload ${uploadId} has ${targets.length} existing AI items. Marking as discarded before reprocessing.`
  )

  if (dryRun) {
    targets.forEach((item) => {
      logger.log(`[menu-worker] DRY RUN: would discard menu_upload_item ${item.id}`)
    })
    return
  }

  for (const item of targets) {
    await deps.updateMenuUploadItem({
      id: Number(item.id),
      status: 'discarded',
    }).catch((error) => {
      logger.error(`[menu-worker] Failed to discard previous item ${item.id}:`, error)
    })
  }
}

function buildCreatePayload(
  upload: MenuUploadRecord,
  restaurantId: number,
  menuId: number | undefined,
  aiItem: ParsedMenuItem
): CreateMenuUploadItemInput {
  return {
    upload_id: Number(upload.id),
    restaurant_id: restaurantId,
    menu_id: menuId,
    name: aiItem.name,
    description: aiItem.description,
    raw_text: aiItem.rawText ?? aiItem.description ?? aiItem.name,
    suggested_category: aiItem.category ?? aiItem.section,
    ai_payload: aiItem.aiPayload,
    suggested_allergens: aiItem.allergens.map(mapTagToIdentifiedTag),
    suggested_dietary: aiItem.dietaryTags.map(mapTagToIdentifiedTag),
    confidence: clampConfidence(aiItem.confidence),
  }
}

async function persistAiItems(
  deps: MenuUploadWorkerDeps,
  upload: MenuUploadRecord,
  restaurantId: number,
  menuId: number | undefined,
  aiItems: ParsedMenuItem[],
  dryRun: boolean
) {
  const { logger = console } = deps
  const limitedItems = aiItems.slice(0, 150)
  if (aiItems.length > limitedItems.length) {
    logger.warn(
      `[menu-worker] Upload ${upload.id} returned ${aiItems.length} items. Only the first ${limitedItems.length} will be stored.`
    )
  }

  for (const item of limitedItems) {
    const payload = buildCreatePayload(upload, restaurantId, menuId, item)
    if (dryRun) {
      logger.log(`[menu-worker] DRY RUN: would create menu_upload_item for "${payload.name}"`)
      continue
    }

    try {
      await deps.createMenuUploadItem(payload)
    } catch (error) {
      logger.error(`[menu-worker] Failed to create menu_upload_item for "${payload.name}":`, error)
    }
  }
}

async function markUploadStatus(
  deps: MenuUploadWorkerDeps,
  upload: MenuUploadRecord,
  status: MenuUploadStatus,
  updates: {
    failure_reason?: string
    summary?: string
    warnings?: string[]
    model?: string
    tokenUsage?: Record<string, unknown>
    extractionSource?: string
    itemCount?: number
  },
  dryRun: boolean,
  baseMetadata: Record<string, unknown>,
  activityEvent?: ActivityEvent,
  metrics?: {
    durationMs?: number
    tokenUsage?: Record<string, unknown>
    itemsProcessed?: number
  }
): Promise<Record<string, unknown>> {
  const existingMetrics = (baseMetadata.aiMetrics as Record<string, unknown> | undefined) ?? {}
  const metricsPatch = metrics
    ? {
        aiMetrics: {
          ...existingMetrics,
          lastRunAt: Date.now(),
          lastDurationMs: metrics.durationMs ?? existingMetrics.lastDurationMs,
          lastItemsProcessed: metrics.itemsProcessed ?? existingMetrics.lastItemsProcessed,
          lastTokenUsage: metrics.tokenUsage ?? existingMetrics.lastTokenUsage,
        },
      }
    : {}

  const mergedMetadataBase = mergeMetadata(baseMetadata, {
    aiSummary: updates.summary ?? baseMetadata.aiSummary,
    aiWarnings: updates.warnings ?? baseMetadata.aiWarnings,
    aiModel: updates.model ?? baseMetadata.aiModel,
    aiTokenUsage: updates.tokenUsage ?? baseMetadata.aiTokenUsage,
    aiExtractionSource: updates.extractionSource ?? baseMetadata.aiExtractionSource,
    aiItemCount: updates.itemCount ?? baseMetadata.aiItemCount,
    lastProcessedAt: Date.now(),
    ...metricsPatch,
  })

  const mergedMetadata = activityEvent
    ? appendActivityEvent(mergedMetadataBase, activityEvent)
    : mergedMetadataBase

  if (dryRun) {
    deps.logger?.log(
      `[menu-worker] DRY RUN: would update menu_upload ${upload.id} → status=${status}, items=${updates.itemCount ?? 'n/a'}`
    )
    return mergedMetadata
  }

  await deps.updateMenuUpload({
    id: Number(upload.id),
    status,
    parser_version: process.env.ALLERQ_MENU_PARSER_VERSION,
    ai_model: updates.model,
    processed_at: Date.now(),
    failure_reason: updates.failure_reason,
    metadata: mergedMetadata,
  })

  return mergedMetadata
}

export function createMenuUploadWorker(deps: MenuUploadWorkerDeps) {
  const { logger = console, UnsupportedMenuUploadError } = deps

  async function processUpload(upload: MenuUploadRecord, options: ProcessUploadOptions = {}): Promise<ProcessResult> {
    const uploadId = Number(upload.id)
    let workingMetadata: Record<string, unknown> = {
      ...((upload.metadata as Record<string, unknown> | undefined) ?? {}),
    }
    const restaurantId = resolveRestaurantId(upload)
    const startedAt = Date.now()

    if (!restaurantId) {
      const reason = 'Menu upload missing restaurant context'
      logger.error(`[menu-worker] Upload ${uploadId} failed: ${reason}`)
      await markUploadStatus(
        deps,
        upload,
        'failed',
        {
          failure_reason: reason,
        },
        Boolean(options.dryRun),
        workingMetadata
      )
      return {
        processedCount: 0,
        tokenUsage: undefined,
        durationMs: Date.now() - startedAt,
        failed: true,
      }
    }

    workingMetadata = mergeMetadata(workingMetadata, { processingStartedAt: Date.now() })

    if (!options.dryRun) {
      await deps.updateMenuUpload({
        id: uploadId,
        status: 'processing',
        failure_reason: undefined,
        metadata: workingMetadata,
      }).catch((error) => {
        logger.error(`[menu-worker] Failed to mark upload ${uploadId} as processing`, error)
      })
    } else {
      logger.log(`[menu-worker] DRY RUN: would set upload ${uploadId} status to processing`)
    }

    try {
      const extraction = await deps.extractUploadText(upload)
      logger.log(
        `[menu-worker] Upload ${uploadId} extracted ${extraction.text.length} characters from ${extraction.source.toUpperCase()}`
      )

      const aiResult = await deps.parseMenuTextWithAi({
        text: extraction.text,
        restaurantName: getMetadataString(workingMetadata, 'restaurantName'),
        menuName: getMetadataString(workingMetadata, 'menuName'),
        uploadFileName: upload.file_name,
        locale: getMetadataString(workingMetadata, 'locale') ?? 'en-GB',
      })

      logger.log(
        `[menu-worker] Upload ${uploadId} AI inference produced ${aiResult.items.length} items (model: ${aiResult.model})`
      )

      const existingItems = await deps.getMenuUploadItems({ uploadId })
      await discardExistingItems(deps, uploadId, existingItems, Boolean(options.dryRun))

      await persistAiItems(deps, upload, restaurantId, resolveMenuId(upload), aiResult.items, Boolean(options.dryRun))

      const status: MenuUploadStatus = 'needs_review'
      const warnings =
        aiResult.items.length > 0 ? aiResult.warnings : [...aiResult.warnings, 'AI did not identify any menu items']

      const activityEvent: ActivityEvent = {
        type: 'upload_ready',
        timestamp: Date.now(),
        uploadId,
        restaurantId,
        menuId: resolveMenuId(upload),
        itemCount: aiResult.items.length,
        payload: {
          model: aiResult.model,
        },
      }

      const durationMs = Date.now() - startedAt

      workingMetadata = await markUploadStatus(
        deps,
        upload,
        status,
        {
          summary: aiResult.summary,
          warnings,
          model: aiResult.model,
          tokenUsage: aiResult.usage,
          extractionSource: extraction.source,
          itemCount: aiResult.items.length,
        },
        Boolean(options.dryRun),
        workingMetadata,
        activityEvent,
        {
          durationMs,
          tokenUsage: aiResult.usage,
          itemsProcessed: aiResult.items.length,
        }
      )

      return {
        processedCount: aiResult.items.length,
        tokenUsage: aiResult.usage,
        durationMs,
        failed: false,
      }
    } catch (error) {
      const durationMs = Date.now() - startedAt
      const message =
        error instanceof UnsupportedMenuUploadError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Unknown AI processing error'
      logger.error(`[menu-worker] Upload ${uploadId} encountered an error:`, error)

      workingMetadata = await markUploadStatus(
        deps,
        upload,
        'failed',
        {
          failure_reason: message.slice(0, 500),
          extractionSource: 'error',
        },
        Boolean(options.dryRun),
        workingMetadata,
        undefined,
        {
          durationMs,
          itemsProcessed: 0,
        }
      )
      return {
        processedCount: 0,
        tokenUsage: undefined,
        durationMs,
        failed: true,
      }
    }
  }

  async function run(options: RunOptions = {}): Promise<RunSummary> {
    const uploads = options.uploadId
      ? (() => {
          return deps.getMenuUploadById({ id: options.uploadId! }).then((record) => (record ? [record] : []))
        })()
      : deps.getMenuUploads({ status: 'pending' })

    const resolvedUploads = await uploads

    if (resolvedUploads.length === 0) {
      if (options.uploadId) {
        deps.logger?.error(`[menu-worker] No menu upload found with id ${options.uploadId}`)
        throw new Error('Menu upload not found')
      } else {
        deps.logger?.log('[menu-worker] No pending menu uploads to process')
        return {
          uploadCount: 0,
          processedCount: 0,
          totalInputTokens: 0,
          totalOutputTokens: 0,
          totalTokens: 0,
          durationMs: 0,
          failedCount: 0,
        }
      }
    }

    const startTime = Date.now()
    const summary: RunSummary = {
      uploadCount: resolvedUploads.length,
      processedCount: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTokens: 0,
      durationMs: 0,
      failedCount: 0,
    }

    for (const upload of resolvedUploads) {
      const result = await processUpload(upload, { dryRun: options.dryRun })
      summary.processedCount += result.processedCount
      const usage = result.tokenUsage as Record<string, number | undefined> | undefined
      if (usage) {
        summary.totalInputTokens += usage.inputTokens ?? usage.input_tokens ?? 0
        summary.totalOutputTokens += usage.outputTokens ?? usage.output_tokens ?? 0
        summary.totalTokens += usage.totalTokens ?? usage.total_tokens ?? 0
      }
      if (result.failed) {
        summary.failedCount += 1
      }
    }

    summary.durationMs = Date.now() - startTime
    deps.logger?.log('[menu-worker] Processing complete', {
      uploadCount: summary.uploadCount,
      processedCount: summary.processedCount,
      failedCount: summary.failedCount,
      durationMs: summary.durationMs,
    })
    return summary
  }

  return {
    processUpload,
    run,
  }
}
