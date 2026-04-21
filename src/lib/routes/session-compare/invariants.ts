import type { SessionCompareDecision } from './types'

export function assertLockedCompareHasNoDiff(
  decision: Extract<SessionCompareDecision, { kind: 'locked' }>,
): void {
  if ('diff' in decision.body) {
    throw new Error('Locked compare decisions cannot carry a diff payload.')
  }
}
