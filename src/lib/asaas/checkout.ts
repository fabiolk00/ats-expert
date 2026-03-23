import { asaas } from '@/lib/asaas/client'
import { PLANS, type PlanKey } from '@/lib/asaas/config'
import { getOrCreateCustomer } from '@/lib/asaas/customers'

type CreateCheckoutLinkInput = {
  userId: string
  userName: string
  userEmail: string
  plan: PlanKey
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

  if (plan === 'one_time') {
    const result = await asaas.post<{ url: string }>('/paymentLinks', {
      name: `CurrIA — ${planConfig.label}`,
      billingType: 'UNDEFINED',
      chargeType: 'DETACHED',
      value: planConfig.value,
      customer: customerId,
      externalReference: `${userId}:${plan}`,
      successUrl,
    })
    return result.url
  }

  const result = await asaas.post<{ invoiceUrl: string }>('/subscriptions', {
    customer: customerId,
    billingType: 'CREDIT_CARD',
    cycle: planConfig.cycle!,
    value: planConfig.value,
    nextDueDate: tomorrow(),
    externalReference: `${userId}:${plan}`,
  })

  return result.invoiceUrl
}
