import { z } from 'zod'

import { getCurrentAppUser } from '@/lib/auth/app-user'
import { getSession } from '@/lib/db/sessions'

import type { SessionVersionsContextResult } from './types'

export const ScopeSchema = z.enum(['all', 'base', 'target-derived'])

export async function resolveSessionVersionsContext(
  request: import('next/server').NextRequest,
  params: { id: string },
): Promise<SessionVersionsContextResult> {
  const appUser = await getCurrentAppUser()
  if (!appUser) {
    return { kind: 'blocked', response: { status: 401, body: { error: 'Unauthorized' } } }
  }

  const session = await getSession(params.id, appUser.id)
  if (!session) {
    return { kind: 'blocked', response: { status: 404, body: { error: 'Not found' } } }
  }

  const parsedScope = ScopeSchema.safeParse(request.nextUrl.searchParams.get('scope') ?? 'all')
  if (!parsedScope.success) {
    return { kind: 'blocked', response: { status: 400, body: { error: 'Invalid scope filter.' } } }
  }

  return {
    kind: 'allow',
    context: {
      request,
      params,
      appUser,
      session,
      scope: parsedScope.data,
    },
  }
}
