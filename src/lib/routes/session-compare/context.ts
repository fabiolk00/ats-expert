import { z } from 'zod'

import { getCurrentAppUser } from '@/lib/auth/app-user'
import { getSession } from '@/lib/db/sessions'

import type { SessionCompareContextResult } from './types'

export const SnapshotRefSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('base') }),
  z.object({ kind: z.literal('version'), id: z.string().min(1) }),
  z.object({ kind: z.literal('target'), id: z.string().min(1) }),
])

export const BodySchema = z.object({
  left: SnapshotRefSchema,
  right: SnapshotRefSchema,
})

export async function resolveSessionCompareContext(
  request: import('next/server').NextRequest,
  params: { id: string },
): Promise<SessionCompareContextResult> {
  const appUser = await getCurrentAppUser()
  if (!appUser) {
    return { kind: 'blocked', response: { status: 401, body: { error: 'Unauthorized' } } }
  }

  const session = await getSession(params.id, appUser.id)
  if (!session) {
    return { kind: 'blocked', response: { status: 404, body: { error: 'Not found' } } }
  }

  const body = BodySchema.safeParse(await request.json())
  if (!body.success) {
    return { kind: 'blocked', response: { status: 400, body: { error: body.error.flatten() } } }
  }

  return {
    kind: 'allow',
    context: {
      request,
      params,
      appUser,
      session,
      body: body.data,
    },
  }
}
