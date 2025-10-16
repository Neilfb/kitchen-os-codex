import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'

import { NCDB_API_KEY, NCDB_SECRET_KEY, buildNcdbUrl } from './constants'
import { extractNcdbError } from './constants'

type HttpMethod = 'get' | 'post'

export interface NcdbRequestOptions {
  endpoint: string | string[]
  method?: HttpMethod
  payload?: Record<string, unknown>
  includeSecretKey?: boolean
  context?: string
  headers?: Record<string, string>
  timeoutMs?: number
}

export interface NcdbSuccessResponse<T = unknown> {
  status: 'success'
  data?: T
  id?: number | string
  record_id?: number | string
  message?: string
  [key: string]: unknown
}

export interface NcdbErrorResponse {
  status?: string
  message?: string
  error?: {
    message?: string
  }
  [key: string]: unknown
}

export type NcdbResponse<T = unknown> = NcdbSuccessResponse<T> | NcdbErrorResponse

export function isNcdbSuccess<T>(body: NcdbResponse<T>): body is NcdbSuccessResponse<T> {
  return (body as NcdbSuccessResponse<T>).status === 'success'
}

export function getNcdbErrorMessage(body: NcdbResponse): string | undefined {
  const messageCandidate = (body as { message?: unknown }).message
  if (typeof messageCandidate === 'string' && messageCandidate.trim()) {
    return messageCandidate.trim()
  }

  const errorMessage = (body as { error?: { message?: unknown } }).error?.message
  if (typeof errorMessage === 'string' && errorMessage.trim()) {
    return errorMessage.trim()
  }

  return undefined
}

function toEndpointList(endpoint: string | string[]): string[] {
  if (Array.isArray(endpoint)) {
    return endpoint
  }
  return [endpoint]
}

function buildPayload(payload: Record<string, unknown> | undefined, includeSecretKey: boolean): Record<string, unknown> {
  if (!includeSecretKey) {
    return payload ?? {}
  }

  return {
    secret_key: NCDB_SECRET_KEY,
    ...(payload ?? {}),
  }
}

async function executeRequest(
  endpoint: string,
  method: HttpMethod,
  options: NcdbRequestOptions,
  payload: Record<string, unknown>
): Promise<AxiosResponse<NcdbResponse>> {
  const axiosConfig: AxiosRequestConfig = {
    method,
    url: buildNcdbUrl(endpoint),
    headers: {
      Authorization: `Bearer ${NCDB_API_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    timeout: options.timeoutMs ?? 60000,
  }

  if (method === 'get') {
    axiosConfig.params = payload
  } else {
    axiosConfig.data = payload
  }

  return axios(axiosConfig)
}

export async function ncdbRequest<T = unknown>(
  options: NcdbRequestOptions
): Promise<{ endpoint: string; body: NcdbResponse<T> }> {
  const endpoints = toEndpointList(options.endpoint)
  const method: HttpMethod = options.method ?? 'post'
  const includeSecretKey = options.includeSecretKey ?? true
  const payload = buildPayload(options.payload, includeSecretKey)

  let lastError: unknown = null

  for (const endpoint of endpoints) {
    try {
      const response = await executeRequest(endpoint, method, options, payload)
      const body = (response.data ?? {}) as NcdbResponse<T>

      if ((body as NcdbSuccessResponse<T>).status === 'success' || response.status < 400) {
        return { endpoint, body }
      }

      const errorBody = body as NcdbErrorResponse
      const message = errorBody.message || errorBody.error?.message || 'NCDB request failed'
      lastError = new Error(message)
      console.error('[ncdbRequest] unexpected response', {
        context: options.context,
        endpoint,
        response: body,
      })
    } catch (error) {
      lastError = error
      console.error('[ncdbRequest] request failed', {
        context: options.context,
        endpoint,
        error,
      })
    }
  }

  const error = extractNcdbError(lastError)
  if (options.context) {
    error.message = `[${options.context}] ${error.message}`
  }
  throw error
}
