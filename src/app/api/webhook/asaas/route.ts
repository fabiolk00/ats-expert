import { NextRequest, NextResponse } from 'next/server'

import { resolveAppUserIdFromReference } from '@/lib/auth/app-user'
import { grantCredits, revokeSubscription } from '@/lib/asaas/quota'
import { getSupabaseAdminClient } from '@/lib/db/supabase-admin'
import { logError, logInfo, logWarn, serializeError } from '@/lib/observability/structured-log'
import {
  createAsaasProcessedEventId,
  parseAsaasExternalReference,
  parseAsaasWebhookEvent,
  type AsaasWebhookEvent,
} from '@/lib/asaas/webhook'

export const runtime = 'nodejs'

type ProcessedEventLookupRow = {
  id: string
}

async function findProcessedEvent(eventId: string, eventType: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from('processed_events')
    .select('id')
    .eq('event_id', eventId)
    .eq('event_type', eventType)
    .maybeSingle<ProcessedEventLookupRow>()

  if (error) {
    throw new Error(`Failed to look up processed Asaas event: ${error.message}`)
  }

  return Boolean(data?.id)
}

async function markProcessedEvent(eventId: string, eventType: string): Promise<'inserted' | 'duplicate'> {
  const supabase = getSupabaseAdminClient()
  const { error } = await supabase
    .from('processed_events')
    .insert({ event_id: eventId, event_type: eventType })

  if (!error) {
    return 'inserted'
  }

  if (error.code === '23505') {
    return 'duplicate'
  }

  throw new Error(`Failed to persist processed Asaas event: ${error.message}`)
}

async function resolveAppUserIdOrThrow(referenceUserId: string): Promise<string> {
  const appUserId = await resolveAppUserIdFromReference(referenceUserId)

  if (!appUserId) {
    throw new Error(`Could not resolve app user from Asaas reference: ${referenceUserId}`)
  }

  return appUserId
}

async function processAsaasEvent(event: AsaasWebhookEvent): Promise<void> {
  const { event: eventType, payment, subscription } = event

  if (eventType === 'PAYMENT_RECEIVED' || eventType === 'PAYMENT_CONFIRMED') {
    if (!payment?.subscription) {
      const { referenceUserId, plan } = parseAsaasExternalReference(payment?.externalReference ?? '')
      const appUserId = await resolveAppUserIdOrThrow(referenceUserId)
      await grantCredits(appUserId, plan)
    }

    return
  }

  if (eventType === 'SUBSCRIPTION_RENEWED') {
    const subId = subscription?.id
    if (!subId) {
      throw new Error('Asaas subscription renewal is missing subscription.id.')
    }

    const reference = subscription?.externalReference ?? payment?.externalReference ?? ''
    const { referenceUserId, plan } = parseAsaasExternalReference(reference)
    const appUserId = await resolveAppUserIdOrThrow(referenceUserId)
    await grantCredits(appUserId, plan, subId)
    return
  }

  if (eventType === 'SUBSCRIPTION_DELETED') {
    if (!subscription?.id) {
      throw new Error('Asaas subscription deletion is missing subscription.id.')
    }

    await revokeSubscription(subscription.id)
    return
  }

  if (eventType === 'PAYMENT_OVERDUE') {
    if (!payment?.subscription) {
      throw new Error('Asaas overdue payment event is missing payment.subscription.')
    }

    await revokeSubscription(payment.subscription)
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const token = req.headers.get('asaas-access-token')
  if (token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    logWarn('asaas.webhook.unauthorized', {
      success: false,
      processedStatus: 'rejected',
    })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rawBody = await req.text()
  let event: AsaasWebhookEvent
  let processedEventId: string

  try {
    const parsedBody: unknown = JSON.parse(rawBody)
    event = parseAsaasWebhookEvent(parsedBody)
    processedEventId = createAsaasProcessedEventId(parsedBody)
  } catch (error) {
    logWarn('asaas.webhook.invalid_payload', {
      success: false,
      processedStatus: 'rejected',
      ...serializeError(error),
    })
    return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 })
  }

  const { event: eventType, payment, subscription } = event

  try {
    const alreadyProcessed = await findProcessedEvent(processedEventId, eventType)
    if (alreadyProcessed) {
      logInfo('asaas.webhook.duplicate_skipped', {
        eventType,
        processedEventId,
        paymentId: payment?.id,
        subscriptionId: subscription?.id,
        success: true,
        processedStatus: 'skipped_duplicate',
      })
      return NextResponse.json({ received: true, skipped: true })
    }

    await processAsaasEvent(event)

    const markResult = await markProcessedEvent(processedEventId, eventType)
    if (markResult === 'duplicate') {
      logInfo('asaas.webhook.duplicate_skipped', {
        eventType,
        processedEventId,
        paymentId: payment?.id,
        subscriptionId: subscription?.id,
        success: true,
        processedStatus: 'skipped_duplicate',
      })
      return NextResponse.json({ received: true, skipped: true })
    }

    logInfo('asaas.webhook.processed', {
      eventType,
      processedEventId,
      paymentId: payment?.id,
      subscriptionId: subscription?.id,
      success: true,
      processedStatus: 'processed',
    })
    return NextResponse.json({ received: true })
  } catch (err) {
    logError('asaas.webhook.failed', {
      eventType,
      processedEventId,
      paymentId: payment?.id,
      subscriptionId: subscription?.id,
      success: false,
      processedStatus: 'failed',
      ...serializeError(err),
    })
    return NextResponse.json({ error: 'Failed to process webhook event' }, { status: 500 })
  }
}
