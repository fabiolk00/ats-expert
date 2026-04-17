import { NextRequest, NextResponse } from 'next/server'

import { getCurrentAppUser } from '@/lib/auth/app-user'
import { getJob } from '@/lib/jobs/repository'
import { logError, logInfo, logWarn, serializeError } from '@/lib/observability/structured-log'

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } },
): Promise<NextResponse> {
  const requestStartedAt = Date.now()
  const requestPath = req.nextUrl.pathname
  const appUser = await getCurrentAppUser()

  if (!appUser) {
    logWarn('api.jobs.status.unauthorized', {
      requestMethod: req.method,
      requestPath,
      requestedJobId: params.jobId,
      success: false,
      latencyMs: Date.now() - requestStartedAt,
    })

    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const job = await getJob(params.jobId, appUser.id)

    if (!job) {
      logWarn('api.jobs.status.not_found', {
        requestMethod: req.method,
        requestPath,
        jobId: params.jobId,
        appUserId: appUser.id,
        success: false,
        latencyMs: Date.now() - requestStartedAt,
      })

      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    logInfo('api.jobs.status.read', {
      requestMethod: req.method,
      requestPath,
      jobId: job.jobId,
      sessionId: job.sessionId,
      resumeTargetId: job.resumeTargetId,
      appUserId: appUser.id,
      type: job.type,
      status: job.status,
      stage: job.stage,
      success: true,
      latencyMs: Date.now() - requestStartedAt,
    })

    return NextResponse.json(job)
  } catch (error) {
    logError('api.jobs.status.failed', {
      requestMethod: req.method,
      requestPath,
      jobId: params.jobId,
      appUserId: appUser.id,
      success: false,
      latencyMs: Date.now() - requestStartedAt,
      ...serializeError(error),
    })

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
