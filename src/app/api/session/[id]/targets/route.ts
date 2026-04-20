import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { getHttpStatusForToolError } from '@/lib/agent/tool-errors'
import { getCurrentAppUser } from '@/lib/auth/app-user'
import { getSession } from '@/lib/db/sessions'
import { getResumeTargetsForSession } from '@/lib/db/resume-targets'
import {
  sanitizeGeneratedCvStateForClient,
  sanitizeGeneratedOutputForClient,
} from '@/lib/generated-preview/locked-preview'
import { logWarn } from '@/lib/observability/structured-log'
import { createTargetResumeVariant } from '@/lib/resume-targets/create-target-resume'
import { validateTrustedMutationRequest } from '@/lib/security/request-trust'

const BodySchema = z.object({
  targetJobDescription: z.string().min(1).max(20000),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const appUser = await getCurrentAppUser()
  if (!appUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const session = await getSession(params.id, appUser.id)
  if (!session) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const targets = await getResumeTargetsForSession(session.id)
    return NextResponse.json({
      targets: targets.map((target) => ({
        ...target,
        derivedCvState: sanitizeGeneratedCvStateForClient(
          target.derivedCvState,
          target.generatedOutput,
          'target',
        ) ?? target.derivedCvState,
        generatedOutput: sanitizeGeneratedOutputForClient(target.generatedOutput),
      })),
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const appUser = await getCurrentAppUser()
  if (!appUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const session = await getSession(params.id, appUser.id)
  if (!session) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const trust = validateTrustedMutationRequest(req)
  if (!trust.ok) {
    logWarn('api.session.targets.untrusted_request', {
      appUserId: appUser.id,
      requestMethod: req.method,
      requestPath: req.nextUrl.pathname,
      sessionId: params.id,
      success: false,
      trustSignal: trust.signal,
      trustReason: trust.reason,
    })
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = BodySchema.safeParse(await req.json())
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 })
  }

  try {
    const result = await createTargetResumeVariant({
      sessionId: session.id,
      userId: session.userId,
      baseCvState: session.cvState,
      targetJobDescription: body.data.targetJobDescription,
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, code: result.code },
        { status: getHttpStatusForToolError(result.code) },
      )
    }

    return NextResponse.json({ target: result.target })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
