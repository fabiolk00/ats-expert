import { describe, expect, it } from 'vitest'

import { getWebhookAmount, parseAsaasWebhookEvent } from './webhook'

describe('Asaas webhook parsing', () => {
  it('parses supported payment events', () => {
    const event = parseAsaasWebhookEvent({
      event: 'PAYMENT_RECEIVED',
      amount: 1900,
      payment: {
        id: 'pay_123',
        externalReference: 'usr_123',
        subscription: null,
        amount: 1900,
      },
    })

    expect(event).toEqual({
      event: 'PAYMENT_RECEIVED',
      amount: 1900,
      payment: {
        id: 'pay_123',
        externalReference: 'usr_123',
        subscription: null,
        amount: 1900,
      },
    })
    expect(getWebhookAmount(event)).toBe(1900)
  })

  it('parses supported subscription events', () => {
    const event = parseAsaasWebhookEvent({
      event: 'SUBSCRIPTION_RENEWED',
      amount: 3900,
      subscription: {
        id: 'sub_123',
        externalReference: 'usr_123',
        status: 'ACTIVE',
        nextDueDate: '2026-04-29',
        value: 39,
      },
    })

    expect(event.subscription?.id).toBe('sub_123')
    expect(event.subscription?.nextDueDate).toBe('2026-04-29')
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

  it('rejects invalid webhook shapes', () => {
    expect(() => parseAsaasWebhookEvent({})).toThrow()
    expect(() => parseAsaasWebhookEvent({
      event: 'PAYMENT_RECEIVED',
    })).toThrow('PAYMENT_RECEIVED events require a payment object.')
    expect(() => parseAsaasWebhookEvent({
      event: 'SUBSCRIPTION_CREATED',
    })).toThrow('SUBSCRIPTION_CREATED events require a subscription object.')
  })
})
