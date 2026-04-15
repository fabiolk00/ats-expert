import 'server-only'

import { logError, logInfo } from '@/lib/observability/structured-log'

const BASE_URL = process.env.ASAAS_SANDBOX === 'true'
  ? 'https://sandbox.asaas.com/api/v3'
  : 'https://www.asaas.com/api/v3'

type AsaasErrorResponse = {
  errors?: Array<{
    code?: string
    description?: string
  }>
}

function getRequiredAsaasAccessToken(envValue = process.env.ASAAS_ACCESS_TOKEN): string {
  const trimmed = envValue?.trim()

  if (!trimmed) {
    throw new Error('Missing required environment variable ASAAS_ACCESS_TOKEN for Asaas client.')
  }

  return trimmed
}

function summarizeAsaasError(method: string, path: string, status: number, responseText: string): string {
  try {
    const parsed = JSON.parse(responseText) as AsaasErrorResponse
    const details = parsed.errors
      ?.map((error) => [error.code, error.description].filter(Boolean).join(': '))
      .filter((entry) => entry.length > 0)
      .join(' | ')

    if (details && details.length > 0) {
      return `Asaas ${method} ${path} -> ${status}: ${details}`
    }
  } catch {
    // Fall through to the generic message when the provider returns a non-JSON body.
  }

  return `Asaas ${method} ${path} -> ${status}: request failed`
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const url = `${BASE_URL}${path}`
  void body

  logInfo('asaas.request.started', {
    method,
    path,
  })

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      access_token: getRequiredAsaasAccessToken(),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const text = await res.text()

  logInfo('asaas.request.finished', {
    method,
    path,
    status: res.status,
    ok: res.ok,
  })

  if (!res.ok) {
    const errorMessage = summarizeAsaasError(method, path, res.status, text)

    logError('asaas.request.failed', {
      method,
      path,
      status: res.status,
      errorMessage,
    })

    throw new Error(errorMessage)
  }

  return JSON.parse(text) as T
}

export const asaas = {
  get: <T>(path: string): Promise<T> => request<T>('GET', path),
  post: <T>(path: string, body: unknown): Promise<T> => request<T>('POST', path, body),
  put: <T>(path: string, body: unknown): Promise<T> => request<T>('PUT', path, body),
  delete: <T>(path: string): Promise<T> => request<T>('DELETE', path),
}
