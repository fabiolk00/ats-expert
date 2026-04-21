import type { NextRequest } from 'next/server'

import type { CVVersionSource, Session } from '@/types/agent'
import type { CVState } from '@/types/cv'
import type { PreviewLockSummary } from '@/types/dashboard'
import type { RouteHttpResponse } from '@/lib/routes/shared/types'

export type SnapshotRef =
  | { kind: 'base' }
  | { kind: 'version'; id: string }
  | { kind: 'target'; id: string }

export type ResolvedSnapshot = {
  label: string
  kind: SnapshotRef['kind']
  cvState: CVState
  previewLocked?: boolean
  previewLock?: PreviewLockSummary
  id?: string
  source?: CVVersionSource | 'target'
  timestamp?: string
}

export type SessionCompareResponseRef = {
  kind: SnapshotRef['kind']
  id?: string
  label: string
  source?: CVVersionSource | 'target'
  timestamp?: string
  previewLocked: boolean
  previewLock?: PreviewLockSummary
}

export type SessionCompareContext = {
  request: NextRequest
  params: { id: string }
  appUser: NonNullable<Awaited<ReturnType<typeof import('@/lib/auth/app-user').getCurrentAppUser>>>
  session: Session
  body: {
    left: SnapshotRef
    right: SnapshotRef
  }
}

export type SessionCompareContextResult =
  | { kind: 'allow'; context: SessionCompareContext }
  | { kind: 'blocked'; response: RouteHttpResponse }

export type SessionCompareDecision =
  | {
      kind: 'not_found'
      status: 404
      body: { error: string }
    }
  | {
      kind: 'locked'
      body: {
        sessionId: string
        locked: true
        reason: 'preview_locked'
        left: SessionCompareResponseRef
        right: SessionCompareResponseRef
      }
    }
  | {
      kind: 'diff'
      body: {
        sessionId: string
        left: SessionCompareResponseRef
        right: SessionCompareResponseRef
        diff: ReturnType<typeof import('@/lib/cv/compare').compareCVStates>
      }
    }
