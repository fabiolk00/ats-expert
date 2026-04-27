import { NextResponse } from 'next/server'

import { loadOptionalBillingInfo } from '@/lib/asaas/optional-billing-info'
import { getCurrentAppUser } from '@/lib/auth/app-user'
import type { BillingSummaryResponse } from '@/types/dashboard'

export async function GET() {
  const appUser = await getCurrentAppUser()

  if (!appUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { billingInfo, billingNotice } = await loadOptionalBillingInfo(appUser.id, 'dashboard_page')
  const summary: BillingSummaryResponse = {
    currentCredits: billingInfo?.creditsRemaining ?? appUser.creditAccount.creditsRemaining,
    maxCredits: billingInfo?.maxCredits ?? undefined,
    currentPlan: billingInfo?.plan ?? null,
    activeRecurringPlan: billingInfo?.hasActiveRecurringSubscription
      ? billingInfo.plan
      : null,
    billingNotice,
  }

  return NextResponse.json(summary)
}
