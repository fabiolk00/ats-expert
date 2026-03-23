import { createClient } from '@supabase/supabase-js'

import { asaas } from '@/lib/asaas/client'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

type GetOrCreateCustomerInput = {
  userId: string
  name: string
  email: string
  cpfCnpj?: string
}

export async function getOrCreateCustomer({
  userId,
  name,
  email,
  cpfCnpj,
}: GetOrCreateCustomerInput): Promise<string> {
  const { data } = await supabase
    .from('user_quotas')
    .select('asaas_customer_id')
    .eq('user_id', userId)
    .single()

  if (data?.asaas_customer_id) return data.asaas_customer_id as string

  const customer = await asaas.post<{ id: string }>('/customers', {
    name,
    email,
    externalReference: userId,
    ...(cpfCnpj ? { cpfCnpj } : {}),
  })

  await supabase
    .from('user_quotas')
    .upsert({ user_id: userId, asaas_customer_id: customer.id }, { onConflict: 'user_id' })

  return customer.id
}
