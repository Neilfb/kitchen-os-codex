import OpenAI from 'openai'
import { z } from 'zod'

const DEFAULT_MODEL = 'gpt-4.1-mini'
const MAX_TEXT_LENGTH = 18_000

const MenuTagSchema = z
  .object({
    code: z.string().optional(),
    label: z.string(),
    confidence: z
      .union([z.number(), z.string()])
      .transform((value) => {
        if (value === '' || value === null || value === undefined) return undefined
        const numeric = typeof value === 'number' ? value : Number(value)
        if (!Number.isFinite(numeric)) return undefined
        return Math.max(0, Math.min(1, numeric))
      })
      .optional(),
  })
  .strict()

const MenuItemSchema = z
  .object({
    name: z.string(),
    description: z.string().optional(),
    section: z.string().optional(),
    category: z.string().optional(),
    price: z
      .object({
        amount: z.number(),
        currency: z.string().optional(),
        textual: z.string().optional(),
      })
      .partial({
        currency: true,
        textual: true,
      })
      .optional(),
    confidence: z
      .union([z.number(), z.string()])
      .transform((value) => {
        if (value === '' || value === null || value === undefined) return undefined
        const numeric = typeof value === 'number' ? value : Number(value)
        if (!Number.isFinite(numeric)) return undefined
        return Math.max(0, Math.min(1, numeric))
      })
      .optional(),
    raw_text: z.string().optional(),
    notes: z.string().optional(),
    allergens: z.array(MenuTagSchema).optional().default([]),
    dietary_tags: z.array(MenuTagSchema).optional().default([]),
  })
  .strict()

const MenuAiResponseSchema = z
  .object({
    items: z.array(MenuItemSchema).default([]),
    sections: z
      .array(
        z
          .object({
            name: z.string(),
            description: z.string().optional(),
          })
          .strict()
      )
      .optional(),
    summary: z.string().optional(),
    warnings: z.array(z.string()).optional().default([]),
  })
  .strict()

const ParseMenuTextInputSchema = z.object({
  text: z.string().min(1),
  restaurantName: z.string().optional(),
  menuName: z.string().optional(),
  uploadFileName: z.string().optional(),
  locale: z.string().optional(),
})

export type ParsedMenuTag = {
  code: string
  label: string
  confidence?: number
}

export type ParsedMenuItem = {
  name: string
  description?: string
  section?: string
  category?: string
  price?: {
    amount: number
    currency?: string
    textual?: string
  }
  confidence?: number
  rawText?: string
  notes?: string
  allergens: ParsedMenuTag[]
  dietaryTags: ParsedMenuTag[]
  aiPayload: Record<string, unknown>
}

export interface MenuUploadParserResult {
  model: string
  items: ParsedMenuItem[]
  summary?: string
  warnings: string[]
  usage?: {
    inputTokens?: number
    outputTokens?: number
    totalTokens?: number
  }
}

const MENU_UPLOAD_JSON_SCHEMA = {
  type: 'json_schema',
  name: 'allerq_menu_upload_items',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['items'],
    properties: {
      summary: { type: 'string' },
      warnings: {
        type: 'array',
        items: { type: 'string' },
      },
      sections: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['name'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
          },
        },
      },
      items: {
        type: 'array',
        maxItems: 150,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['name'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            section: { type: 'string' },
            category: { type: 'string' },
            notes: { type: 'string' },
            raw_text: { type: 'string' },
            confidence: {
              type: 'number',
              minimum: 0,
              maximum: 1,
            },
            price: {
              type: 'object',
              additionalProperties: false,
              properties: {
                amount: { type: 'number' },
                currency: { type: 'string' },
                textual: { type: 'string' },
              },
            },
            allergens: {
              type: 'array',
              maxItems: 20,
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['label'],
                properties: {
                  code: { type: 'string' },
                  label: { type: 'string' },
                  confidence: {
                    type: 'number',
                    minimum: 0,
                    maximum: 1,
                  },
                },
              },
            },
            dietary_tags: {
              type: 'array',
              maxItems: 20,
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['label'],
                properties: {
                  code: { type: 'string' },
                  label: { type: 'string' },
                  confidence: {
                    type: 'number',
                    minimum: 0,
                    maximum: 1,
                  },
                },
              },
            },
          },
        },
      },
    },
  },
} as const

let cachedOpenAi: OpenAI | null = null

function getOpenAiClient(): OpenAI {
  if (cachedOpenAi) {
    return cachedOpenAi
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required to parse menu uploads')
  }

  cachedOpenAi = new OpenAI({ apiKey })
  return cachedOpenAi
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

function normalizeTextForPrompt(text: string): string {
  if (text.length <= MAX_TEXT_LENGTH) {
    return text
  }
  return `${text.slice(0, MAX_TEXT_LENGTH)}\n\n[TRUNCATED AFTER ${MAX_TEXT_LENGTH} CHARACTERS]`
}

function buildSystemPrompt(): string {
  return [
    'You are an assistant that extracts structured menu data for AllerQ.',
    'Parse dishes, descriptions, prices, and allergen cues from raw menu text.',
    'Where allergens or dietary labels are identified, include them with confidence scores between 0 and 1.',
    'Return JSON that strictly matches the provided schema.',
    'Prices must be numeric (no currency symbols).',
    'Generate concise section/category names when implicit.',
  ].join(' ')
}

function buildUserPrompt(input: z.infer<typeof ParseMenuTextInputSchema>): string {
  const contextualDetails = [
    input.restaurantName ? `Restaurant: ${input.restaurantName}` : undefined,
    input.menuName ? `Menu: ${input.menuName}` : undefined,
    input.uploadFileName ? `Source file: ${input.uploadFileName}` : undefined,
    input.locale ? `Locale: ${input.locale}` : undefined,
  ]
    .filter(Boolean)
    .join('\n')

  return [
    contextualDetails,
    'Extract a flat list of menu items. Include:',
    '- `section` when the dish belongs to a named section or course.',
    '- `category` if you can infer a standard category (e.g. starters, mains, drinks).',
    '- `price.amount` as numeric value (no currency symbol).',
    '- `allergens` and `dietary_tags` arrays with canonical labels (e.g. gluten, dairy-free).',
    '- `confidence` expressing how certain you are (0 to 1).',
    '- `raw_text` capturing the original excerpt for audit.',
    'Focus on dishes suitable for diners (ignore opening hours, marketing copy, legal disclaimers).',
    '',
    'Menu text:',
    normalizeTextForPrompt(input.text),
  ]
    .filter(Boolean)
    .join('\n')
}

export async function parseMenuTextWithAi(
  input: z.input<typeof ParseMenuTextInputSchema>
): Promise<MenuUploadParserResult> {
  const validatedInput = ParseMenuTextInputSchema.parse(input)
  const client = getOpenAiClient()
  const model = process.env.ALLERQ_OPENAI_MODEL?.trim() || DEFAULT_MODEL

  const response = await client.responses.create({
    model,
    temperature: 0.2,
    max_output_tokens: 2000,
    input: [
      {
        role: 'system',
        content: [
          {
            type: 'input_text',
            text: buildSystemPrompt(),
          },
        ],
      },
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: buildUserPrompt(validatedInput),
          },
        ],
      },
    ],
    text: {
      format: MENU_UPLOAD_JSON_SCHEMA,
    },
  })

  const outputText = response.output_text?.trim()
  if (!outputText) {
    throw new Error('OpenAI response did not include JSON output')
  }

  let parsedJson: unknown
  try {
    parsedJson = JSON.parse(outputText)
  } catch (error) {
    throw new Error(`Unable to parse OpenAI response JSON: ${(error as Error).message}`)
  }

  const parsed = MenuAiResponseSchema.parse(parsedJson)

  const items: ParsedMenuItem[] = parsed.items.map((item) => {
    const allergens =
      item.allergens?.map((tag) => ({
        code: (tag.code && tag.code.trim()) || slugify(tag.label),
        label: tag.label.trim(),
        confidence: tag.confidence,
      })) ?? []

    const dietaryTags =
      item.dietary_tags?.map((tag) => ({
        code: (tag.code && tag.code.trim()) || slugify(tag.label),
        label: tag.label.trim(),
        confidence: tag.confidence,
      })) ?? []

    const normalizedPrice = item.price?.amount && Number.isFinite(item.price.amount) ? item.price : undefined

    return {
      name: item.name.trim(),
      description: item.description?.trim() || undefined,
      section: item.section?.trim() || undefined,
      category: item.category?.trim() || item.section?.trim() || undefined,
      price: normalizedPrice
        ? {
            amount: normalizedPrice.amount,
            currency: normalizedPrice.currency?.trim() || undefined,
            textual: normalizedPrice.textual?.trim() || undefined,
          }
        : undefined,
      confidence: item.confidence,
      rawText: item.raw_text?.trim() || item.notes?.trim() || undefined,
      notes: item.notes?.trim() || undefined,
      allergens,
      dietaryTags,
      aiPayload: item as unknown as Record<string, unknown>,
    }
  })

  return {
    model,
    items,
    summary: parsed.summary?.trim() || undefined,
    warnings: parsed.warnings ?? [],
    usage: {
      inputTokens: response.usage?.input_tokens,
      outputTokens: response.usage?.output_tokens,
      totalTokens: response.usage?.total_tokens,
    },
  }
}
