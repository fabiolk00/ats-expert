import type { NextRequest } from 'next/server'

import { handleAgentPost } from '@/lib/agent/request-orchestrator'
import { withRequestQueryTracking } from '@/lib/observability/request-query-tracking'

export async function POST(req: NextRequest) {
  return withRequestQueryTracking(req, async () => handleAgentPost(req))
}
