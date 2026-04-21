import type { SessionVersionsDecision } from './types'

export function assertLockedVersionHasNoSnapshot(decision: SessionVersionsDecision): void {
  for (const version of decision.versions) {
    if (version.previewLocked !== true) {
      continue
    }

    if (version.snapshot) {
      throw new Error('Locked version decisions cannot carry a real snapshot.')
    }
  }
}
