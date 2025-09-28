import path from 'node:path'
import process from 'node:process'

import axios, { type AxiosInstance } from 'axios'
import { wrapper } from 'axios-cookiejar-support'
import dotenv from 'dotenv'
import { CookieJar } from 'tough-cookie'

type SmokeResult = {
  step: string
  success: boolean
  message: string
}

const ENV_PATH = path.resolve(process.cwd(), '.env.test')
dotenv.config({ path: ENV_PATH })

const BASE_URL =
  process.env.ALLERQ_SMOKE_BASE_URL?.trim() ||
  process.env.BASE_URL?.trim() ||
  'https://kitchen-os-codex.vercel.app'

const EMAIL = process.env.SMOKE_TEST_EMAIL?.trim()
const PASSWORD = process.env.SMOKE_TEST_PASSWORD?.trim()

if (!EMAIL || !PASSWORD) {
  console.error('❌ SMOKE TEST SETUP FAILED: Missing SMOKE_TEST_EMAIL or SMOKE_TEST_PASSWORD in .env.test')
  process.exit(1)
}

async function main() {
  const results: SmokeResult[] = []

  const jar = new CookieJar()
  const client = wrapper(
    axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'AllerQ Smoke Auth Script',
      },
      withCredentials: true,
      jar,
    }) as any
  )
  ;(client.defaults as any).jar = jar
  client.defaults.withCredentials = true

  try {
    results.push(await runSignIn(client))

    if (!results.at(-1)?.success) {
      report(results)
      process.exit(1)
    }

    results.push(await runFetchMe(client))

    if (!results.at(-1)?.success) {
      report(results)
      process.exit(1)
    }

    results.push(await runLogout(client))

    const failed = results.some((result) => !result.success)
    report(results)
    process.exit(failed ? 1 : 0)
  } catch (error) {
    results.push({
      step: 'unexpected-error',
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error during smoke auth script',
    })
    report(results)
    process.exit(1)
  }
}

async function runSignIn(client: AxiosInstance): Promise<SmokeResult> {
  const step = 'sign-in'

  try {
    const response = await client.post(
      '/api/auth/sign-in',
      { email: EMAIL, password: PASSWORD },
      { validateStatus: () => true }
    )

    if (response.status !== 200 || response.data?.status !== 'success') {
      return {
        step,
        success: false,
        message: `Expected 200 and success, received status ${response.status}`,
      }
    }

    const rawCookies = normalizeSetCookieHeader(response.headers['set-cookie'])
    const sessionCookie = findSessionCookie(rawCookies)

    if (!sessionCookie) {
      return {
        step,
        success: false,
        message: 'Sign-in response missing __Host-allerq-token cookie',
      }
    }

    return {
      step,
      success: true,
      message: `Sign-in succeeded. Received session cookie (${sessionCookie.length} chars).`,
    }
  } catch (error) {
    return {
      step,
      success: false,
      message: formatAxiosError(error),
    }
  }
}

async function runFetchMe(client: AxiosInstance): Promise<SmokeResult> {
  const step = 'fetch-me'

  try {
    const response = await client.get('/api/auth/me', { validateStatus: () => true })

    if (response.status !== 200 || response.data?.status !== 'success') {
      return {
        step,
        success: false,
        message: `Expected 200 and success, received status ${response.status}`,
      }
    }

    const user = response.data?.user
    if (!user || typeof user !== 'object') {
      return {
        step,
        success: false,
        message: 'Response missing user payload',
      }
    }

    const missingFields = ['id', 'email', 'role'].filter((field) => !(field in user))
    if (missingFields.length > 0) {
      return {
        step,
        success: false,
        message: `User payload missing fields: ${missingFields.join(', ')}`,
      }
    }

    if ('uid' in user) {
      return {
        step,
        success: false,
        message: 'User payload should not expose uid field',
      }
    }

    return {
      step,
      success: true,
      message: `Authenticated as ${user.email} (role: ${user.role}).`,
    }
  } catch (error) {
    return {
      step,
      success: false,
      message: formatAxiosError(error),
    }
  }
}

async function runLogout(client: AxiosInstance): Promise<SmokeResult> {
  const step = 'logout'

  try {
    const response = await client.post('/api/auth/logout', undefined, { validateStatus: () => true })

    if (response.status !== 200 || response.data?.status !== 'success') {
      return {
        step,
        success: false,
        message: `Expected 200 and success, received status ${response.status}`,
      }
    }

    const rawCookies = normalizeSetCookieHeader(response.headers['set-cookie'])
    const cleared = rawCookies.some(
      (cookie) =>
        cookie.startsWith('__Host-allerq-token=') &&
        (/max-age=0/i.test(cookie) || /expires=Thu, 01 Jan 1970/i.test(cookie))
    )

    if (!cleared) {
      return {
        step,
        success: false,
        message: 'Logout response missing cookie invalidation header',
      }
    }

    return {
      step,
      success: true,
      message: 'Logout succeeded and session cookie cleared.',
    }
  } catch (error) {
    return {
      step,
      success: false,
      message: formatAxiosError(error),
    }
  }
}

function normalizeSetCookieHeader(header: unknown): string[] {
  if (!header) return []
  if (Array.isArray(header)) return header
  if (typeof header === 'string') return [header]
  return []
}

function findSessionCookie(cookies: string[]): string | null {
  return cookies.find((cookie) => cookie.startsWith('__Host-allerq-token=')) ?? null
}

function formatAxiosError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const message =
      error.response?.data && typeof error.response.data === 'object'
        ? JSON.stringify(error.response.data)
        : error.message
    return `Axios error${status ? ` (status ${status})` : ''}: ${message}`
  }

  return error instanceof Error ? error.message : 'Unknown error'
}

function report(results: SmokeResult[]) {
  console.log('\nAllerQ Auth Smoke Test Results:')
  for (const result of results) {
    const icon = result.success ? '✅' : '❌'
    console.log(`${icon} ${result.step}: ${result.message}`)
  }
}

main()
