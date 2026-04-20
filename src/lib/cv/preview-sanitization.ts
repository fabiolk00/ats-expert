import { getPreviewLockSummary } from '@/lib/generated-preview/locked-preview'
import type {
  CVTimelineEntry,
  GeneratedOutput,
  PreviewAccess,
  ResumeTarget,
  Session,
} from '@/types/agent'
import type { CVState } from '@/types/cv'
import type { PreviewLockSummary } from '@/types/dashboard'

type VersionPreviewContext = {
  session: Pick<Session, 'generatedOutput'>
  targetsById?: Map<string, Pick<ResumeTarget, 'generatedOutput'>>
}

type SanitizedVersionSnapshot = {
  snapshot?: CVState
  previewLock?: PreviewLockSummary
  previewLocked: boolean
  blurred: boolean
  canViewRealContent: boolean
  requiresUpgrade: boolean
  requiresRegenerationAfterUnlock: boolean
}

type CompareSnapshotMeta = {
  kind: 'base' | 'version' | 'target'
  id?: string
  label: string
  source?: string
  timestamp?: string
}

export type SanitizedCompareSnapshot = CompareSnapshotMeta & SanitizedVersionSnapshot

function buildFallbackLockedPreviewAccess(): PreviewAccess {
  return {
    locked: true,
    blurred: true,
    canViewRealContent: false,
    requiresUpgrade: true,
    requiresRegenerationAfterUnlock: true,
    reason: 'free_trial_locked',
  }
}

function buildUnlockedSnapshot(snapshot: CVState): SanitizedVersionSnapshot {
  return {
    snapshot: structuredClone(snapshot),
    previewLocked: false,
    blurred: false,
    canViewRealContent: true,
    requiresUpgrade: false,
    requiresRegenerationAfterUnlock: false,
  }
}

function buildLockedSnapshot(previewAccess?: PreviewAccess): SanitizedVersionSnapshot {
  const previewLock = getPreviewLockSummary({
    previewAccess,
  } satisfies Pick<GeneratedOutput, 'previewAccess'>)

  return {
    snapshot: undefined,
    previewLock,
    previewLocked: true,
    blurred: true,
    canViewRealContent: false,
    requiresUpgrade: previewAccess?.requiresUpgrade ?? true,
    requiresRegenerationAfterUnlock: previewAccess?.requiresRegenerationAfterUnlock ?? true,
  }
}

function resolveVersionPreviewAccess(
  version: Pick<CVTimelineEntry, 'source' | 'targetResumeId'>,
  context: VersionPreviewContext,
): PreviewAccess | undefined {
  switch (version.source) {
    case 'ats-enhancement':
    case 'job-targeting':
      return context.session.generatedOutput.previewAccess
    case 'target-derived':
      return version.targetResumeId
        ? context.targetsById?.get(version.targetResumeId)?.generatedOutput?.previewAccess
          ?? buildFallbackLockedPreviewAccess()
        : buildFallbackLockedPreviewAccess()
    default:
      return undefined
  }
}

export function sanitizeVersionSnapshotForViewer(
  version: Pick<CVTimelineEntry, 'snapshot' | 'source' | 'targetResumeId'>,
  context: VersionPreviewContext,
): SanitizedVersionSnapshot {
  const previewAccess = resolveVersionPreviewAccess(version, context)

  if (previewAccess?.locked) {
    return buildLockedSnapshot(previewAccess)
  }

  return buildUnlockedSnapshot(version.snapshot)
}

export function sanitizeVersionEntryForViewer(
  version: CVTimelineEntry,
  context: VersionPreviewContext,
) {
  const snapshot = sanitizeVersionSnapshotForViewer(version, context)

  return {
    ...version,
    createdAt: version.createdAt.toISOString(),
    ...snapshot,
  }
}

export function sanitizeCompareRefForViewer(
  ref: CompareSnapshotMeta & {
    snapshot: CVState
    previewAccess?: PreviewAccess
  },
): SanitizedCompareSnapshot {
  if (ref.previewAccess?.locked) {
    return {
      kind: ref.kind,
      id: ref.id,
      label: ref.label,
      source: ref.source,
      timestamp: ref.timestamp,
      ...buildLockedSnapshot(ref.previewAccess),
    }
  }

  return {
    kind: ref.kind,
    id: ref.id,
    label: ref.label,
    source: ref.source,
    timestamp: ref.timestamp,
    ...buildUnlockedSnapshot(ref.snapshot),
  }
}
