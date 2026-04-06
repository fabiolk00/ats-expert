import { asaas } from '@/lib/asaas/client'
import { PLANS, type PlanSlug } from '@/lib/plans'

type CreateCheckoutLinkInput = {
  appUserId: string
  userName: string
  userEmail?: string | null
  plan: PlanSlug
  checkoutReference: string
  externalReference: string
  successUrl: string
  cancelUrl?: string
  expiredUrl?: string
}

function buildPaymentLinkName(planName: string): string {
  return `CurrIA - ${planName}`
}

function getAsaasHostedOrigin(): string {
  return process.env.ASAAS_SANDBOX === 'true'
    ? 'https://sandbox.asaas.com'
    : 'https://www.asaas.com'
}

function buildCheckoutSessionUrl(checkoutId: string): string {
  return `${getAsaasHostedOrigin()}/checkoutSession/show?id=${encodeURIComponent(checkoutId)}`
}

function buildCustomerData(userName: string, userEmail?: string | null) {
  return {
    name: userName,
    email: userEmail ?? undefined,
  }
}

function tomorrowDateTime(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 19).replace('T', ' ')
}

export async function createCheckoutLink({
  appUserId,
  userName,
  userEmail,
  plan,
  checkoutReference,
  externalReference,
  successUrl,
  cancelUrl,
  expiredUrl,
}: CreateCheckoutLinkInput): Promise<string> {
  const planConfig = PLANS[plan]
  console.log('[createCheckoutLink] called with plan:', plan, 'billing:', planConfig.billing)
  void appUserId
  void checkoutReference

  if (planConfig.billing === 'once') {
    console.log('[createCheckoutLink] creating one-time checkout')
    const detachedCheckout = await asaas.post<{ id: string }>('/checkouts', {
      billingTypes: ['PIX', 'CREDIT_CARD'],
      chargeTypes: ['DETACHED'],
      minutesToExpire: 60,
      callback: {
        successUrl,
        cancelUrl: cancelUrl ?? successUrl,
        expiredUrl: expiredUrl ?? cancelUrl ?? successUrl,
      },
      customerData: buildCustomerData(userName, userEmail),
      items: [
        {
          name: buildPaymentLinkName(planConfig.name),
          description: planConfig.description,
          quantity: 1,
          value: planConfig.price / 100,
        },
      ],
      externalReference,
    })

    const url = buildCheckoutSessionUrl(detachedCheckout.id)
    console.log('[createCheckoutLink] one-time checkout created:', url)
    return url
  }

  console.log('[createCheckoutLink] creating recurring checkout')
  const recurringCheckout = await asaas.post<{ id: string }>('/checkouts', {
    billingTypes: ['CREDIT_CARD'],
    chargeTypes: ['RECURRENT'],
    minutesToExpire: 60,
    callback: {
      successUrl,
      cancelUrl: cancelUrl ?? successUrl,
      expiredUrl: expiredUrl ?? cancelUrl ?? successUrl,
    },
    customerData: buildCustomerData(userName, userEmail),
    items: [
      {
        name: buildPaymentLinkName(planConfig.name),
        description: planConfig.description,
        quantity: 1,
        value: planConfig.price / 100,
      },
    ],
    subscription: {
      cycle: 'MONTHLY',
      nextDueDate: tomorrowDateTime(),
    },
    externalReference,
  })

  const url = buildCheckoutSessionUrl(recurringCheckout.id)
  console.log('[createCheckoutLink] recurring checkout created:', url)
  return url
}
