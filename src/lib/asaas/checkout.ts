import { asaas } from '@/lib/asaas/client'
import { PLANS, type PlanSlug } from '@/lib/plans'
import { getOrCreateCustomer } from '@/lib/asaas/customers'

type CreateCheckoutLinkInput = {
  userId: string
  userName: string
  userEmail: string
  plan: PlanSlug
  successUrl: string
}

function tomorrow(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

export async function createCheckoutLink({
  userId,
  userName,
  userEmail,
  plan,
  successUrl,
}: CreateCheckoutLinkInput): Promise<string> {
  const planConfig = PLANS[plan]
  const customerId = await getOrCreateCustomer({ userId, name: userName, email: userEmail })

  // One-time payment (Unitário)
  if (planConfig.billing === 'once') {
    const result = await asaas.post<{ url: string }>('/paymentLinks', {
      name: `CurrIA — ${planConfig.name}`,
      billingType: 'UNDEFINED',
      chargeType: 'DETACHED',
      value: planConfig.price / 100, // Convert cents to reais
      customer: customerId,
      externalReference: `${userId}:${plan}`,
      successUrl,
    })
    return result.url
  }

  // Subscription (Mensal/Pro)
  const result = await asaas.post<{ invoiceUrl: string }>('/subscriptions', {
    customer: customerId,
    billingType: 'CREDIT_CARD',
    cycle: 'MONTHLY',
    value: planConfig.price / 100, // Convert cents to reais
    nextDueDate: tomorrow(),
    externalReference: `${userId}:${plan}`,
  })

  return result.invoiceUrl
}
