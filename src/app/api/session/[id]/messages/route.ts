import { NextRequest, NextResponse } from 'next/server'

import { getCurrentAppUser } from '@/lib/auth/app-user'
import { getSession, getMessages } from '@/lib/db/sessions'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const appUser = await getCurrentAppUser()
  if (!appUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const session = await getSession(params.id, appUser.id)
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const messages = await getMessages(params.id, 50)
    return NextResponse.json({ messages })
  } catch (err) {
    console.error('[api/session/messages]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
