import type { NextRequest } from 'next/server'

import type { RouteHttpResponse } from '@/lib/routes/shared/types'
import type { Session } from '@/types/agent'
import type { ResumeComparisonResponse } from '@/types/dashboard'

export type SessionComparisonContext = {
  request: NextRequest
  params: { id: string }
  appUser: NonNullable<Awaited<ReturnType<typeof import('@/lib/auth/app-user').getCurrentAppUser>>>
  session: Session
}

export type SessionComparisonContextResult =
  | { kind: 'allow'; context: SessionComparisonContext }
  | { kind: 'blocked'; response: RouteHttpResponse }

export type SessionComparisonDecision =
  | {
      kind: 'success'
      body: ResumeComparisonResponse
    }
  | {
      kind: 'no_optimized_resume'
      status: 409
      body: { error: 'No optimized resume found for this session.' }
    }
  | {
      kind: 'internal_error'
      status: 500
      body: { error: 'Internal server error' }
    }
