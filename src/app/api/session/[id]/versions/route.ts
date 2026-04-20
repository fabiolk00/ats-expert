import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentAppUser } from '@/lib/auth/app-user'
import { sanitizeVersionEntryForViewer } from '@/lib/cv/preview-sanitization'
import { getCvTimelineForSession } from '@/lib/db/cv-versions'
import { getResumeTargetsForSession } from '@/lib/db/resume-targets'
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

    const [versions, targets] = await Promise.all([
      getCvTimelineForSession(session.id, parsedScope.data),
      getResumeTargetsForSession(session.id),
    ])

    return NextResponse.json({
      sessionId: session.id,
      versions: versions.map((version) => sanitizeVersionEntryForViewer(version, {
        session,
        targetsById: new Map(targets.map((target) => [target.id, target] as const)),
      })),
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
