import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let cachedSupabaseAdminClient: SupabaseClient | null = null

export function getSupabaseAdminClient(): SupabaseClient {
  if (cachedSupabaseAdminClient) {
    return cachedSupabaseAdminClient
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase admin environment variables are not configured.')
  }

  cachedSupabaseAdminClient = createClient(url, serviceRoleKey)
  return cachedSupabaseAdminClient
}
