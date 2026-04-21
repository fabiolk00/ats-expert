import type { NextRequest } from 'next/server'

import type { CVTimelineEntry, ResumeTarget, Session } from '@/types/agent'
import type { RouteHttpResponse } from '@/lib/routes/shared/types'

export type SessionVersionsContext = {
  request: NextRequest
  params: { id: string }
  appUser: NonNullable<Awaited<ReturnType<typeof import('@/lib/auth/app-user').getCurrentAppUser>>>
  session: Session
  scope: 'all' | 'base' | 'target-derived'
}

export type SessionVersionsContextResult =
  | { kind: 'allow'; context: SessionVersionsContext }
  | { kind: 'blocked'; response: RouteHttpResponse }

export type SessionVersionsDecision = {
  sessionId: string
  versions: Array<ReturnType<typeof import('@/lib/cv/preview-sanitization').sanitizeVersionEntryForViewer>>
}

export type SessionVersionsLoadedData = {
  versions: CVTimelineEntry[]
  targets: ResumeTarget[]
}
