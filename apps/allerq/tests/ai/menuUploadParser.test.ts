import { describe, expect, it, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'

vi.mock('openai', () => {
  const createMockResponse = (json: unknown, usage?: Record<string, number>) => ({
    output_text: JSON.stringify(json),
    usage,
  })

  const mockCreate = vi.fn()

  const Responses = {
    create: mockCreate,
  }

  const defaultExport = Object.assign(vi.fn(() => ({ responses: Responses })), {
    __mock: { createMockResponse, mockCreate },
  })

  return {
    default: defaultExport,
    Responses,
    __mock: defaultExport.__mock,
  }
})

import OpenAI from 'openai'

import { parseMenuTextWithAi } from '@/lib/ai/menuUploadParser'

const openAiMock = OpenAI as unknown as {
  __mock: {
    createMockResponse: (json: unknown, usage?: Record<string, number>) => unknown
    mockCreate: ReturnType<typeof vi.fn>
  }
}

const { __mock } = openAiMock

const ORIGINAL_OPENAI_KEY = process.env.OPENAI_API_KEY

beforeAll(() => {
  process.env.OPENAI_API_KEY = 'test-key'
})

afterAll(() => {
  process.env.OPENAI_API_KEY = ORIGINAL_OPENAI_KEY
})

describe('parseMenuTextWithAi', () => {
  beforeEach(() => {
    __mock.mockCreate.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('parses structured items with price conversions and tags', async () => {
    __mock.mockCreate.mockResolvedValueOnce(
      __mock.createMockResponse(
        {
          items: [
            {
              name: 'Margherita Pizza',
              description: 'San Marzano tomatoes, mozzarella, basil.',
              section: 'Pizzas',
              category: 'main courses',
              price: { amount: 12.5 },
              confidence: 0.82,
              raw_text: 'Margherita Pizza £12.50',
              allergens: [
                { label: 'gluten', code: 'gluten', confidence: 0.95 },
                { label: 'dairy', confidence: 0.9 },
              ],
              dietary_tags: [{ label: 'vegetarian', confidence: 0.88 }],
            },
          ],
          summary: 'Classic pizzas.',
          warnings: [],
        },
        { input_tokens: 1000, output_tokens: 200, total_tokens: 1200 }
      )
    )

    const result = await parseMenuTextWithAi({
      text: 'Menu text',
      restaurantName: 'Test Restaurant',
    })

    expect(result.model).toBeDefined()
    expect(result.summary).toBe('Classic pizzas.')
    expect(result.usage).toEqual({
      inputTokens: 1000,
      outputTokens: 200,
      totalTokens: 1200,
    })

    expect(result.items).toHaveLength(1)
    const item = result.items[0]
    expect(item.name).toBe('Margherita Pizza')
    expect(item.category).toBe('main courses')
    expect(item.section).toBe('Pizzas')
    expect(item.price).toEqual({ amount: 12.5 })
    expect(item.confidence).toBeCloseTo(0.82)
    expect(item.allergens).toEqual([
      { code: 'gluten', label: 'gluten', confidence: 0.95 },
      { code: 'dairy', label: 'dairy', confidence: 0.9 },
    ])
    expect(item.dietaryTags).toEqual([{ code: 'vegetarian', label: 'vegetarian', confidence: 0.88 }])
  })

  it('normalises invalid price/confidence values to undefined', async () => {
    __mock.mockCreate.mockResolvedValueOnce(
      __mock.createMockResponse({
        items: [
          {
            name: 'Mystery Dish',
            confidence: 'not-a-number',
            allergens: [{ label: 'nuts', confidence: 'invalid' }],
            dietary_tags: [{ label: 'vegan', confidence: '' }],
          },
        ],
        warnings: ['Price missing'],
      })
    )

    const result = await parseMenuTextWithAi({
      text: 'Example menu text',
    })

    expect(result.items).toHaveLength(1)
    const item = result.items[0]
    expect(item.price).toBeUndefined()
    expect(item.confidence).toBeUndefined()
    expect(item.allergens[0].confidence).toBeUndefined()
    expect(item.dietaryTags[0].confidence).toBeUndefined()
  })

  it('truncates overly long text before sending to OpenAI', async () => {
    const createSpy = __mock.mockCreate

    __mock.mockCreate.mockResolvedValueOnce(__mock.createMockResponse({ items: [] }))

    const longText = 'a'.repeat(25_000)
    await parseMenuTextWithAi({ text: longText })

    expect(createSpy).toHaveBeenCalledTimes(1)
    const callArg = createSpy.mock.calls[0]?.[0]
    const userContent = callArg?.input?.find((section: any) => section.role === 'user')
    const text = userContent?.content?.[0]?.text as string
    expect(text.length).toBeLessThan(longText.length)
    expect(text.includes('[TRUNCATED')).toBe(true)
  })
})
