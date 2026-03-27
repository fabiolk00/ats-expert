import { NextRequest, NextResponse } from 'next/server'

import { getCurrentAppUser } from '@/lib/auth/app-user'
import { manualEditSection, ManualEditInputSchema } from '@/lib/agent/tools/manual-edit'
import { applyToolPatchWithVersion, getSession, mergeToolPatch } from '@/lib/db/sessions'

function didCanonicalStateChange(previous: string, next: string): boolean {
  return previous !== next
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

  const body = ManualEditInputSchema.safeParse(await req.json())
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 })
  }

  try {
    const result = await manualEditSection(body.data)

    if (!result.output.success) {
      return NextResponse.json({ error: result.output.error }, { status: 400 })
    }

    const nextSession = mergeToolPatch(session, result.patch ?? {})
    const changed = didCanonicalStateChange(
      JSON.stringify(session.cvState),
      JSON.stringify(nextSession.cvState),
    )

    if (changed && result.patch) {
      await applyToolPatchWithVersion(session, result.patch, 'manual')
    }

    return NextResponse.json({
      ...result.output,
      changed,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
