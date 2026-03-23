# API Conventions

## Route handler structure
Every API route in `src/app/api/` follows this exact pattern:

```ts
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const BodySchema = z.object({ ... })

export async function POST(req: NextRequest) {
  // 1. Auth
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 2. Parse + validate body
  const body = BodySchema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  // 3. Quota check
  const allowed = await checkUserQuota(userId)
  if (!allowed) return NextResponse.json({ error: 'Quota exceeded' }, { status: 402 })

  // 4. Business logic
  try {
    const result = await doTheThing(body.data)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[api/route]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

## Agent route — /api/agent
- Accepts: `{ sessionId: string, message: string, file?: string (base64) }`
- Returns: streaming `text/event-stream` with `{ delta: string }` chunks + final `{ done: true, phase: Phase }`
- Never returns the full CVState to the client — only the phase and the agent's text response
- Max request body: 10MB (for file uploads)

## File route — /api/file/[sessionId]
- GET: returns a signed Supabase Storage URL (expires in 1 hour)
- Only accessible if the session belongs to the authenticated user
- Never stream file bytes through the API — always redirect to the signed URL

## Webhook route — /api/webhook/asaas
- Verify Asaas webhook token before processing
- Idempotent: check if the event was already processed before writing to DB
- Return 200 immediately; do heavy work asynchronously

## HTTP status codes
| Situation | Status |
|---|---|
| Success | 200 |
| Created | 201 |
| Bad input | 400 |
| Unauthenticated | 401 |
| Quota / payment required | 402 |
| Forbidden (wrong user) | 403 |
| Not found | 404 |
| Server error | 500 |

## Rate limiting
All public routes are rate-limited via Upstash Redis:
- Free tier: 10 requests/minute per IP
- Authenticated: 60 requests/minute per userId
