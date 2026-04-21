import type { NextRequest } from 'next/server'

import type { ResumeTarget, Session } from '@/types/agent'
import type { JobStatusSnapshot } from '@/types/jobs'
import type { ResolvedResumeSource } from '@/lib/jobs/source-of-truth'
import type { RouteHttpResponse } from '@/lib/routes/shared/types'

export type SessionGenerateBody =
  | {
      scope: 'base'
      clientRequestId?: string
    }
  | {
      scope: 'target'
      targetId: string
      clientRequestId?: string
    }

export type SessionGenerateContext = {
  request: NextRequest
  requestStartedAt: number
  requestPath: string
  params: { id: string }
  appUser: NonNullable<Awaited<ReturnType<typeof import('@/lib/auth/app-user').getCurrentAppUser>>>
  session: Session
  body: SessionGenerateBody
  scope: SessionGenerateBody['scope']
  target: ResumeTarget | null
  effectiveSource: ResolvedResumeSource
  primaryIdempotencyKey: string
}

export type SessionGenerateContextResult =
  | { kind: 'allow'; context: SessionGenerateContext }
  | { kind: 'blocked'; response: RouteHttpResponse }

export type SessionGeneratePolicyDecision =
  | { kind: 'allow' }
  | { kind: 'blocked_career_fit_confirmation' }
  | { kind: 'blocked_active_export'; conflictingJob: JobStatusSnapshot }

export type SessionGenerateExecutionDecision =
  | { kind: 'blocked_reconciliation'; job: JobStatusSnapshot }
  | { kind: 'failed'; job: JobStatusSnapshot }
  | { kind: 'completed'; job: JobStatusSnapshot; targetId?: string }
  | { kind: 'in_progress'; job: JobStatusSnapshot; targetId?: string }
