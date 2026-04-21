import { compareCVStates } from '@/lib/cv/compare'
import { sanitizeCompareRefForViewer } from '@/lib/cv/preview-sanitization'
import { getCvVersionForSession, toTimelineEntry } from '@/lib/db/cv-versions'
import { getResumeTargetForSession, getResumeTargetsForSession } from '@/lib/db/resume-targets'

import type { SessionCompareContext, SessionCompareDecision, ResolvedSnapshot, SnapshotRef } from './types'
import { assertLockedCompareHasNoDiff } from './invariants'

function toCompareResponseRef(snapshot: ResolvedSnapshot) {
  return {
    kind: snapshot.kind,
    id: snapshot.id,
    label: snapshot.label,
    source: snapshot.source,
    timestamp: snapshot.timestamp,
    previewLocked: snapshot.previewLocked ?? false,
    previewLock: snapshot.previewLock,
  }
}

export async function resolveCompareSnapshotRef(input: {
  sessionId: string
  ref: SnapshotRef
  baseCvState: SessionCompareContext['session']['cvState']
  sessionGeneratedOutput: SessionCompareContext['session']['generatedOutput']
  targetsById: Map<string, NonNullable<Awaited<ReturnType<typeof getResumeTargetForSession>>>>
}): Promise<ResolvedSnapshot | null> {
  const { sessionId, ref, baseCvState, sessionGeneratedOutput, targetsById } = input

  if (ref.kind === 'base') {
    const sanitized = sanitizeCompareRefForViewer({
      kind: 'base',
      label: 'Current Base Resume',
      snapshot: baseCvState,
    })

    return {
      kind: sanitized.kind,
      label: sanitized.label,
      cvState: sanitized.snapshot ?? structuredClone(baseCvState),
    }
  }

  if (ref.kind === 'version') {
    const version = await getCvVersionForSession(sessionId, ref.id)
    if (!version) {
      return null
    }

    const timelineEntry = toTimelineEntry(version)
    const sanitized = sanitizeCompareRefForViewer({
      kind: 'version',
      id: version.id,
      label: timelineEntry.label,
      source: version.source,
      timestamp: timelineEntry.timestamp,
      snapshot: version.snapshot,
      previewAccess: version.source === 'target-derived'
        ? version.targetResumeId
          ? targetsById.get(version.targetResumeId)?.generatedOutput?.previewAccess
          : undefined
        : sessionGeneratedOutput.previewAccess,
    })

    return {
      kind: sanitized.kind,
      id: sanitized.id,
      label: sanitized.label,
      source: sanitized.source as ResolvedSnapshot['source'],
      timestamp: sanitized.timestamp,
      cvState: sanitized.snapshot ?? structuredClone(baseCvState),
      previewLocked: sanitized.previewLocked,
      previewLock: sanitized.previewLock,
    }
  }

  const target = targetsById.get(ref.id) ?? await getResumeTargetForSession(sessionId, ref.id)
  if (!target) {
    return null
  }

  const sanitized = sanitizeCompareRefForViewer({
    kind: 'target',
    id: target.id,
    label: `Target Resume (${target.id})`,
    source: 'target',
    timestamp: target.updatedAt.toISOString(),
    snapshot: target.derivedCvState,
    previewAccess: target.generatedOutput?.previewAccess,
  })

  return {
    kind: sanitized.kind,
    id: sanitized.id,
    label: sanitized.label,
    source: 'target',
    timestamp: sanitized.timestamp,
    cvState: sanitized.snapshot ?? structuredClone(baseCvState),
    previewLocked: sanitized.previewLocked,
    previewLock: sanitized.previewLock,
  }
}

export async function decideSessionCompare(
  context: SessionCompareContext,
): Promise<SessionCompareDecision> {
  const targets = await getResumeTargetsForSession(context.session.id)
  const targetsById = new Map(targets.map((target) => [target.id, target] as const))

  const left = await resolveCompareSnapshotRef({
    sessionId: context.session.id,
    ref: context.body.left,
    baseCvState: context.session.cvState,
    sessionGeneratedOutput: context.session.generatedOutput,
    targetsById,
  })
  if (!left) {
    return {
      kind: 'not_found',
      status: 404,
      body: { error: 'Left comparison snapshot not found.' },
    }
  }

  const right = await resolveCompareSnapshotRef({
    sessionId: context.session.id,
    ref: context.body.right,
    baseCvState: context.session.cvState,
    sessionGeneratedOutput: context.session.generatedOutput,
    targetsById,
  })
  if (!right) {
    return {
      kind: 'not_found',
      status: 404,
      body: { error: 'Right comparison snapshot not found.' },
    }
  }

  if (left.previewLocked || right.previewLocked) {
    const lockedDecision: Extract<SessionCompareDecision, { kind: 'locked' }> = {
      kind: 'locked',
      body: {
        sessionId: context.session.id,
        locked: true,
        reason: 'preview_locked',
        left: toCompareResponseRef(left),
        right: toCompareResponseRef(right),
      },
    }

    assertLockedCompareHasNoDiff(lockedDecision)
    return lockedDecision
  }

  return {
    kind: 'diff',
    body: {
      sessionId: context.session.id,
      left: toCompareResponseRef({ ...left, previewLocked: false, previewLock: undefined }),
      right: toCompareResponseRef({ ...right, previewLocked: false, previewLock: undefined }),
      diff: compareCVStates(left.cvState, right.cvState),
    },
  }
}
