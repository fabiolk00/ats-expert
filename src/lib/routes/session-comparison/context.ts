import { getCurrentAppUser } from '@/lib/auth/app-user'
import { getSession } from '@/lib/db/sessions'

import type { SessionComparisonContextResult } from './types'

export async function resolveSessionComparisonContext(
  request: import('next/server').NextRequest,
  params: { id: string },
): Promise<SessionComparisonContextResult> {
  const appUser = await getCurrentAppUser()
  if (!appUser) {
    return { kind: 'blocked', response: { status: 401, body: { error: 'Unauthorized' } } }
  }

  const session = await getSession(params.id, appUser.id)
  if (!session) {
    return { kind: 'blocked', response: { status: 404, body: { error: 'Not found' } } }
  }

  return {
    kind: 'allow',
    context: {
      request,
      params,
      appUser,
      session,
    },
  }
}
