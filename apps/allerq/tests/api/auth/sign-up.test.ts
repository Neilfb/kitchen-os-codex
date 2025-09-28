import { describe, it, expect, vi } from 'vitest'

import { POST } from '@/app/api/auth/sign-up/route'

describe('Sign-up API', () => {
  it('should load environment variables', async () => {
    const req = {
      json: vi.fn().mockResolvedValue({
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'test1234',
      }),
    }

    const res = await POST(req as any)
    expect(res.status).not.toBe(500)
  })
})
