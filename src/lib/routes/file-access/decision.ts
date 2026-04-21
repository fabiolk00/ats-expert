import { buildLockedPreviewPdfUrl, getPreviewLockSummary, isLockedPreview } from '@/lib/generated-preview/locked-preview'

import type { FileAccessContext, FileAccessDecision } from './types'

export function resolveArtifactGenerationStatus(context: FileAccessContext) {
  if (context.latestArtifactJob?.status === 'queued' || context.latestArtifactJob?.status === 'running') {
    return 'generating'
  }

  if (context.latestArtifactJob?.status === 'failed' || context.latestArtifactJob?.status === 'cancelled') {
    return 'failed'
  }

  return context.artifactMetadata.status
}

export function resolveArtifactErrorMessage(context: FileAccessContext): string | undefined {
  const terminalErrorRef = context.latestArtifactJob?.terminalErrorRef

  if (terminalErrorRef?.kind === 'resume_generation_failure') {
    return terminalErrorRef.failureReason ?? context.artifactMetadata.error
  }

  if (terminalErrorRef?.kind === 'job_error') {
    return terminalErrorRef.message
  }

  return context.artifactMetadata.error
}

export function resolveArtifactLifecycleStatus(context: FileAccessContext) {
  if (context.latestArtifactJob?.status) {
    return context.latestArtifactJob.status
  }

  switch (context.artifactMetadata.status) {
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

export function resolveArtifactReconciliation(
  context: FileAccessContext,
  errorMessage?: string,
) {
  if (!context.latestArtifactJob) {
    return undefined
  }

  if (context.latestArtifactJob.stage === 'needs_reconciliation') {
    return {
      required: true as const,
      status: 'pending' as const,
      reason: errorMessage,
    }
  }

  if (context.latestArtifactJob.status === 'failed' && context.latestArtifactJob.stage === 'release_credit') {
    return {
      required: true as const,
      status: 'pending' as const,
      reason: errorMessage,
    }
  }

  return undefined
}

function buildBaseResponseBody(context: FileAccessContext) {
  const generationStatus = resolveArtifactGenerationStatus(context)
  const errorMessage = resolveArtifactErrorMessage(context)

  return {
    docxUrl: null,
    available: true,
    generationStatus,
    jobId: context.latestArtifactJob?.jobId,
    stage: context.latestArtifactJob?.stage,
    progress: context.latestArtifactJob?.progress,
    errorMessage,
    previewLock: getPreviewLockSummary(context.artifactMetadata),
    reconciliation: resolveArtifactReconciliation(context, errorMessage),
  }
}

function buildDecisionLog(context: FileAccessContext) {
  return {
    generationStatus: resolveArtifactGenerationStatus(context),
    lifecycleStatus: resolveArtifactLifecycleStatus(context),
    jobId: context.latestArtifactJob?.jobId,
    stage: context.latestArtifactJob?.stage,
  }
}

export function decideFileAccess(context: FileAccessContext): FileAccessDecision {
  const { pdfPath, status } = context.artifactMetadata
  const baseBody = buildBaseResponseBody(context)
  const log = buildDecisionLog(context)

  if (status !== 'ready' || !pdfPath) {
    return {
      kind: 'artifact_unavailable',
      body: {
        ...baseBody,
        available: false,
        pdfUrl: null,
      },
      log,
    }
  }

  if (isLockedPreview(context.artifactMetadata)) {
    return {
      kind: 'locked_preview',
      body: {
        ...baseBody,
        pdfUrl: buildLockedPreviewPdfUrl(context.session.id, context.target?.id),
      },
      log,
    }
  }

  return {
    kind: 'artifact_available',
    pdfPath,
    body: baseBody,
    log,
  }
}
