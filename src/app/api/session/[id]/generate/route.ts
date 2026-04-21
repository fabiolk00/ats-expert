import { NextRequest, NextResponse } from 'next/server'

import { logError, serializeError } from '@/lib/observability/structured-log'
import { withRequestQueryTracking } from '@/lib/observability/request-query-tracking'
import { toNextJsonResponse } from '@/lib/routes/shared/response'
import { resolveSessionGenerateContext } from '@/lib/routes/session-generate/context'
import { executeSessionGenerateFlow } from '@/lib/routes/session-generate/decision'
import { evaluateSessionGeneratePolicy } from '@/lib/routes/session-generate/policy'
import {
  toSessionGenerateExecutionResponse,
  toSessionGeneratePolicyResponse,
} from '@/lib/routes/session-generate/response'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  return withRequestQueryTracking(req, async () => {
    // Execution order:
    // 1. resolve request context
    // 2. evaluate blocking policy
    // 3. execute route orchestration
    // 4. map normalized outcomes to HTTP
    const contextResult = await resolveSessionGenerateContext(req, params)
    if (contextResult.kind === 'blocked') {
      return toNextJsonResponse(contextResult.response)
    }

    const context = contextResult.context

    try {
      const policyDecision = await evaluateSessionGeneratePolicy(context)
      if (policyDecision.kind !== 'allow') {
        return toSessionGeneratePolicyResponse(context, policyDecision)
      }

      const executionDecision = await executeSessionGenerateFlow(context)
      return toSessionGenerateExecutionResponse(context, executionDecision)
    } catch (error) {
      logError('api.session.generate.failed', {
        requestMethod: req.method,
        requestPath: context.requestPath,
        requestedSessionId: params.id,
        appUserId: context.appUser.id,
        success: false,
        latencyMs: Date.now() - context.requestStartedAt,
        ...serializeError(error),
      })
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}
