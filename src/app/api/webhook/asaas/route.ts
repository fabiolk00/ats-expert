import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

import { grantCredits, revokeSubscription } from '@/lib/asaas/quota'
import type { PlanSlug } from '@/lib/plans'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

type AsaasPayment = {
  id: string
  externalReference?: string
  subscription?: string | null
}

type AsaasSubscription = {
  id: string
  externalReference?: string
}

type AsaasWebhookEvent = {
  event: string
  payment?: AsaasPayment
  subscription?: AsaasSubscription
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const token = req.headers.get('asaas-access-token')
  if (token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const event = (await req.json()) as AsaasWebhookEvent
  const { event: eventType, payment, subscription } = event

  const eventId = payment?.id ?? subscription?.id
  if (!eventId) return NextResponse.json({ received: true })

  const { data: existing } = await supabase
    .from('processed_events')
    .select('id')
    .eq('event_id', eventId)
    .eq('event_type', eventType)
    .single()

  if (existing) return NextResponse.json({ received: true, skipped: true })

  await supabase.from('processed_events').insert({ event_id: eventId, event_type: eventType })

  try {
    if (eventType === 'PAYMENT_RECEIVED' || eventType === 'PAYMENT_CONFIRMED') {
      if (!payment?.subscription) {
        const [userId, plan] = (payment?.externalReference ?? '').split(':')
        if (userId && plan) {
          await grantCredits(userId, plan as PlanSlug)
        }
      }
    } else if (eventType === 'SUBSCRIPTION_RENEWED') {
      const subId = subscription?.id
      const ref = subscription?.externalReference ?? payment?.externalReference ?? ''
      const [userId, plan] = ref.split(':')
      if (userId && plan) {
        await grantCredits(userId, plan as PlanSlug, subId)
      }
    } else if (eventType === 'SUBSCRIPTION_DELETED') {
      if (subscription?.id) await revokeSubscription(subscription.id)
    } else if (eventType === 'PAYMENT_OVERDUE') {
      if (payment?.subscription) {
        await revokeSubscription(payment.subscription)
      }
    }
  } catch (err) {
    console.error('[webhook/asaas]', err)
  }

  return NextResponse.json({ received: true })
}
