import { NextResponse } from 'next/server'

import { recordMetricCounter } from '@/lib/observability/metric-events'
import { assertNever } from '@/lib/routes/shared/exhaustive'

import { assertLockedCompareHasNoDiff } from './invariants'
import type { SessionCompareDecision } from './types'

export function toSessionCompareResponse(decision: SessionCompareDecision): NextResponse {
  switch (decision.kind) {
    case 'not_found':
      return NextResponse.json(decision.body, { status: decision.status })
    case 'locked':
      assertLockedCompareHasNoDiff(decision)
      recordMetricCounter('architecture.compare.locked_responses')
      return NextResponse.json(decision.body, { status: 200 })
    case 'diff':
      return NextResponse.json(decision.body, { status: 200 })
    default:
      return assertNever(decision, 'session compare decision')
  }
}
