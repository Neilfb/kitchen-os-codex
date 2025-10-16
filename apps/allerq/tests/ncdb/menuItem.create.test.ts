import { describe, expect, it, vi, beforeEach, afterEach, beforeAll } from 'vitest'

vi.hoisted(() => {
  process.env.NCDB_INSTANCE = 'test-instance'
  process.env.NCDB_API_KEY = 'test-api-key'
  process.env.NCDB_SECRET_KEY = 'test-secret'
  process.env.NCDB_BASE_URL = 'https://example.com'
})

vi.mock('@/lib/ncb/client', () => {
  return {
    ncdbRequest: vi.fn(),
    isNcdbSuccess: (body: unknown) => !!body && (body as { status?: string }).status === 'success',
    getNcdbErrorMessage: (body: unknown) =>
      (body as { message?: string })?.message ?? (body as { error?: { message?: string } })?.error?.message,
  }
})

let createMenuItem: (typeof import('@/lib/ncb/menuItem'))['createMenuItem']
let mockedNcdbRequest: ReturnType<typeof vi.fn>

beforeAll(async () => {
  ;({ createMenuItem } = await import('@/lib/ncb/menuItem'))
  mockedNcdbRequest = vi.mocked((await import('@/lib/ncb/client')).ncdbRequest) as ReturnType<typeof vi.fn>
})

describe('createMenuItem', () => {
  beforeEach(() => {
    mockedNcdbRequest.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('falls back to fetching the created item when NCDB omits data in the response', async () => {
    const menuId = 42
    const restaurantId = 7
    const createdAt = 1_700_000
    const fallbackRecord = {
      id: 123,
      menu_id: menuId,
      restaurant_id: restaurantId,
      name: 'Fallback Dish',
      description: 'Automated staging smoke item',
      price: 1.23,
      category: 'Smoke',
      created_at: createdAt,
      updated_at: createdAt,
      is_active: 1,
      allergens: '',
      dietary: '',
    }

    vi.spyOn(Date, 'now').mockReturnValue(createdAt)

    mockedNcdbRequest.mockResolvedValueOnce({
      endpoint: '/create/menu_items',
      body: {
        status: 'success',
        message: 'Record created successfully',
        id: fallbackRecord.id,
      },
    })

    mockedNcdbRequest.mockResolvedValueOnce({
      endpoint: '/search/menu_items',
      body: {
        status: 'success',
        data: [fallbackRecord],
      },
    })

    const createdItem = await createMenuItem({
      menu_id: menuId,
      restaurant_id: restaurantId,
      name: fallbackRecord.name,
      description: fallbackRecord.description,
      price: fallbackRecord.price,
      category: fallbackRecord.category,
      allergens: fallbackRecord.allergens,
      dietary: fallbackRecord.dietary,
    })

    expect(createdItem).toMatchObject({
      id: fallbackRecord.id,
      menu_id: fallbackRecord.menu_id,
      restaurant_id: fallbackRecord.restaurant_id,
      name: fallbackRecord.name,
    })

    expect(mockedNcdbRequest).toHaveBeenCalledTimes(2)
  })
})
