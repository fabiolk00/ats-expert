import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { recordQuery } from '@/lib/observability/request-query-context'

let cachedSupabaseAdminClient: SupabaseClient | null = null

function getRequiredSupabaseEnv(
  name: 'NEXT_PUBLIC_SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY',
): string {
  const trimmed = process.env[name]?.trim()

  if (!trimmed) {
    throw new Error(`Missing required environment variable ${name} for Supabase admin client.`)
  }

  return trimmed
}

export function getSupabaseAdminClient(): SupabaseClient {
  if (cachedSupabaseAdminClient) {
    return cachedSupabaseAdminClient
  }

  const url = getRequiredSupabaseEnv('NEXT_PUBLIC_SUPABASE_URL')
  const serviceRoleKey = getRequiredSupabaseEnv('SUPABASE_SERVICE_ROLE_KEY')

  cachedSupabaseAdminClient = createClient(url, serviceRoleKey, {
    global: {
      fetch: async (input, init) => {
        const querySample = describeDatabaseRequest(input, init)
        if (querySample) {
          recordQuery(querySample)
        }

        return fetch(input, init)
      },
    },
  })
  return cachedSupabaseAdminClient
}

function describeDatabaseRequest(input: RequestInfo | URL, init?: RequestInit): string | null {
  const requestUrl = readRequestUrl(input)
  if (!requestUrl) {
    return null
  }

  const normalizedUrl = tryParseUrl(requestUrl)
  if (!normalizedUrl || !normalizedUrl.pathname.includes('/rest/v1/')) {
    return null
  }

  const method = readRequestMethod(input, init)
  const path = normalizedUrl.pathname
  const search = normalizedUrl.search

  return search ? `${method} ${path}${search}` : `${method} ${path}`
}

function readRequestMethod(input: RequestInfo | URL, init?: RequestInit): string {
  if (init?.method) {
    return init.method.toUpperCase()
  }

  if (typeof Request !== 'undefined' && input instanceof Request) {
    return input.method.toUpperCase()
  }

  return 'GET'
}

function readRequestUrl(input: RequestInfo | URL): string | null {
  if (typeof input === 'string') {
    return input
  }

  if (input instanceof URL) {
    return input.toString()
  }

  if (typeof Request !== 'undefined' && input instanceof Request) {
    return input.url
  }

  return null
}

function tryParseUrl(value: string): URL | null {
  try {
    return new URL(value)
  } catch {
    return null
  }
}
