import type { Message } from '@/types/agent'
import { createDatabaseId } from '@/lib/db/ids'
import { getSupabaseAdminClient } from '@/lib/db/supabase-admin'
import { createCreatedAtTimestamp, createUpdatedAtTimestamp } from '@/lib/db/timestamps'

export async function incrementMessageCount(sessionId: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient()
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data: sessionData, error: selectError } = await supabase
      .from('sessions')
      .select('message_count')
      .eq('id', sessionId)
      .single()

    if (selectError || !sessionData) {
      throw new Error(
        `Failed to load session message count: ${selectError?.message ?? 'Session not found'}`,
      )
    }

    const currentCount = sessionData.message_count ?? 0
    const { data: updatedRow, error: updateError } = await supabase
      .from('sessions')
      .update({
        message_count: currentCount + 1,
        ...createUpdatedAtTimestamp(),
      })
      .eq('id', sessionId)
      .eq('message_count', currentCount)
      .select('message_count')
      .maybeSingle()

    if (updateError) {
      throw new Error(`Failed to increment message count: ${updateError.message}`)
    }

    if (updatedRow) {
      return true
    }
  }

  throw new Error('Failed to increment message count after concurrent update retries.')
}

export async function getMessages(sessionId: string, limit = 24): Promise<Message[]> {
  const supabase = getSupabaseAdminClient()
  const { data } = await supabase
    .from('messages')
    .select('role, content, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!data) return []

  return data.reverse().map((row) => ({
    role: row.role as Message['role'],
    content: row.content,
    createdAt: new Date(row.created_at),
  }))
}

export async function appendMessage(
  sessionId: string,
  role: Message['role'],
  content: string,
): Promise<void> {
  const supabase = getSupabaseAdminClient()
  await supabase.from('messages').insert({
    id: createDatabaseId(),
    ...createCreatedAtTimestamp(),
    session_id: sessionId,
    role,
    content,
  })
}
