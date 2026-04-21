import { NextRequest, NextResponse } from 'next/server'

import { toNextJsonResponse } from '@/lib/routes/shared/response'
import { resolveSessionVersionsContext } from '@/lib/routes/session-versions/context'
import { decideSessionVersions } from '@/lib/routes/session-versions/decision'
import { toSessionVersionsResponse } from '@/lib/routes/session-versions/response'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const contextResult = await resolveSessionVersionsContext(req, params)
  if (contextResult.kind === 'blocked') {
    return toNextJsonResponse(contextResult.response)
  }

  const decision = await decideSessionVersions(contextResult.context)
  return toSessionVersionsResponse(decision)
}
