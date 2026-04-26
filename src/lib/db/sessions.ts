import type { Session } from '@/types/agent'

import {
  applyGeneratedOutputPatch,
  applyToolPatch,
  applyToolPatchWithVersion,
  createSession,
  getSession,
  getSessionLookupResult,
  getUserSessions,
  SessionLookupError,
  type SessionLookupResult,
  updateSession,
} from '@/lib/db/session-lifecycle'
import {
  CURRENT_SESSION_STATE_VERSION,
  mergeToolPatch,
  normalizeGeneratedOutput,
  normalizeStateVersion,
} from '@/lib/db/session-normalization'
import { appendMessage, getMessages, incrementMessageCount } from '@/lib/db/session-messages'
import { checkUserQuota } from '@/lib/db/session-quota'

export async function createSessionWithCredit(appUserId: string): Promise<Session | null> {
  void appUserId
  throw new Error(
    'createSessionWithCredit is deprecated. Use createSession() and consume credits only after a successful resume generation.',
  )
}

export const db = {
  getUserSessions,
  getSession,
  createSession,
  updateSession,
  applyGeneratedOutputPatch,
  applyToolPatch,
  applyToolPatchWithVersion,
  getMessages,
  appendMessage,
  checkUserQuota,
  incrementMessageCount,
}

export {
  appendMessage,
  applyGeneratedOutputPatch,
  applyToolPatch,
  applyToolPatchWithVersion,
  checkUserQuota,
  createSession,
  CURRENT_SESSION_STATE_VERSION,
  getMessages,
  getSession,
  getSessionLookupResult,
  getUserSessions,
  incrementMessageCount,
  mergeToolPatch,
  normalizeGeneratedOutput,
  normalizeStateVersion,
  SessionLookupError,
  type SessionLookupResult,
  updateSession,
}
