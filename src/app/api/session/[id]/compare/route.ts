import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentAppUser } from '@/lib/auth/app-user'
import { compareCVStates } from '@/lib/cv/compare'
import { sanitizeCompareRefForViewer } from '@/lib/cv/preview-sanitization'
import { getCvVersionForSession, toTimelineEntry } from '@/lib/db/cv-versions'
import { getResumeTargetForSession, getResumeTargetsForSession } from '@/lib/db/resume-targets'
import { getSession } from '@/lib/db/sessions'
import type { CVVersionSource } from '@/types/agent'
import type { CVState } from '@/types/cv'
import type { PreviewLockSummary } from '@/types/dashboard'

const SnapshotRefSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('base'),
  }),
  z.object({
    kind: z.literal('version'),
    id: z.string().min(1),
  }),
  z.object({
    kind: z.literal('target'),
    id: z.string().min(1),
  }),
])

const BodySchema = z.object({
  left: SnapshotRefSchema,
  right: SnapshotRefSchema,
})

type SnapshotRef = z.infer<typeof SnapshotRefSchema>

type ResolvedSnapshot = {
  label: string
  kind: SnapshotRef['kind']
  cvState: CVState
  previewLocked?: boolean
  previewLock?: PreviewLockSummary
  id?: string
  source?: CVVersionSource | 'target'
  timestamp?: string
}

async function resolveSnapshotRef(input: {
  sessionId: string
  ref: SnapshotRef
  baseCvState: CVState
  sessionGeneratedOutput: NonNullable<Awaited<ReturnType<typeof getSession>>>['generatedOutput']
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
      source: sanitized.source as CVVersionSource,
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

  const body = BodySchema.safeParse(await req.json())
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 })
  }

  try {
    const targets = await getResumeTargetsForSession(session.id)
    const targetsById = new Map(targets.map((target) => [target.id, target] as const))

    const left = await resolveSnapshotRef({
      sessionId: session.id,
      ref: body.data.left,
      baseCvState: session.cvState,
      sessionGeneratedOutput: session.generatedOutput,
      targetsById,
    })
    if (!left) {
      return NextResponse.json({ error: 'Left comparison snapshot not found.' }, { status: 404 })
    }

    const right = await resolveSnapshotRef({
      sessionId: session.id,
      ref: body.data.right,
      baseCvState: session.cvState,
      sessionGeneratedOutput: session.generatedOutput,
      targetsById,
    })
    if (!right) {
      return NextResponse.json({ error: 'Right comparison snapshot not found.' }, { status: 404 })
    }

    if (left.previewLocked || right.previewLocked) {
      return NextResponse.json({
        sessionId: session.id,
        locked: true,
        reason: 'preview_locked',
        left: {
          kind: left.kind,
          id: left.id,
          label: left.label,
          source: left.source,
          timestamp: left.timestamp,
          previewLocked: left.previewLocked ?? false,
          previewLock: left.previewLock,
        },
        right: {
          kind: right.kind,
          id: right.id,
          label: right.label,
          source: right.source,
          timestamp: right.timestamp,
          previewLocked: right.previewLocked ?? false,
          previewLock: right.previewLock,
        },
      })
    }

    return NextResponse.json({
      sessionId: session.id,
      left: {
        kind: left.kind,
        id: left.id,
        label: left.label,
        source: left.source,
        timestamp: left.timestamp,
        previewLocked: false,
      },
      right: {
        kind: right.kind,
        id: right.id,
        label: right.label,
        source: right.source,
        timestamp: right.timestamp,
        previewLocked: false,
      },
      diff: compareCVStates(left.cvState, right.cvState),
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
