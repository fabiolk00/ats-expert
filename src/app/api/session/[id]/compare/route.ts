import { NextRequest, NextResponse } from 'next/server'

import { toNextJsonResponse } from '@/lib/routes/shared/response'
import { resolveSessionCompareContext } from '@/lib/routes/session-compare/context'
import { decideSessionCompare } from '@/lib/routes/session-compare/decision'
import { toSessionCompareResponse } from '@/lib/routes/session-compare/response'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const contextResult = await resolveSessionCompareContext(req, params)
  if (contextResult.kind === 'blocked') {
    return toNextJsonResponse(contextResult.response)
  }

  const decision = await decideSessionCompare(contextResult.context)
  return toSessionCompareResponse(decision)
}
