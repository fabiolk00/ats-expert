import { createClient } from '@supabase/supabase-js'
import type { Session, Message, Phase } from '@/types/agent'
import type { ATSScoreResult, CVState } from '@/types/cv'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const EMPTY_CV_STATE: CVState = {
  fullName: '', email: '', phone: '', summary: '',
  experience: [], skills: [], education: [],
}

export async function getUserSessions(userId: string, limit = 20): Promise<Session[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []

  return data.map(row => ({
    id:           row.id,
    userId:       row.user_id,
    phase:        row.phase as Phase,
    cvState:      (row.cv_state as CVState) ?? EMPTY_CV_STATE,
    atsScore:     row.ats_score as ATSScoreResult | undefined,
    creditsUsed:  row.credits_used,
    createdAt:    new Date(row.created_at),
    updatedAt:    new Date(row.updated_at),
  }))
}

export async function getSession(sessionId: string, userId: string): Promise<Session | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single()

  if (error || !data) return null

  return {
    id:           data.id,
    userId:       data.user_id,
    phase:        data.phase as Phase,
    cvState:      (data.cv_state as CVState) ?? EMPTY_CV_STATE,
    atsScore:     data.ats_score as ATSScoreResult | undefined,
    creditsUsed:  data.credits_used,
    createdAt:    new Date(data.created_at),
    updatedAt:    new Date(data.updated_at),
  }
}

export async function createSession(userId: string): Promise<Session> {
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id:      userId,
      phase:        'intake',
      cv_state:     EMPTY_CV_STATE,
      credits_used: 0,
    })
    .select()
    .single()

  if (error || !data) throw new Error(`Failed to create session: ${error?.message}`)

  return {
    id:           data.id,
    userId:       data.user_id,
    phase:        'intake',
    cvState:      EMPTY_CV_STATE,
    creditsUsed:  0,
    createdAt:    new Date(data.created_at),
    updatedAt:    new Date(data.updated_at),
  }
}

export async function updateSession(
  sessionId: string,
  patch: Partial<{ phase: Phase; cvState: CVState; atsScore: ATSScoreResult; creditsUsed: number }>,
): Promise<void> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.phase       !== undefined) update.phase        = patch.phase
  if (patch.cvState     !== undefined) update.cv_state     = patch.cvState
  if (patch.atsScore    !== undefined) update.ats_score    = patch.atsScore
  if (patch.creditsUsed !== undefined) update.credits_used = patch.creditsUsed

  const { error } = await supabase.from('sessions').update(update).eq('id', sessionId)
  if (error) throw new Error(`Failed to update session: ${error.message}`)
}

export async function getMessages(sessionId: string, limit = 12): Promise<Message[]> {
  const { data } = await supabase
    .from('messages')
    .select('role, content, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!data) return []

  return data
    .reverse()
    .map(r => ({ role: r.role as Message['role'], content: r.content, createdAt: new Date(r.created_at) }))
}

export async function appendMessage(
  sessionId: string,
  role: Message['role'],
  content: string,
): Promise<void> {
  await supabase.from('messages').insert({ session_id: sessionId, role, content })
}

export async function checkUserQuota(userId: string): Promise<boolean> {
  const { checkUserQuota: check } = await import('@/lib/asaas/quota')
  return check(userId)
}

export const db = {
  getUserSessions,
  getSession,
  createSession,
  updateSession,
  getMessages,
  appendMessage,
  checkUserQuota,
}
