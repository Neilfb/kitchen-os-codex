import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createMenuUploadWorker } from '@/workers/menuUploadWorker'
import type { CreateMenuUploadItemInput } from '@/workers/menuUploadWorker'
import type { MenuUploadRecord, MenuUploadItemRecord } from '@/types/ncdb/menuUpload'

const BASE_UPLOAD: MenuUploadRecord = {
  id: 101,
  restaurant_id: 44,
  menu_id: 55,
  file_url: 'https://example.com/menu.pdf',
  file_name: 'menu.pdf',
  file_size: 12345,
  status: 'pending',
  parser_version: undefined,
  created_at: Date.now(),
  updated_at: Date.now(),
  metadata: {},
}

const AI_ITEM = {
  name: 'Truffle Fries',
  description: 'Shoestring fries, truffle oil, parmesan.',
  section: 'Sides',
  category: 'sides',
  price: { amount: 6.5 },
  confidence: 0.92,
  rawText: 'Truffle Fries £6.50',
  notes: undefined,
  allergens: [{ label: 'dairy', code: 'dairy', confidence: 0.9 }],
  dietaryTags: [{ label: 'vegetarian', code: 'vegetarian', confidence: 0.8 }],
  aiPayload: { tokens: 123 },
}

const createDeps = () => {
  const createdItems: CreateMenuUploadItemInput[] = []
  const updatedUploads: Array<{ id: number; status?: string; metadata?: Record<string, unknown> }> = []
  const updatedItems: Array<{ id: number; status?: string; metadata?: Record<string, unknown> }> = []

  return {
    createdItems,
    updatedUploads,
    updatedItems,
    worker: createMenuUploadWorker({
      parseMenuTextWithAi: vi.fn().mockResolvedValue({
        model: 'gpt-test',
        items: [AI_ITEM],
        summary: 'Sample summary',
        warnings: [],
        usage: {
          inputTokens: 500,
          outputTokens: 120,
          totalTokens: 620,
        },
      }),
      extractUploadText: vi.fn().mockResolvedValue({ text: 'menu text', source: 'pdf' }),
      UnsupportedMenuUploadError: class extends Error {},
      createMenuUploadItem: vi.fn(async (input) => {
        createdItems.push({ ...input })
        return {
          id: createdItems.length,
          upload_id: input.upload_id,
          restaurant_id: input.restaurant_id,
          menu_id: input.menu_id,
          name: input.name,
          description: input.description,
          price: input.price,
          raw_text: input.raw_text,
          status: input.status ?? 'pending',
          confidence: input.confidence,
          suggested_category: input.suggested_category,
          suggested_allergens: input.suggested_allergens ?? [],
          suggested_dietary: input.suggested_dietary ?? [],
          ai_payload: input.ai_payload ?? {},
          metadata: input.metadata ?? {},
          created_at: Date.now(),
          updated_at: Date.now(),
        } satisfies MenuUploadItemRecord
      }),
      getMenuUploadById: vi.fn(async ({ id }) => (id === BASE_UPLOAD.id ? BASE_UPLOAD : null)),
      getMenuUploadItems: vi.fn(async () => []),
      getMenuUploads: vi.fn(async () => [BASE_UPLOAD]),
      updateMenuUpload: vi.fn(async ({ id, status, metadata }) => {
        updatedUploads.push({ id, status, metadata })
        return { ...BASE_UPLOAD, id, status: status ?? 'pending', metadata: metadata ?? {} }
      }),
      updateMenuUploadItem: vi.fn(async ({ id, status, metadata }) => {
        updatedItems.push({ id: Number(id), status, metadata })
        return {
          id: Number(id),
          upload_id: Number(BASE_UPLOAD.id),
          restaurant_id: BASE_UPLOAD.restaurant_id,
          menu_id: BASE_UPLOAD.menu_id,
          name: 'placeholder',
          description: '',
          price: undefined,
          raw_text: 'placeholder',
          status: status ?? 'pending',
          confidence: undefined,
          suggested_category: undefined,
          suggested_allergens: [],
          suggested_dietary: [],
          ai_payload: {},
          metadata: metadata ?? {},
          created_at: Date.now(),
          updated_at: Date.now(),
        } satisfies MenuUploadItemRecord
      }),
      logger: console,
    }),
  }
}

describe('menu upload worker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('persists AI items and updates metadata when run normally', async () => {
    const deps = createDeps()

    const summary = await deps.worker.run({})

    expect(summary).toMatchObject({
      uploadCount: 1,
      processedCount: 1,
      totalTokens: 620,
      failedCount: 0,
    })

    expect(deps.createdItems).toHaveLength(1)
    const created = deps.createdItems[0]
    expect(created.name).toBe('Truffle Fries')
    expect(created.suggested_allergens).toEqual([
      { code: 'dairy', label: 'dairy', confidence: 0.9, source: 'ai' },
    ])
    expect(created.metadata).toBeUndefined()

    expect(deps.updatedUploads.at(-1)?.status).toBe('needs_review')
    const latestMetadata = deps.updatedUploads.at(-1)?.metadata as any
    const activityLog = latestMetadata?.activityLog
    expect(activityLog?.at(-1)?.type).toBe('upload_ready')
    expect(latestMetadata?.aiMetrics?.lastItemsProcessed).toBe(1)
    expect(latestMetadata?.aiMetrics?.lastTokenUsage).toEqual({
      inputTokens: 500,
      outputTokens: 120,
      totalTokens: 620,
    })
  })

  it('does not write when dry-run is enabled', async () => {
    const deps = createDeps()

    const summary = await deps.worker.run({ dryRun: true })

    expect(summary).toMatchObject({
      uploadCount: 1,
      processedCount: 1,
      totalTokens: 620,
    })

    expect(deps.createdItems).toHaveLength(0)
    expect(deps.updatedUploads).toHaveLength(0)
  })
})
