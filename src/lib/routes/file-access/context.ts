import { getCurrentAppUser } from '@/lib/auth/app-user'
import { getResumeTargetForSession } from '@/lib/db/resume-targets'
import { getSessionLookupResult } from '@/lib/db/sessions'
import { listJobsForSession } from '@/lib/jobs/repository'
import { logError, logInfo, logWarn, serializeError } from '@/lib/observability/structured-log'

import type { FileAccessContextResult, FileDownloadTrigger } from './types'

const SESSION_LOOKUP_RETRY_DELAYS_MS = [0, 120, 240] as const
const RETRYABLE_NOT_FOUND_TRIGGERS = new Set<FileDownloadTrigger>([
  'post_generation',
  'profile_last_generated',
])

function isFileDownloadTrigger(value: string | null): value is FileDownloadTrigger {
  return value === 'post_generation'
    || value === 'preview_panel'
    || value === 'profile_last_generated'
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function resolveSessionWithRetry(input: {
  sessionId: string
  appUserId: string
}) {
  let attempts = 0

  for (const delayMs of SESSION_LOOKUP_RETRY_DELAYS_MS) {
    if (delayMs > 0) {
      await sleep(delayMs)
    }

    attempts += 1
    const result = await getSessionLookupResult(input.sessionId, input.appUserId)

    if (result.kind === 'not_found' && attempts < SESSION_LOOKUP_RETRY_DELAYS_MS.length) {
      continue
    }

    return {
      attempts,
      result,
    }
  }

  return {
    attempts,
    result: { kind: 'not_found' } as const,
  }
}

export async function resolveFileAccessContext(
  request: import('next/server').NextRequest,
  params: { sessionId: string },
): Promise<FileAccessContextResult> {
  const requestStartedAt = Date.now()
  const targetId = request.nextUrl.searchParams.get('targetId')
  const requestPath = request.nextUrl.pathname
  const rawDownloadTrigger = request.nextUrl.searchParams.get('trigger')
  const downloadTrigger = isFileDownloadTrigger(rawDownloadTrigger) ? rawDownloadTrigger : null
  const appUser = await getCurrentAppUser()

  if (!appUser) {
    logWarn('api.file.download_urls_unauthorized', {
      requestMethod: request.method,
      requestPath,
      requestedSessionId: params.sessionId,
      targetId,
      downloadTrigger,
      success: false,
      latencyMs: Date.now() - requestStartedAt,
    })
    return { kind: 'blocked', response: { status: 401, body: { error: 'Unauthorized' } } }
  }

  const sessionLookup = await resolveSessionWithRetry({
    sessionId: params.sessionId,
    appUserId: appUser.id,
  })

  if (sessionLookup.result.kind === 'lookup_error') {
    logError('api.file.session_lookup_failed', {
      requestMethod: request.method,
      requestPath,
      requestedSessionId: params.sessionId,
      targetId,
      downloadTrigger,
      appUserId: appUser.id,
      lookupAttempts: sessionLookup.attempts,
      success: false,
      latencyMs: Date.now() - requestStartedAt,
      dbDetails: sessionLookup.result.error.dbDetails,
      dbHint: sessionLookup.result.error.dbHint,
      ...serializeError(sessionLookup.result.error),
    })

    return {
      kind: 'blocked',
      response: {
        status: 503,
        body: {
          error: 'Download session lookup temporarily unavailable.',
          code: 'DOWNLOAD_SESSION_LOOKUP_FAILED',
          retryable: true,
          retryAfterMs: 750,
        },
      },
    }
  }

  if (sessionLookup.result.kind === 'not_found') {
    const retryableClientFallback = downloadTrigger
      ? RETRYABLE_NOT_FOUND_TRIGGERS.has(downloadTrigger)
      : false

    logWarn('api.file.download_urls_not_found', {
      requestMethod: request.method,
      requestPath,
      requestedSessionId: params.sessionId,
      targetId,
      downloadTrigger,
      appUserId: appUser.id,
      lookupAttempts: sessionLookup.attempts,
      retryableClientFallback,
      success: false,
      latencyMs: Date.now() - requestStartedAt,
    })

    return {
      kind: 'blocked',
      response: {
        status: 404,
        body: retryableClientFallback
          ? {
              error: 'Download session not visible yet.',
              code: 'DOWNLOAD_SESSION_NOT_READY',
              retryable: true,
              retryAfterMs: 750,
            }
          : { error: 'Not found' },
      },
    }
  }

  const session = sessionLookup.result.session

  if (sessionLookup.attempts > 1) {
    logInfo('api.file.session_lookup_recovered_after_retry', {
      requestMethod: request.method,
      requestPath,
      requestedSessionId: params.sessionId,
      targetId,
      downloadTrigger,
      appUserId: appUser.id,
      lookupAttempts: sessionLookup.attempts,
      success: true,
      latencyMs: Date.now() - requestStartedAt,
    })
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
      downloadTrigger,
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
      downloadTrigger,
      appUser,
      session,
      target,
      artifactMetadata,
      latestArtifactJob,
      sessionLookupAttempts: sessionLookup.attempts,
      sessionCreatedAgeMs: Date.now() - session.createdAt.getTime(),
      sessionUpdatedAgeMs: Date.now() - session.updatedAt.getTime(),
    },
  }
}
