import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentAppUser } from '@/lib/auth/app-user'
import { compareCVStates } from '@/lib/cv/compare'
import { getCvVersionForSession, toTimelineEntry } from '@/lib/db/cv-versions'
import { getResumeTargetForSession } from '@/lib/db/resume-targets'
import { getSession } from '@/lib/db/sessions'
import type { CVVersionSource } from '@/types/agent'
import type { CVState } from '@/types/cv'

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
  id?: string
  source?: CVVersionSource | 'target'
  timestamp?: string
}

async function resolveSnapshotRef(sessionId: string, ref: SnapshotRef, baseCvState: CVState): Promise<ResolvedSnapshot | null> {
  if (ref.kind === 'base') {
    return {
      kind: 'base',
      label: 'Current Base Resume',
      cvState: structuredClone(baseCvState),
    }
  }

  if (ref.kind === 'version') {
    const version = await getCvVersionForSession(sessionId, ref.id)
    if (!version) {
      return null
    }

    const timelineEntry = toTimelineEntry(version)
    return {
      kind: 'version',
      id: version.id,
      label: timelineEntry.label,
      source: version.source,
      timestamp: timelineEntry.timestamp,
      cvState: structuredClone(version.snapshot),
    }
  }

  const target = await getResumeTargetForSession(sessionId, ref.id)
  if (!target) {
    return null
  }

  return {
    kind: 'target',
    id: target.id,
    label: `Target Resume (${target.id})`,
    source: 'target',
    timestamp: target.updatedAt.toISOString(),
    cvState: structuredClone(target.derivedCvState),
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
    const left = await resolveSnapshotRef(session.id, body.data.left, session.cvState)
    if (!left) {
      return NextResponse.json({ error: 'Left comparison snapshot not found.' }, { status: 404 })
    }

    const right = await resolveSnapshotRef(session.id, body.data.right, session.cvState)
    if (!right) {
      return NextResponse.json({ error: 'Right comparison snapshot not found.' }, { status: 404 })
    }

    return NextResponse.json({
      sessionId: session.id,
      left: {
        kind: left.kind,
        id: left.id,
        label: left.label,
        source: left.source,
        timestamp: left.timestamp,
      },
      right: {
        kind: right.kind,
        id: right.id,
        label: right.label,
        source: right.source,
        timestamp: right.timestamp,
      },
      diff: compareCVStates(left.cvState, right.cvState),
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
