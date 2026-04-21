import { getCurrentAppUser } from '@/lib/auth/app-user'
import { getResumeTargetForSession } from '@/lib/db/resume-targets'
import { getSession } from '@/lib/db/sessions'
import { listJobsForSession } from '@/lib/jobs/repository'
import { logWarn } from '@/lib/observability/structured-log'

import type { FileAccessContextResult } from './types'

export async function resolveFileAccessContext(
  request: import('next/server').NextRequest,
  params: { sessionId: string },
): Promise<FileAccessContextResult> {
  const requestStartedAt = Date.now()
  const targetId = request.nextUrl.searchParams.get('targetId')
  const requestPath = request.nextUrl.pathname
  const appUser = await getCurrentAppUser()

  if (!appUser) {
    logWarn('api.file.download_urls_unauthorized', {
      requestMethod: request.method,
      requestPath,
      requestedSessionId: params.sessionId,
      targetId,
      success: false,
      latencyMs: Date.now() - requestStartedAt,
    })
    return { kind: 'blocked', response: { status: 401, body: { error: 'Unauthorized' } } }
  }

  const session = await getSession(params.sessionId, appUser.id)
  if (!session) {
    logWarn('api.file.download_urls_not_found', {
      requestMethod: request.method,
      requestPath,
      requestedSessionId: params.sessionId,
      targetId,
      appUserId: appUser.id,
      success: false,
      latencyMs: Date.now() - requestStartedAt,
    })
    return { kind: 'blocked', response: { status: 404, body: { error: 'Not found' } } }
  }

  const target = targetId
    ? await getResumeTargetForSession(session.id, targetId)
    : null

  if (targetId && !target) {
    logWarn('api.file.download_urls_target_not_found', {
      requestMethod: request.method,
      requestPath,
      sessionId: session.id,
      targetId,
      appUserId: appUser.id,
      success: false,
      latencyMs: Date.now() - requestStartedAt,
    })
    return { kind: 'blocked', response: { status: 404, body: { error: 'Not found' } } }
  }

  const artifactMetadata = target?.generatedOutput ?? session.generatedOutput
  const latestArtifactJob = (
    await listJobsForSession({
      userId: appUser.id,
      sessionId: session.id,
      type: 'artifact_generation',
      resumeTargetId: target ? target.id : null,
      limit: 1,
    })
  )[0] ?? null

  return {
    kind: 'allow',
    context: {
      request,
      requestStartedAt,
      requestPath,
      params,
      targetId,
      appUser,
      session,
      target,
      artifactMetadata,
      latestArtifactJob,
    },
  }
}
