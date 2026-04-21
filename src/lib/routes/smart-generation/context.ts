import { z } from 'zod'

import type { CVState } from '@/types/cv'

import { getCurrentAppUser } from '@/lib/auth/app-user'
import { CVStateSchema } from '@/lib/cv/schema'
import { logWarn } from '@/lib/observability/structured-log'
import { validateTrustedMutationRequest } from '@/lib/security/request-trust'

import type { SmartGenerationContextResult } from './types'

export const SmartGenerationRequestSchema = CVStateSchema.extend({
  targetJobDescription: z.string().trim().max(20_000).optional(),
})

export async function resolveSmartGenerationContext(
  request: import('next/server').NextRequest,
): Promise<SmartGenerationContextResult> {
  const appUser = await getCurrentAppUser()
  if (!appUser) {
    return { kind: 'blocked', response: { status: 401, body: { error: 'Unauthorized' } } }
  }

  const trust = validateTrustedMutationRequest(request)
  if (!trust.ok) {
    logWarn('api.profile.smart_generation.untrusted_request', {
      appUserId: appUser.id,
      requestMethod: request.method,
      requestPath: request.nextUrl.pathname,
      success: false,
      trustSignal: trust.signal,
      trustReason: trust.reason,
    })
    return { kind: 'blocked', response: { status: 403, body: { error: 'Forbidden' } } }
  }

  const parsed = SmartGenerationRequestSchema.safeParse(await request.json())
  if (!parsed.success) {
    return { kind: 'blocked', response: { status: 400, body: { error: parsed.error.flatten() } } }
  }

  const { targetJobDescription: rawTargetJobDescription, ...cvState } = parsed.data

  return {
    kind: 'allow',
    context: {
      request,
      appUser,
      cvState: cvState as CVState,
      targetJobDescription: rawTargetJobDescription?.trim() || undefined,
    },
  }
}
