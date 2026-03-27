import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/sessions'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const sessions = await db.getUserSessions(userId)
    return NextResponse.json({ sessions })
  } catch (err) {
    console.error('[api/session GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // SECURITY: Do NOT allow direct session creation via this endpoint
  // Sessions must be created through /api/agent which handles credit consumption
  // Allowing direct session creation bypasses the credit system
  return NextResponse.json({
    error: 'Direct session creation not allowed. Send a message to /api/agent to start a session.',
  }, { status: 403 })

  /* DISABLED - Credit bypass vulnerability
  try {
    const session = await db.createSession(userId)
    return NextResponse.json({ sessionId: session.id })
  } catch (err) {
    console.error('[api/session POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
  */
}
