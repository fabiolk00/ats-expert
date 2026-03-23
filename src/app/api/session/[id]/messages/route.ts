import { auth }                    from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { getSession, getMessages } from '@/lib/db/sessions'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const session = await getSession(params.id, userId)
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const messages = await getMessages(params.id, 50)
    return NextResponse.json({ messages })
  } catch (err) {
    console.error('[api/session/messages]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
