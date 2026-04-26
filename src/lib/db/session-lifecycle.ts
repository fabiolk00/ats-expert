import type {
  CVVersionSource,
  GeneratedOutput,
  Phase,
  Session,
  ToolPatch,
  AgentState,
} from '@/types/agent'
import type { ATSScoreResult, CVState } from '@/types/cv'
import { createDatabaseId } from '@/lib/db/ids'
import { getSupabaseAdminClient } from '@/lib/db/supabase-admin'
import {
  createInsertTimestamps,
  createUpdatedAtTimestamp,
} from '@/lib/db/timestamps'
import {
  cloneCvState,
  CURRENT_SESSION_STATE_VERSION,
  mapSessionRow,
  mergeToolPatch,
  normalizeAgentState,
  normalizeGeneratedOutput,
  normalizeStateVersion,
  type SessionRow,
} from '@/lib/db/session-normalization'

type PostgrestErrorLike = {
  code?: string
  message?: string
  details?: string
  hint?: string
}

export class SessionLookupError extends Error {
  readonly code?: string
  readonly dbDetails?: string
  readonly dbHint?: string
  readonly sessionId: string
  readonly appUserId: string

  constructor(input: {
    sessionId: string
    appUserId: string
    message: string
    cause?: unknown
    code?: string
    dbDetails?: string
    dbHint?: string
  }) {
    super(input.message, input.cause ? { cause: input.cause } : undefined)
    this.name = 'SessionLookupError'
    this.code = input.code
    this.dbDetails = input.dbDetails
    this.dbHint = input.dbHint
    this.sessionId = input.sessionId
    this.appUserId = input.appUserId
  }
}

export type SessionLookupResult =
  | { kind: 'found'; session: Session }
  | { kind: 'not_found' }
  | { kind: 'lookup_error'; error: SessionLookupError }

function isSessionNotFoundError(error: PostgrestErrorLike | null | undefined): boolean {
  return error?.code === 'PGRST116'
}

export async function getUserSessions(appUserId: string, limit = 20): Promise<Session[]> {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', appUserId)
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []

  return data.map((row) => mapSessionRow(row as SessionRow))
}

export async function getSessionLookupResult(
  sessionId: string,
  appUserId: string,
): Promise<SessionLookupResult> {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', appUserId)
    .single()

  if (error) {
    if (isSessionNotFoundError(error)) {
      return { kind: 'not_found' }
    }

    return {
      kind: 'lookup_error',
      error: new SessionLookupError({
        sessionId,
        appUserId,
        message: `Failed to load session: ${error.message ?? 'Unknown lookup error'}`,
        cause: error,
        code: error.code,
        dbDetails: error.details,
        dbHint: error.hint,
      }),
    }
  }

  if (!data) {
    return { kind: 'not_found' }
  }

  try {
    return {
      kind: 'found',
      session: mapSessionRow(data as SessionRow),
    }
  } catch (error) {
    return {
      kind: 'lookup_error',
      error: new SessionLookupError({
        sessionId,
        appUserId,
        message: error instanceof Error ? error.message : 'Failed to normalize session row.',
        cause: error,
      }),
    }
  }
}

export async function getSession(sessionId: string, appUserId: string): Promise<Session | null> {
  const result = await getSessionLookupResult(sessionId, appUserId)

  if (result.kind !== 'found') {
    return null
  }

  return result.session
}

async function seedCvStateFromProfile(appUserId: string): Promise<CVState> {
  const supabase = getSupabaseAdminClient()
  const { data } = await supabase
    .from('user_profiles')
    .select('cv_state')
    .eq('user_id', appUserId)
    .single()

  if (data && data.cv_state) {
    return cloneCvState(data.cv_state as CVState)
  }

  return cloneCvState()
}

export async function createSession(appUserId: string): Promise<Session> {
  const supabase = getSupabaseAdminClient()
  const timestamps = createInsertTimestamps()
  const cvState = await seedCvStateFromProfile(appUserId)

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      id: createDatabaseId(),
      ...timestamps,
      user_id: appUserId,
      state_version: CURRENT_SESSION_STATE_VERSION,
      phase: 'intake',
      cv_state: cvState,
      agent_state: normalizeAgentState(undefined),
      generated_output: normalizeGeneratedOutput(undefined),
      credits_used: 0,
    })
    .select()
    .single()

  if (error || !data) throw new Error(`Failed to create session: ${error?.message}`)

  return {
    id: data.id,
    userId: data.user_id,
    stateVersion: normalizeStateVersion((data as SessionRow).state_version),
    phase: 'intake',
    cvState: cloneCvState(cvState),
    agentState: normalizeAgentState(undefined),
    generatedOutput: normalizeGeneratedOutput(undefined),
    creditsUsed: 0,
    messageCount: 0,
    creditConsumed: false,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  }
}

export async function updateSession(
  sessionId: string,
  patch: Partial<{
    phase: Phase
    cvState: CVState
    agentState: AgentState
    generatedOutput: GeneratedOutput
    internalHeuristicAtsScore: ATSScoreResult
    creditsUsed: number
    messageCount: number
    creditConsumed: boolean
  }>,
): Promise<void> {
  const supabase = getSupabaseAdminClient()
  const update: Record<string, unknown> = { ...createUpdatedAtTimestamp() }
  if (patch.phase !== undefined) update.phase = patch.phase
  if (patch.cvState !== undefined) update.cv_state = patch.cvState
  if (patch.agentState !== undefined) update.agent_state = patch.agentState
  if (patch.generatedOutput !== undefined) update.generated_output = patch.generatedOutput
  if (patch.internalHeuristicAtsScore !== undefined) update.ats_score = patch.internalHeuristicAtsScore
  if (patch.creditsUsed !== undefined) update.credits_used = patch.creditsUsed
  if (patch.messageCount !== undefined) update.message_count = patch.messageCount
  if (patch.creditConsumed !== undefined) update.credit_consumed = patch.creditConsumed

  const { error } = await supabase.from('sessions').update(update).eq('id', sessionId)
  if (error) throw new Error(`Failed to update session: ${error.message}`)
}

export async function applyToolPatch(session: Session, patch?: ToolPatch): Promise<void> {
  if (!patch || Object.keys(patch).length === 0) {
    return
  }

  const mergedSession = mergeToolPatch(session, patch)

  await updateSession(session.id, {
    phase: patch.phase !== undefined ? mergedSession.phase : undefined,
    cvState: patch.cvState !== undefined ? mergedSession.cvState : undefined,
    agentState:
      patch.agentState !== undefined || patch.atsReadiness !== undefined
        ? mergedSession.agentState
        : undefined,
    generatedOutput:
      patch.generatedOutput !== undefined ? mergedSession.generatedOutput : undefined,
    internalHeuristicAtsScore:
      patch.internalHeuristicAtsScore !== undefined
        ? mergedSession.internalHeuristicAtsScore
        : undefined,
  })

  session.phase = mergedSession.phase
  session.cvState = mergedSession.cvState
  session.agentState = mergedSession.agentState
  session.generatedOutput = mergedSession.generatedOutput
  session.internalHeuristicAtsScore = mergedSession.internalHeuristicAtsScore
  session.updatedAt = mergedSession.updatedAt
}

export async function applyGeneratedOutputPatch(
  session: Session,
  generatedOutputPatch: Partial<GeneratedOutput>,
): Promise<void> {
  const nextGeneratedOutput = normalizeGeneratedOutput({
    ...session.generatedOutput,
    ...generatedOutputPatch,
  })

  await updateSession(session.id, {
    generatedOutput: nextGeneratedOutput,
  })

  session.generatedOutput = nextGeneratedOutput
  session.updatedAt = new Date()
}

export async function applyToolPatchWithVersion(
  session: Session,
  patch: ToolPatch | undefined,
  versionSource?: CVVersionSource,
): Promise<void> {
  if (!patch || Object.keys(patch).length === 0) {
    return
  }

  const mergedSession = mergeToolPatch(session, patch)
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase.rpc('apply_session_patch_with_version', {
    p_session_id: session.id,
    p_user_id: session.userId,
    p_phase: mergedSession.phase,
    p_cv_state: mergedSession.cvState,
    p_agent_state: mergedSession.agentState,
    p_generated_output: mergedSession.generatedOutput,
    p_ats_score: mergedSession.internalHeuristicAtsScore ?? null,
    p_version_source: versionSource ?? null,
  })

  if (error || data !== true) {
    throw new Error(
      `Failed to apply tool patch transactionally: ${error?.message ?? 'Unknown RPC failure'}`,
    )
  }

  session.phase = mergedSession.phase
  session.cvState = mergedSession.cvState
  session.agentState = mergedSession.agentState
  session.generatedOutput = mergedSession.generatedOutput
  session.internalHeuristicAtsScore = mergedSession.internalHeuristicAtsScore
  session.updatedAt = mergedSession.updatedAt
}
