import { startDurableJobProcessing } from '@/lib/jobs/runtime'

import type { SessionGenerateContext } from './types'

export async function startSessionGenerateJob(
  context: SessionGenerateContext,
  jobId: string,
) {
  return startDurableJobProcessing({
    jobId,
    userId: context.appUser.id,
  })
}

