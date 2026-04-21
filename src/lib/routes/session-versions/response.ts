import { NextResponse } from 'next/server'

import { recordMetricCounter } from '@/lib/observability/metric-events'

import { assertLockedVersionHasNoSnapshot } from './invariants'
import type { SessionVersionsDecision } from './types'

export function toSessionVersionsResponse(decision: SessionVersionsDecision): NextResponse {
  assertLockedVersionHasNoSnapshot(decision)
  if (decision.versions.some((version) => version.previewLocked === true)) {
    recordMetricCounter('architecture.versions.locked_responses')
  }

  return NextResponse.json(decision)
}
