import { NextRequest, NextResponse } from 'next/server'

import { getCurrentAppUser } from '@/lib/auth/app-user'
import { getResumeTargetForSession } from '@/lib/db/resume-targets'
import { getSession } from '@/lib/db/sessions'
import {
  buildLockedPreviewPdfBytes,
  isLockedPreview,
} from '@/lib/generated-preview/locked-preview'

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } },
): Promise<NextResponse> {
  const appUser = await getCurrentAppUser()
  if (!appUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const session = await getSession(params.sessionId, appUser.id)
  if (!session) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const targetId = req.nextUrl.searchParams.get('targetId')
  const target = targetId
    ? await getResumeTargetForSession(session.id, targetId)
    : null

  if (targetId && !target) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const output = target?.generatedOutput ?? session.generatedOutput
  if (!isLockedPreview(output)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const bytes = buildLockedPreviewPdfBytes(target ? 'target' : 'optimized')

  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Cache-Control': 'private, no-store',
      'Content-Disposition': 'inline; filename="resume-preview.pdf"',
    },
  })
}
