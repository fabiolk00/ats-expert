import { createClient } from '@supabase/supabase-js'

import { PLANS, type PlanSlug } from '@/lib/plans'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function grantCredits(
  userId: string,
  plan: PlanSlug,
  asaasSubscriptionId?: string,
): Promise<void> {
  const planConfig = PLANS[plan]
  const renewsAt = planConfig.billing === 'monthly'
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    : null

  await supabase.from('user_quotas').upsert(
    {
      user_id: userId,
      plan,
      credits_remaining: planConfig.credits,
      asaas_subscription_id: asaasSubscriptionId ?? null,
      renews_at: renewsAt,
    },
    { onConflict: 'user_id' },
  )
}

export async function consumeCredit(userId: string): Promise<boolean> {
  // ATOMIC OPERATION: First check current credits, then decrement ONLY if > 0
  // Using SELECT FOR UPDATE would be ideal, but Supabase JS client doesn't support it
  // Instead, we use an RPC function for true atomicity

  const { data: rpcResult, error: rpcError } = await supabase.rpc('consume_credit_atomic', {
    p_user_id: userId,
  })

  // Fallback if RPC function doesn't exist: use optimistic locking
  // This is not perfectly atomic but much better than the previous implementation
  if (rpcError && rpcError.message.includes('function') && rpcError.message.includes('does not exist')) {
    // Read current credits
    const { data: quotaData } = await supabase
      .from('user_quotas')
      .select('credits_remaining')
      .eq('user_id', userId)
      .single()

    if (!quotaData || quotaData.credits_remaining <= 0) return false

    // Attempt atomic decrement using WHERE clause with optimistic locking
    // UPDATE user_quotas SET credits_remaining = credits_remaining - 1
    // WHERE user_id = X AND credits_remaining = Y (current value)
    const { data: updateData, error: updateError } = await supabase
      .from('user_quotas')
      .update({
        credits_remaining: quotaData.credits_remaining - 1,
      })
      .eq('user_id', userId)
      .eq('credits_remaining', quotaData.credits_remaining)  // Optimistic lock: only update if value hasn't changed
      .select('credits_remaining')

    // If no data returned, credits changed between read and write (race condition detected)
    // The update failed because another request modified credits_remaining
    return !updateError && updateData !== null && updateData.length > 0
  }

  if (rpcError) return false
  return rpcResult === true
}

export async function revokeSubscription(asaasSubscriptionId: string): Promise<void> {
  await supabase
    .from('user_quotas')
    .update({
      plan: 'free',
      credits_remaining: 0,
      asaas_subscription_id: null,
    })
    .eq('asaas_subscription_id', asaasSubscriptionId)
}

export async function getUserIdByCustomer(asaasCustomerId: string): Promise<string | null> {
  const { data } = await supabase
    .from('user_quotas')
    .select('user_id')
    .eq('asaas_customer_id', asaasCustomerId)
    .single()

  return (data?.user_id as string | undefined) ?? null
}

export async function checkUserQuota(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_quotas')
    .select('plan, credits_remaining')
    .eq('user_id', userId)
    .single()

  if (!data) return false
  return data.credits_remaining > 0
}
