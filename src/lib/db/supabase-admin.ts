import { createClient, type SupabaseClient } from '@supabase/supabase-js'

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

  cachedSupabaseAdminClient = createClient(url, serviceRoleKey)
  return cachedSupabaseAdminClient
}
