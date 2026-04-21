import { NextResponse } from 'next/server'

import type { RouteHttpResponse } from './types'

export function toNextJsonResponse(response: RouteHttpResponse): NextResponse {
  return NextResponse.json(response.body, { status: response.status })
}
