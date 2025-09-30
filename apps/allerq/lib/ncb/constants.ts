const DEFAULT_BASE_URL = 'https://api.nocodebackend.com'

function getRequiredEnv(name: string): string {
  const value = process.env[name]
  if (!value || !value.trim()) {
    throw new Error(`Environment variable ${name} is required for NoCodeBackend integration`)
  }
  return value.trim()
}

export const NCDB_BASE_URL = (process.env.NCDB_BASE_URL || DEFAULT_BASE_URL).trim().replace(/\/$/, '')
export const NCDB_INSTANCE = getRequiredEnv('NCDB_INSTANCE')
export const NCDB_API_KEY = getRequiredEnv('NCDB_API_KEY')
export const NCDB_SECRET_KEY = getRequiredEnv('NCDB_SECRET_KEY')

export function buildNcdbUrl(path: string): string {
  const url = new URL(path, `${NCDB_BASE_URL}/`)
  url.searchParams.set('Instance', NCDB_INSTANCE)
  return url.toString()
}

export interface NcdbResponse<T> {
  status: 'success' | 'error'
  data?: T
  message?: string
}

export function extractNcdbError(error: unknown): Error {
  if (typeof error === 'string') {
    return new Error(error)
  }

  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: unknown }; message?: string }
    const responseData = axiosError.response?.data
    if (typeof responseData === 'string') {
      return new Error(responseData)
    }

    if (responseData && typeof responseData === 'object' && 'message' in responseData && typeof (responseData as { message: unknown }).message === 'string') {
      return new Error((responseData as { message: string }).message)
    }

    if (axiosError.message) {
      return new Error(axiosError.message)
    }
  }

  return error instanceof Error ? error : new Error('Unexpected NoCodeBackend error')
}
