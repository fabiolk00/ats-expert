import { createHash } from 'node:crypto'

import { PLANS, type PlanSlug } from '@/lib/plans'

export type AsaasPayment = {
  id: string
  externalReference?: string
  subscription?: string | null
}

export type AsaasSubscription = {
  id: string
  externalReference?: string
}

export type AsaasWebhookEvent = {
  event: string
  payment?: AsaasPayment
  subscription?: AsaasSubscription
}

type JsonPrimitive = string | number | boolean | null
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toJsonValue(value: unknown): JsonValue {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value
  }

  if (Array.isArray(value)) {
    return value.map(toJsonValue)
  }

  if (isRecord(value)) {
    const entries = Object.entries(value).map(([key, nestedValue]) => [key, toJsonValue(nestedValue)] as const)
    return Object.fromEntries(entries)
  }

  throw new Error('Asaas webhook payload contains an unsupported value.')
}

function stableStringify(value: JsonValue): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value)
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`
  }

  const sortedKeys = Object.keys(value).sort()
  const serializedEntries = sortedKeys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
  return `{${serializedEntries.join(',')}}`
}

function isAsaasPayment(value: unknown): value is AsaasPayment {
  if (!isRecord(value) || typeof value.id !== 'string') {
    return false
  }

  return (
    value.externalReference === undefined ||
    typeof value.externalReference === 'string'
  ) && (
    value.subscription === undefined ||
    value.subscription === null ||
    typeof value.subscription === 'string'
  )
}

function isAsaasSubscription(value: unknown): value is AsaasSubscription {
  if (!isRecord(value) || typeof value.id !== 'string') {
    return false
  }

  return value.externalReference === undefined || typeof value.externalReference === 'string'
}

export function parseAsaasWebhookEvent(value: unknown): AsaasWebhookEvent {
  if (!isRecord(value) || typeof value.event !== 'string') {
    throw new Error('Asaas webhook payload is missing the event type.')
  }

  if (value.payment !== undefined && !isAsaasPayment(value.payment)) {
    throw new Error('Asaas webhook payload contains an invalid payment object.')
  }

  if (value.subscription !== undefined && !isAsaasSubscription(value.subscription)) {
    throw new Error('Asaas webhook payload contains an invalid subscription object.')
  }

  return {
    event: value.event,
    payment: value.payment,
    subscription: value.subscription,
  }
}

export function createAsaasProcessedEventId(payload: unknown): string {
  const canonicalPayload = stableStringify(toJsonValue(payload))
  const digest = createHash('sha256').update(canonicalPayload).digest('hex')
  return `asaas:${digest}`
}

export function isPlanSlug(value: string): value is PlanSlug {
  return value in PLANS
}

export function parseAsaasExternalReference(reference: string): {
  referenceUserId: string
  plan: PlanSlug
} {
  const [referenceUserId, rawPlan] = reference.split(':')

  if (!referenceUserId || !rawPlan) {
    throw new Error('Asaas external reference is missing required fields.')
  }

  if (!isPlanSlug(rawPlan)) {
    throw new Error(`Unsupported Asaas plan slug: ${rawPlan}`)
  }

  return {
    referenceUserId,
    plan: rawPlan,
  }
}
