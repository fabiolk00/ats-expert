import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentAppUser } from '@/lib/auth/app-user'
import { getCvTimelineForSession } from '@/lib/db/cv-versions'
import { getSession } from '@/lib/db/sessions'

const ScopeSchema = z.enum(['all', 'base', 'target-derived'])

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const appUser = await getCurrentAppUser()
  if (!appUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const session = await getSession(params.id, appUser.id)
  if (!session) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const parsedScope = ScopeSchema.safeParse(req.nextUrl.searchParams.get('scope') ?? 'all')

    if (!parsedScope.success) {
      return NextResponse.json({ error: 'Invalid scope filter.' }, { status: 400 })
    }

    const versions = await getCvTimelineForSession(session.id, parsedScope.data)
    return NextResponse.json({
      sessionId: session.id,
      versions,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
