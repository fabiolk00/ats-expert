import { describe, expect, it } from 'vitest'

import {
  getWebhookAmount,
  isHandledAsaasBillingEvent,
  normalizeAsaasDateToIso,
  parseAsaasWebhookEvent,
} from './webhook'

describe('Asaas webhook parsing', () => {
  it('parses settled payment events that only provide payment.value', () => {
    const event = parseAsaasWebhookEvent({
      event: 'PAYMENT_RECEIVED',
      payment: {
        id: 'pay_123',
        externalReference: 'curria:v1:c:chk_123',
        subscription: null,
        value: 19.9,
      },
    })

    expect(event).toEqual({
      event: 'PAYMENT_RECEIVED',
      payment: {
        id: 'pay_123',
        externalReference: 'curria:v1:c:chk_123',
        subscription: null,
        value: 19.9,
      },
    })
    expect(getWebhookAmount(event)).toBe(1990)
  })

  it('parses current subscription events with nullable externalReference', () => {
    const event = parseAsaasWebhookEvent({
      event: 'SUBSCRIPTION_UPDATED',
      subscription: {
        id: 'sub_123',
        externalReference: null,
        status: 'ACTIVE',
        nextDueDate: '22/11/2099',
        value: 39,
      },
    })

    expect(event.subscription?.id).toBe('sub_123')
    expect(event.subscription?.externalReference).toBeNull()
    expect(event.subscription?.nextDueDate).toBe('22/11/2099')
  })

  it('uses subscription value as an amount fallback when top-level amount is omitted', () => {
    const event = parseAsaasWebhookEvent({
      event: 'SUBSCRIPTION_CREATED',
      subscription: {
        id: 'sub_123',
        externalReference: 'curria:v1:c:chk_123',
        status: 'ACTIVE',
        nextDueDate: '2026-04-29',
        value: 39,
      },
    })

    expect(getWebhookAmount(event)).toBe(3900)
  })

  it('accepts unknown event names so the route can ignore them with 200', () => {
    const event = parseAsaasWebhookEvent({
      event: 'PAYMENT_CREATED',
      payment: {
        id: 'pay_123',
      },
    })

    expect(event.event).toBe('PAYMENT_CREATED')
    expect(isHandledAsaasBillingEvent(event.event)).toBe(false)
  })

  it('normalizes both ISO and BR date formats', () => {
    expect(normalizeAsaasDateToIso('2026-04-29')).toBe('2026-04-29T00:00:00.000Z')
    expect(normalizeAsaasDateToIso('22/11/2099')).toBe('2099-11-22T00:00:00.000Z')
  })

  it('still rejects handled billing events without the required nested resource', () => {
    expect(() => parseAsaasWebhookEvent({})).toThrow()
    expect(() => parseAsaasWebhookEvent({
      event: 'PAYMENT_CONFIRMED',
    })).toThrow('PAYMENT_CONFIRMED events require a payment object.')
    expect(() => parseAsaasWebhookEvent({
      event: 'SUBSCRIPTION_CREATED',
    })).toThrow('SUBSCRIPTION_CREATED events require a subscription object.')
  })
})
