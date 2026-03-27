import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentAppUser } from '@/lib/auth/app-user'
import { getSession } from '@/lib/db/sessions'
import { getResumeTargetsForSession } from '@/lib/db/resume-targets'
import { createTargetResumeVariant } from '@/lib/resume-targets/create-target-resume'

const BodySchema = z.object({
  targetJobDescription: z.string().min(1).max(20000),
})

export async function GET(
  _req: NextRequest,
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
    const targets = await getResumeTargetsForSession(session.id)
    return NextResponse.json({ targets })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
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

  const body = BodySchema.safeParse(await req.json())
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 })
  }

  try {
    const result = await createTargetResumeVariant({
      sessionId: session.id,
      userId: session.userId,
      baseCvState: session.cvState,
      targetJobDescription: body.data.targetJobDescription,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ target: result.target })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
