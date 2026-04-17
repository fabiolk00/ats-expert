import { NextRequest, NextResponse } from 'next/server'

import { getCurrentAppUser } from '@/lib/auth/app-user'
import { getResumeTargetForSession } from '@/lib/db/resume-targets'
import { getSession } from '@/lib/db/sessions'
import { createSignedResumeArtifactUrls } from '@/lib/agent/tools/generate-file'
import { listJobsForSession } from '@/lib/jobs/repository'
import { logError, logInfo, logWarn, serializeError } from '@/lib/observability/structured-log'
import type { GeneratedOutput } from '@/types/agent'
import type { JobStatusSnapshot } from '@/types/jobs'

function resolveArtifactGenerationStatus(
  artifactMetadata: GeneratedOutput,
  latestArtifactJob: JobStatusSnapshot | null,
): GeneratedOutput['status'] {
  if (latestArtifactJob?.status === 'queued' || latestArtifactJob?.status === 'running') {
    return 'generating'
  }

  if (latestArtifactJob?.status === 'failed' || latestArtifactJob?.status === 'cancelled') {
    return 'failed'
  }

  return artifactMetadata.status
}

function resolveArtifactErrorMessage(
  artifactMetadata: GeneratedOutput,
  latestArtifactJob: JobStatusSnapshot | null,
): string | undefined {
  const terminalErrorRef = latestArtifactJob?.terminalErrorRef

  if (terminalErrorRef?.kind === 'resume_generation_failure') {
    return terminalErrorRef.failureReason ?? artifactMetadata.error
  }

  if (terminalErrorRef?.kind === 'job_error') {
    return terminalErrorRef.message
  }

  return artifactMetadata.error
}

function resolveArtifactLifecycleStatus(
  artifactMetadata: GeneratedOutput,
  latestArtifactJob: JobStatusSnapshot | null,
): JobStatusSnapshot['status'] | null {
  if (latestArtifactJob?.status) {
    return latestArtifactJob.status
  }

  switch (artifactMetadata.status) {
    case 'generating':
      return 'running'
    case 'ready':
      return 'completed'
    case 'failed':
      return 'failed'
    default:
      return null
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } },
): Promise<NextResponse> {
  const requestStartedAt = Date.now()
  const targetId = req.nextUrl.searchParams.get('targetId')
  const requestPath = req.nextUrl.pathname
  const appUser = await getCurrentAppUser()
  if (!appUser) {
    logWarn('api.file.download_urls_unauthorized', {
      requestMethod: req.method,
      requestPath,
      requestedSessionId: params.sessionId,
      targetId,
      success: false,
      latencyMs: Date.now() - requestStartedAt,
    })

    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const session = await getSession(params.sessionId, appUser.id)
  if (!session) {
    logWarn('api.file.download_urls_not_found', {
      requestMethod: req.method,
      requestPath,
      requestedSessionId: params.sessionId,
      targetId,
      appUserId: appUser.id,
      success: false,
      latencyMs: Date.now() - requestStartedAt,
    })

    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const target = targetId
    ? await getResumeTargetForSession(session.id, targetId)
    : null

  if (targetId && !target) {
    logWarn('api.file.download_urls_target_not_found', {
      requestMethod: req.method,
      requestPath,
      sessionId: session.id,
      targetId,
      appUserId: appUser.id,
      success: false,
      latencyMs: Date.now() - requestStartedAt,
    })

    return NextResponse.json({ error: 'Not found' }, { status: 404 })
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
  const generationStatus = resolveArtifactGenerationStatus(artifactMetadata, latestArtifactJob)
  const lifecycleStatus = resolveArtifactLifecycleStatus(artifactMetadata, latestArtifactJob)
  const errorMessage = resolveArtifactErrorMessage(artifactMetadata, latestArtifactJob)
  const { pdfPath, status } = artifactMetadata

  if (status !== 'ready' || !pdfPath) {
    logInfo('api.file.download_urls_unavailable', {
      requestMethod: req.method,
      requestPath,
      sessionId: session.id,
      targetId,
      resumeTargetId: target?.id ?? null,
      appUserId: appUser.id,
      jobId: latestArtifactJob?.jobId,
      type: 'artifact_generation',
      status: lifecycleStatus,
      generationStatus,
      stage: latestArtifactJob?.stage,
      success: true,
      latencyMs: Date.now() - requestStartedAt,
    })
    return NextResponse.json(
      {
        docxUrl: null,
        pdfUrl: null,
        available: false,
        generationStatus,
        jobId: latestArtifactJob?.jobId,
        stage: latestArtifactJob?.stage,
        progress: latestArtifactJob?.progress,
        errorMessage,
      },
      { status: 200 },
    )
  }

  try {
    const signedUrls = await createSignedResumeArtifactUrls(undefined, pdfPath)

    logInfo('api.file.download_urls_ready', {
      requestMethod: req.method,
      requestPath,
      sessionId: session.id,
      targetId,
      resumeTargetId: target?.id ?? null,
      appUserId: appUser.id,
      jobId: latestArtifactJob?.jobId,
      type: 'artifact_generation',
      status: lifecycleStatus,
      generationStatus,
      stage: latestArtifactJob?.stage,
      success: true,
      latencyMs: Date.now() - requestStartedAt,
    })

    return NextResponse.json({
      docxUrl: null,
      pdfUrl: signedUrls.pdfUrl,
      available: true,
      generationStatus,
      jobId: latestArtifactJob?.jobId,
      stage: latestArtifactJob?.stage,
      progress: latestArtifactJob?.progress,
      errorMessage,
    })
  } catch (error) {
    logError('api.file.download_urls_failed', {
      requestMethod: req.method,
      requestPath,
      sessionId: session.id,
      targetId,
      resumeTargetId: target?.id ?? null,
      appUserId: appUser.id,
      jobId: latestArtifactJob?.jobId,
      type: 'artifact_generation',
      status: lifecycleStatus,
      generationStatus,
      stage: latestArtifactJob?.stage,
      success: false,
      latencyMs: Date.now() - requestStartedAt,
      ...serializeError(error),
    })

    return NextResponse.json(
      { error: 'Generated resume artifacts could not be retrieved.' },
      { status: 404 },
    )
  }
}
