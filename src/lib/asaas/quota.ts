import { createClient } from '@supabase/supabase-js'

import { PLANS, type PlanKey } from '@/lib/asaas/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function grantCredits(
  userId: string,
  plan: PlanKey,
  asaasSubscriptionId?: string,
): Promise<void> {
  const planConfig = PLANS[plan]
  const renewsAt = plan !== 'one_time'
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
  const { data } = await supabase
    .from('user_quotas')
    .select('plan, credits_remaining')
    .eq('user_id', userId)
    .single()

  if (!data) return false
  if (data.plan === 'pro') return true
  if (data.credits_remaining <= 0) return false

  await supabase
    .from('user_quotas')
    .update({ credits_remaining: data.credits_remaining - 1 })
    .eq('user_id', userId)

  return true
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
  if (data.plan === 'pro') return true
  return data.credits_remaining > 0
}
