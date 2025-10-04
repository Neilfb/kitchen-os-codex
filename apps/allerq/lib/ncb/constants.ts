import type { z } from 'zod'

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

type NcdbErrorPayload = {
  response?: {
    data?: {
      error?: { message?: string }
      message?: string
    }
  }
  message?: string
}

export function extractNcdbError(error: unknown): Error {
  const axiosError = error as NcdbErrorPayload
  return new Error(
    axiosError.response?.data?.error?.message ||
      axiosError.response?.data?.message ||
      axiosError.message ||
      'Unknown NCDB error'
  )
}

export function ensureParseSuccess<Output, Def extends z.ZodTypeDef, Input>(
  schema: z.ZodType<Output, Def, Input>,
  data: Input,
  context: string
): Output {
  const result = schema.safeParse(data)

  if (!result.success) {
    const errorResult = result as z.SafeParseError<Input>
    console.error(`[${context}] validation error`, errorResult.error.flatten())
    throw new Error(`${context} failed validation`)
  }

  return result.data
}
