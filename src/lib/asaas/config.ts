export type PlanKey = 'one_time' | 'monthly' | 'pro'

type PlanConfig = {
  label: string
  value: number
  credits: number
  cycle: string | null
}

export const PLANS: Record<PlanKey, PlanConfig> = {
  one_time: { label: 'Unitário', value: 19.00, credits: 1,  cycle: null },
  monthly:  { label: 'Mensal',   value: 39.00, credits: 5,  cycle: 'MONTHLY' },
  pro:      { label: 'Pro',      value: 97.00, credits: -1, cycle: 'MONTHLY' },
}
