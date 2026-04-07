import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/app-user'
import { linkedinQueue } from '@/lib/linkedin/queue'
import { logError, logInfo } from '@/lib/observability/structured-log'

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const appUser = await getCurrentAppUser()
  if (!appUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { jobId } = params

  try {
    const job = await linkedinQueue.getJob(jobId)

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Verify ownership - job data should contain the app user ID
    if (job.data.appUserId !== appUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const state = await job.getState()

    logInfo('[api/profile/status] Job status checked', {
      jobId,
      state,
      appUserId: appUser.id,
    })

    return NextResponse.json({
      jobId,
      status: state,
    })
  } catch (error) {
    logError('[api/profile/status] Failed to get job status', {
      jobId,
      appUserId: appUser.id,
      error: error instanceof Error ? error.message : String(error),
    })

    return NextResponse.json(
      { error: 'Failed to get job status' },
      { status: 500 }
    )
  }
}
