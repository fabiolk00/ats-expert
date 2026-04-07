import { getHttpStatusForToolError, TOOL_ERROR_CODES, type ToolErrorCode } from '@/lib/agent/tool-errors'
import {
  type BillingStatus,
  getPersistedSubscriptionMetadata,
  grantCreditsForEvent,
  updateSubscriptionMetadataForEvent,
} from '@/lib/asaas/credit-grants'
import {
  getCheckoutByAsaasSessionId,
  getCheckoutBySubscriptionId,
  getCheckoutRecord,
  markCheckoutCanceled,
  markCheckoutCanceledBySubscriptionId,
  markCheckoutPaid,
  markCheckoutSubscriptionActive,
  type BillingCheckout,
} from '@/lib/asaas/billing-checkouts'
import {
  parseExternalReference,
  type ParsedExternalReference,
} from '@/lib/asaas/external-reference'
import {
  getWebhookAmount,
  normalizeAsaasDateToIso,
  parseAsaasDate,
  type AsaasPayment,
  type AsaasWebhookEvent,
} from '@/lib/asaas/webhook'
import { logInfo, logWarn } from '@/lib/observability/structured-log'

type BillingApplyResult = 'processed' | 'duplicate' | 'ignored'
type BillingError = Error & {
  code: ToolErrorCode
  status: number
}

function createBillingError(code: ToolErrorCode, message: string): BillingError {
  const error = new Error(message) as BillingError
  error.code = code
  error.status = getHttpStatusForToolError(code)
  return error
}

function requireExternalReference(
  value: string | null | undefined,
  entityLabel: 'Payment' | 'Subscription',
): string {
  if (!value) {
    throw createBillingError(
      TOOL_ERROR_CODES.VALIDATION_ERROR,
      `${entityLabel} is missing externalReference.`,
    )
  }

  return value
}

function requireAmount(event: AsaasWebhookEvent, context: string): number {
  const amount = getWebhookAmount(event)

  if (typeof amount !== 'number') {
    throw createBillingError(
      TOOL_ERROR_CODES.VALIDATION_ERROR,
      `${context} is missing amount.`,
    )
  }

  return amount
}

function parseExternalReferenceStrict(
  value: string,
  eventType: AsaasWebhookEvent['event'],
): ParsedExternalReference {
  const parsed = parseExternalReference(value)
  if (!parsed) {
    throw createBillingError(
      TOOL_ERROR_CODES.VALIDATION_ERROR,
      'Invalid externalReference format.',
    )
  }

  if (parsed.version === 'legacy') {
    logWarn('billing.legacy_webhook_path', {
      eventType,
      appUserId: parsed.appUserId,
      success: false,
    })
  }

  return parsed
}

function tryParseExternalReference(value: string | null | undefined): ParsedExternalReference | null {
  if (!value) {
    return null
  }

  return parseExternalReference(value)
}

function assertCheckoutTrustAnchor(
  checkout: BillingCheckout | null,
  parsedReference: ParsedExternalReference,
  expectedStatus: 'created',
  expectedBilling: 'once' | 'monthly',
  amountMinor: number,
): BillingCheckout {
  if (!checkout) {
    throw createBillingError(
      TOOL_ERROR_CODES.VALIDATION_ERROR,
      'Billing checkout record not found for externalReference.',
    )
  }

  if (parsedReference.version !== 'v1') {
    throw createBillingError(
      TOOL_ERROR_CODES.VALIDATION_ERROR,
      'Legacy externalReference is not accepted for this event type.',
    )
  }

  if (checkout.checkoutReference !== parsedReference.checkoutReference) {
    throw createBillingError(
      TOOL_ERROR_CODES.VALIDATION_ERROR,
      'Billing checkout does not match the referenced checkout.',
    )
  }

  if (checkout.status !== expectedStatus) {
    throw createBillingError(
      TOOL_ERROR_CODES.VALIDATION_ERROR,
      `Billing checkout must be in ${expectedStatus} status.`,
    )
  }

  if (checkout.amountMinor !== amountMinor) {
    throw createBillingError(
      TOOL_ERROR_CODES.VALIDATION_ERROR,
      'Webhook amount does not match the billing checkout amount.',
    )
  }

  if (expectedBilling === 'once' && checkout.plan !== 'unit') {
    throw createBillingError(
      TOOL_ERROR_CODES.VALIDATION_ERROR,
      'One-time payments must resolve to the unit plan.',
    )
  }

  if (expectedBilling === 'monthly' && checkout.plan !== 'monthly' && checkout.plan !== 'pro') {
    throw createBillingError(
      TOOL_ERROR_CODES.VALIDATION_ERROR,
      'Recurring subscriptions must resolve to a monthly billing plan.',
    )
  }

  return checkout
}

function assertRecurringCheckout(checkout: BillingCheckout | null): BillingCheckout | null {
  if (!checkout) {
    return null
  }

  if (checkout.plan !== 'monthly' && checkout.plan !== 'pro') {
    throw createBillingError(
      TOOL_ERROR_CODES.VALIDATION_ERROR,
      'Recurring subscriptions must resolve to a monthly billing plan.',
    )
  }

  return checkout
}

function normalizeFutureRenewalDate(
  value: string | null | undefined,
  context: string,
  fallback?: string | null,
): string {
  const normalized = normalizeAsaasDateToIso(value) ?? normalizeAsaasDateToIso(fallback) ?? fallback ?? null
  if (!normalized) {
    throw createBillingError(
      TOOL_ERROR_CODES.VALIDATION_ERROR,
      `${context} is missing nextDueDate.`,
    )
  }

  const date = new Date(normalized)
  if (!Number.isFinite(date.getTime()) || date.getTime() <= Date.now()) {
    throw createBillingError(
      TOOL_ERROR_CODES.VALIDATION_ERROR,
      `${context} must be a future renewal date.`,
    )
  }

  return date.toISOString()
}

function addUtcMonths(date: Date, months: number): Date {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth() + months,
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
    date.getUTCMilliseconds(),
  ))
}

function deriveRecurringRenewsAtFromPayment(
  payment: AsaasPayment,
  fallback?: string | null,
): string | null {
  const baseline = parseAsaasDate(payment.dueDate)
    ?? parseAsaasDate(payment.confirmedDate)
    ?? parseAsaasDate(fallback)

  if (!baseline) {
    return null
  }

  return addUtcMonths(baseline, 1).toISOString()
}

function normalizePersistedBillingStatus(value: string | null | undefined): BillingStatus {
  if (value === 'canceled' || value === 'past_due') {
    return value
  }

  return 'active'
}

function mapSubscriptionStatusToBillingStatus(
  status: string | null | undefined,
  deleted: boolean | undefined,
  fallback: BillingStatus = 'active',
): BillingStatus {
  if (deleted) {
    return 'canceled'
  }

  switch (status?.trim().toUpperCase()) {
    case 'ACTIVE':
      return 'active'
    case 'OVERDUE':
    case 'PENDING':
      return 'past_due'
    case 'INACTIVE':
    case 'EXPIRED':
    case 'DELETED':
    case 'CANCELED':
    case 'CANCELLED':
      return 'canceled'
    default:
      return fallback
  }
}

function getCancellationReason(eventType: AsaasWebhookEvent['event']): 'subscription_deleted' | 'subscription_canceled' | 'subscription_inactivated' {
  if (eventType === 'SUBSCRIPTION_DELETED') {
    return 'subscription_deleted'
  }

  if (eventType === 'SUBSCRIPTION_INACTIVATED') {
    return 'subscription_inactivated'
  }

  return 'subscription_canceled'
}

function logIgnoredBillingEvent(
  event: AsaasWebhookEvent,
  eventFingerprint: string,
  reason: string,
): void {
  logInfo('billing.webhook.ignored', {
    eventType: event.event,
    eventFingerprint,
    paymentId: event.payment?.id ?? null,
    subscriptionId: event.subscription?.id ?? event.payment?.subscription ?? null,
    reason,
    success: true,
  })
}

async function handleOneTimePaymentSettlement(
  event: AsaasWebhookEvent,
  eventFingerprint: string,
  payment: AsaasPayment,
): Promise<BillingApplyResult> {
  const amountMinor = requireAmount(event, 'Payment event')
  let checkout: BillingCheckout

  if (payment.externalReference) {
    const parsedReference = parseExternalReferenceStrict(payment.externalReference, event.event)
    checkout = assertCheckoutTrustAnchor(
      await getCheckoutRecord(parsedReference.checkoutReference ?? ''),
      parsedReference,
      'created',
      'once',
      amountMinor,
    )
  } else if (payment.checkoutSession) {
    const referencedCheckout = await getCheckoutByAsaasSessionId(payment.checkoutSession)

    if (!referencedCheckout) {
      throw createBillingError(
        TOOL_ERROR_CODES.VALIDATION_ERROR,
        'Billing checkout record not found for checkoutSession.',
      )
    }

    if (referencedCheckout.status !== 'created') {
      throw createBillingError(
        TOOL_ERROR_CODES.VALIDATION_ERROR,
        'Billing checkout must be in created status.',
      )
    }

    if (referencedCheckout.amountMinor !== amountMinor) {
      throw createBillingError(
        TOOL_ERROR_CODES.VALIDATION_ERROR,
        'Webhook amount does not match the billing checkout amount.',
      )
    }

    if (referencedCheckout.plan !== 'unit') {
      throw createBillingError(
        TOOL_ERROR_CODES.VALIDATION_ERROR,
        'One-time payments must resolve to the unit plan.',
      )
    }

    checkout = referencedCheckout
  } else {
    throw createBillingError(
      TOOL_ERROR_CODES.VALIDATION_ERROR,
      'Payment is missing externalReference and checkoutSession.',
    )
  }

  const result = await grantCreditsForEvent({
    appUserId: checkout.userId,
    eventFingerprint,
    eventPayload: event,
    billingEventType: 'PAYMENT_SETTLED',
    plan: checkout.plan,
    amountMinor: checkout.amountMinor,
    checkoutReference: checkout.checkoutReference,
    isRenewal: false,
    reason: event.event === 'PAYMENT_CONFIRMED' ? 'payment_confirmed' : 'payment_received',
  })

  if (result === 'processed') {
    await markCheckoutPaid(checkout.checkoutReference, payment.id)
  }

  return result
}

async function handleInitialRecurringPaymentSettlement(
  event: AsaasWebhookEvent,
  eventFingerprint: string,
  payment: AsaasPayment,
  parsedReference: ParsedExternalReference,
  referencedCheckout: BillingCheckout | null,
): Promise<BillingApplyResult> {
  if (!payment.subscription) {
    throw createBillingError(
      TOOL_ERROR_CODES.VALIDATION_ERROR,
      `${event.event} event is missing payment.subscription.`,
    )
  }

  const amountMinor = requireAmount(event, 'Payment event')
  const checkout = assertCheckoutTrustAnchor(
    referencedCheckout,
    parsedReference,
    'created',
    'monthly',
    amountMinor,
  )

  const result = await grantCreditsForEvent({
    appUserId: checkout.userId,
    eventFingerprint,
    eventPayload: event,
    billingEventType: 'SUBSCRIPTION_STARTED',
    plan: checkout.plan,
    amountMinor: checkout.amountMinor,
    checkoutReference: checkout.checkoutReference,
    asaasSubscriptionId: payment.subscription,
    renewsAt: deriveRecurringRenewsAtFromPayment(payment),
    isRenewal: false,
    reason: 'subscription_started',
  })

  if (result === 'processed') {
    await markCheckoutSubscriptionActive(checkout.checkoutReference, payment.subscription)
  }

  return result
}

async function handleRecurringRenewalPaymentSettlement(
  event: AsaasWebhookEvent,
  eventFingerprint: string,
  payment: AsaasPayment,
): Promise<BillingApplyResult> {
  if (!payment.subscription) {
    throw createBillingError(
      TOOL_ERROR_CODES.VALIDATION_ERROR,
      `${event.event} event is missing payment.subscription.`,
    )
  }

  const persisted = await getPersistedSubscriptionMetadata(payment.subscription)

  if (!persisted) {
    throw createBillingError(
      TOOL_ERROR_CODES.NOT_FOUND,
      `No persisted subscription metadata was found for subscription ${payment.subscription}.`,
    )
  }

  const checkout = assertRecurringCheckout(await getCheckoutBySubscriptionId(payment.subscription))

  logInfo('billing.subscription_renewal.resolved', {
    asaasSubscriptionId: payment.subscription,
    appUserId: persisted.appUserId,
    plan: persisted.plan,
    rawEventType: event.event,
    success: true,
  })

  return grantCreditsForEvent({
    appUserId: persisted.appUserId,
    eventFingerprint,
    eventPayload: event,
    billingEventType: 'SUBSCRIPTION_RENEWED',
    plan: persisted.plan,
    checkoutReference: checkout?.checkoutReference ?? null,
    asaasSubscriptionId: payment.subscription,
    renewsAt: deriveRecurringRenewsAtFromPayment(payment, persisted.renewsAt),
    isRenewal: true,
    reason: 'subscription_renewed',
  })
}

export async function handlePaymentSettlement(
  event: AsaasWebhookEvent,
  eventFingerprint: string,
): Promise<BillingApplyResult> {
  const payment = event.payment

  if (!payment) {
    throw createBillingError(
      TOOL_ERROR_CODES.VALIDATION_ERROR,
      `${event.event} event is missing payment.`,
    )
  }

  if (!payment.subscription) {
    return handleOneTimePaymentSettlement(event, eventFingerprint, payment)
  }

  const parsedReference = tryParseExternalReference(payment.externalReference)
  const referencedCheckout = parsedReference?.version === 'v1' && parsedReference.checkoutReference
    ? await getCheckoutRecord(parsedReference.checkoutReference)
    : null

  if (parsedReference?.version === 'v1' && referencedCheckout?.status === 'created') {
    return handleInitialRecurringPaymentSettlement(
      event,
      eventFingerprint,
      payment,
      parsedReference,
      referencedCheckout,
    )
  }

  return handleRecurringRenewalPaymentSettlement(event, eventFingerprint, payment)
}

async function reconcilePaymentSettlementState(payment: AsaasPayment): Promise<void> {
  const parsedReference = tryParseExternalReference(payment.externalReference)

  if (!payment.subscription) {
    if (parsedReference?.version === 'v1' && parsedReference.checkoutReference) {
      const checkout = await getCheckoutRecord(parsedReference.checkoutReference)
      if (checkout && checkout.status !== 'paid') {
        await markCheckoutPaid(checkout.checkoutReference, payment.id)
      }
    }

    return
  }

  if (parsedReference?.version === 'v1' && parsedReference.checkoutReference) {
    const checkout = await getCheckoutRecord(parsedReference.checkoutReference)
    if (checkout && (checkout.plan === 'monthly' || checkout.plan === 'pro') && checkout.status === 'created') {
      await markCheckoutSubscriptionActive(checkout.checkoutReference, payment.subscription)
      return
    }
  }

  const checkout = await getCheckoutBySubscriptionId(payment.subscription)
  if (checkout && checkout.status === 'created') {
    await markCheckoutSubscriptionActive(checkout.checkoutReference, payment.subscription)
  }
}

async function reconcileCanceledSnapshot(subscription: NonNullable<AsaasWebhookEvent['subscription']>): Promise<void> {
  await markCheckoutCanceledBySubscriptionId(subscription.id)

  const parsedReference = tryParseExternalReference(subscription.externalReference)
  if (parsedReference?.version === 'v1' && parsedReference.checkoutReference) {
    const checkout = await getCheckoutRecord(parsedReference.checkoutReference)
    if (checkout?.status === 'created') {
      await markCheckoutCanceled(checkout.checkoutReference)
    }
  }
}

export async function reconcileProcessedEventState(event: AsaasWebhookEvent): Promise<void> {
  switch (event.event) {
    case 'PAYMENT_CONFIRMED':
    case 'PAYMENT_RECEIVED':
      if (event.payment) {
        await reconcilePaymentSettlementState(event.payment)
      }
      return
    case 'SUBSCRIPTION_CREATED':
      if (event.subscription) {
        const status = mapSubscriptionStatusToBillingStatus(event.subscription.status, event.subscription.deleted)
        if (status !== 'active') {
          await reconcileCanceledSnapshot(event.subscription)
        }
      }
      return
    case 'SUBSCRIPTION_UPDATED':
      if (event.subscription) {
        const status = mapSubscriptionStatusToBillingStatus(event.subscription.status, event.subscription.deleted)
        if (status === 'canceled') {
          await reconcileCanceledSnapshot(event.subscription)
        }
      }
      return
    case 'SUBSCRIPTION_INACTIVATED':
    case 'SUBSCRIPTION_DELETED':
    case 'SUBSCRIPTION_CANCELED':
      if (event.subscription) {
        await reconcileCanceledSnapshot(event.subscription)
      }
      return
    default:
      return
  }
}

export async function handleSubscriptionCreated(
  event: AsaasWebhookEvent,
  eventFingerprint: string,
): Promise<BillingApplyResult> {
  const subscription = event.subscription

  if (!subscription) {
    throw createBillingError(
      TOOL_ERROR_CODES.VALIDATION_ERROR,
      'SUBSCRIPTION_CREATED event is missing subscription.',
    )
  }

  const parsedReference = tryParseExternalReference(subscription.externalReference)
  const referencedCheckout = parsedReference?.version === 'v1' && parsedReference.checkoutReference
    ? await getCheckoutRecord(parsedReference.checkoutReference)
    : null
  const status = mapSubscriptionStatusToBillingStatus(subscription.status, subscription.deleted)

  if (status !== 'active') {
    if (referencedCheckout?.status === 'created') {
      await markCheckoutCanceled(referencedCheckout.checkoutReference)
    }

    logIgnoredBillingEvent(event, eventFingerprint, 'subscription_snapshot_not_active')
    return 'ignored'
  }

  logIgnoredBillingEvent(event, eventFingerprint, 'subscription_created_not_trust_anchor')
  return 'ignored'
}

export async function handleSubscriptionUpdated(
  event: AsaasWebhookEvent,
  eventFingerprint: string,
): Promise<BillingApplyResult> {
  const subscription = event.subscription

  if (!subscription) {
    throw createBillingError(
      TOOL_ERROR_CODES.VALIDATION_ERROR,
      'SUBSCRIPTION_UPDATED event is missing subscription.',
    )
  }

  const persisted = await getPersistedSubscriptionMetadata(subscription.id)
  const fallbackStatus = persisted ? normalizePersistedBillingStatus(persisted.status) : 'active'
  const status = mapSubscriptionStatusToBillingStatus(subscription.status, subscription.deleted, fallbackStatus)

  if (!persisted) {
    const parsedReference = tryParseExternalReference(subscription.externalReference)
    if (status === 'canceled' && parsedReference?.version === 'v1' && parsedReference.checkoutReference) {
      const checkout = await getCheckoutRecord(parsedReference.checkoutReference)
      if (checkout?.status === 'created') {
        await markCheckoutCanceled(checkout.checkoutReference)
      }
    }

    logIgnoredBillingEvent(event, eventFingerprint, 'subscription_metadata_missing')
    return 'ignored'
  }

  const result = await updateSubscriptionMetadataForEvent({
    appUserId: persisted.appUserId,
    eventFingerprint,
    eventPayload: event,
    billingEventType: 'SUBSCRIPTION_UPDATED',
    plan: persisted.plan,
    asaasSubscriptionId: subscription.id,
    renewsAt: status === 'canceled'
      ? null
      : normalizeAsaasDateToIso(subscription.nextDueDate) ?? persisted.renewsAt,
    status,
    reason: 'subscription_updated',
  })

  if (result === 'processed' && status === 'canceled') {
    await markCheckoutCanceledBySubscriptionId(subscription.id)
  }

  return result
}

export async function handleSubscriptionRenewed(
  event: AsaasWebhookEvent,
  eventFingerprint: string,
): Promise<BillingApplyResult> {
  const subscription = event.subscription

  if (!subscription) {
    throw createBillingError(
      TOOL_ERROR_CODES.VALIDATION_ERROR,
      'SUBSCRIPTION_RENEWED event is missing subscription.',
    )
  }

  const persisted = await getPersistedSubscriptionMetadata(subscription.id)

  if (!persisted) {
    throw createBillingError(
      TOOL_ERROR_CODES.NOT_FOUND,
      `No persisted subscription metadata was found for subscription ${subscription.id}.`,
    )
  }

  const checkout = assertRecurringCheckout(await getCheckoutBySubscriptionId(subscription.id))
  const renewsAt = normalizeFutureRenewalDate(
    subscription.nextDueDate,
    'Subscription renewal event',
    persisted.renewsAt,
  )

  logInfo('billing.subscription_renewal.resolved', {
    asaasSubscriptionId: subscription.id,
    appUserId: persisted.appUserId,
    plan: persisted.plan,
    rawEventType: event.event,
    success: true,
  })

  return grantCreditsForEvent({
    appUserId: persisted.appUserId,
    eventFingerprint,
    eventPayload: event,
    billingEventType: 'SUBSCRIPTION_RENEWED',
    plan: persisted.plan,
    checkoutReference: checkout?.checkoutReference ?? null,
    asaasSubscriptionId: subscription.id,
    renewsAt,
    isRenewal: true,
    reason: 'subscription_renewed',
  })
}

export async function handleSubscriptionCanceled(
  event: AsaasWebhookEvent,
  eventFingerprint: string,
): Promise<BillingApplyResult> {
  const subscription = event.subscription

  if (!subscription) {
    throw createBillingError(
      TOOL_ERROR_CODES.VALIDATION_ERROR,
      `${event.event} event is missing subscription.`,
    )
  }

  const persisted = await getPersistedSubscriptionMetadata(subscription.id)

  if (!persisted) {
    const parsedReference = tryParseExternalReference(subscription.externalReference)
    if (parsedReference?.version === 'v1' && parsedReference.checkoutReference) {
      const checkout = await getCheckoutRecord(parsedReference.checkoutReference)
      if (checkout?.status === 'created') {
        await markCheckoutCanceled(checkout.checkoutReference)
      }
    }

    logIgnoredBillingEvent(event, eventFingerprint, 'subscription_metadata_missing')
    return 'ignored'
  }

  const result = await updateSubscriptionMetadataForEvent({
    appUserId: persisted.appUserId,
    eventFingerprint,
    eventPayload: event,
    billingEventType: 'SUBSCRIPTION_CANCELED',
    plan: persisted.plan,
    asaasSubscriptionId: subscription.id,
    renewsAt: null,
    status: 'canceled',
    reason: getCancellationReason(event.event),
  })

  if (result === 'processed') {
    await markCheckoutCanceledBySubscriptionId(subscription.id)
  }

  return result
}
