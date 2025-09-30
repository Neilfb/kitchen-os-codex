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

export const buildNcdbUrl = (path: string) => `${NCDB_BASE_URL}/${path.replace(/^\//, '')}?Instance=${NCDB_INSTANCE}`

export function extractNcdbError(error: unknown): Error {
  const axiosError = error as { response?: any; message?: string }
  return new Error(
    axiosError.response?.data?.error?.message ||
      axiosError.response?.data?.message ||
      axiosError.message ||
      'Unknown NCDB error'
  )
}
