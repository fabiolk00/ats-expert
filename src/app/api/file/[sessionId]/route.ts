import { NextRequest, NextResponse } from 'next/server'

import { toNextJsonResponse } from '@/lib/routes/shared/response'
import { resolveFileAccessContext } from '@/lib/routes/file-access/context'
import { decideFileAccess } from '@/lib/routes/file-access/decision'
import { toFileAccessResponse } from '@/lib/routes/file-access/response'

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } },
): Promise<NextResponse> {
  // Execution order:
  // 1. resolve request context
  // 2. evaluate availability and preview decisions
  // 3. map normalized outcomes to HTTP
  const contextResult = await resolveFileAccessContext(req, params)
  if (contextResult.kind === 'blocked') {
    return toNextJsonResponse(contextResult.response)
  }

  const context = contextResult.context
  const decision = decideFileAccess(context)
  return toFileAccessResponse(context, decision)
}
