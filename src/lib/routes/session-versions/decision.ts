import { sanitizeVersionEntryForViewer } from '@/lib/cv/preview-sanitization'
import { getCvTimelineForSession } from '@/lib/db/cv-versions'
import { getResumeTargetsForSession } from '@/lib/db/resume-targets'

import type { SessionVersionsContext, SessionVersionsDecision } from './types'
import { assertLockedVersionHasNoSnapshot } from './invariants'

export async function decideSessionVersions(
  context: SessionVersionsContext,
): Promise<SessionVersionsDecision> {
  const [versions, targets] = await Promise.all([
    getCvTimelineForSession(context.session.id, context.scope),
    getResumeTargetsForSession(context.session.id),
  ])

  const decision = {
    sessionId: context.session.id,
    versions: versions.map((version) => sanitizeVersionEntryForViewer(version, {
      session: context.session,
      targetsById: new Map(targets.map((target) => [target.id, target] as const)),
    })),
  }

  assertLockedVersionHasNoSnapshot(decision)
  return decision
}
