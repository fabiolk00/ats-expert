import { describe, expect, it } from 'vitest'

import {
  createAsaasProcessedEventId,
  parseAsaasExternalReference,
  parseAsaasWebhookEvent,
} from './webhook'

describe('Asaas webhook fingerprinting', () => {
  it('produces the same fingerprint regardless of object field order', () => {
    const payloadA = {
      event: 'PAYMENT_RECEIVED',
      payment: {
        id: 'pay_123',
        externalReference: 'usr_123:unit',
        subscription: null,
      },
      meta: {
        amount: 1900,
        currency: 'BRL',
      },
    }

    const payloadB = {
      meta: {
        currency: 'BRL',
        amount: 1900,
      },
      payment: {
        subscription: null,
        externalReference: 'usr_123:unit',
        id: 'pay_123',
      },
      event: 'PAYMENT_RECEIVED',
    }

    expect(createAsaasProcessedEventId(payloadA)).toBe(createAsaasProcessedEventId(payloadB))
  })

  it('gives duplicate deliveries of the same payload the same fingerprint', () => {
    const payload = {
      event: 'SUBSCRIPTION_RENEWED',
      subscription: {
        id: 'sub_123',
        externalReference: 'usr_123:monthly',
      },
      payment: {
        id: 'pay_1',
        externalReference: 'usr_123:monthly',
      },
    }

    expect(createAsaasProcessedEventId(payload)).toBe(createAsaasProcessedEventId(payload))
  })

  it('distinguishes different renewal payloads for the same subscription', () => {
    const firstRenewal = {
      event: 'SUBSCRIPTION_RENEWED',
      subscription: {
        id: 'sub_123',
        externalReference: 'usr_123:monthly',
      },
      payment: {
        id: 'pay_1',
        externalReference: 'usr_123:monthly',
      },
    }

    const secondRenewal = {
      event: 'SUBSCRIPTION_RENEWED',
      subscription: {
        id: 'sub_123',
        externalReference: 'usr_123:monthly',
      },
      payment: {
        id: 'pay_2',
        externalReference: 'usr_123:monthly',
      },
    }

    expect(createAsaasProcessedEventId(firstRenewal)).not.toBe(createAsaasProcessedEventId(secondRenewal))
  })

  it('parses only the supported billing reference format', () => {
    expect(parseAsaasExternalReference('usr_123:monthly')).toEqual({
      referenceUserId: 'usr_123',
      plan: 'monthly',
    })

    expect(() => parseAsaasExternalReference('usr_123')).toThrow()
    expect(() => parseAsaasExternalReference('usr_123:invalid')).toThrow()
  })

  it('rejects invalid webhook shapes', () => {
    expect(() => parseAsaasWebhookEvent({})).toThrow()
    expect(() => parseAsaasWebhookEvent({ event: 'PAYMENT_RECEIVED', payment: { id: 1 } })).toThrow()
  })
})
