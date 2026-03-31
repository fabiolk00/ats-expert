import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logInfo, logWarn, logError } from '@/lib/observability/structured-log'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

/**
 * Cleanup old processed webhook events (>30 days).
 * Called by Vercel Crons daily at 2 AM UTC.
 *
 * Uses cleanup_old_processed_events() RPC for:
 * - Timezone-safe date arithmetic (PostgreSQL NOW() not Node.js Date)
 * - Parameterizable retention window
 * - Consistent with CurrIA's RPC-based mutation pattern
 * - Better observability and error handling
 *
 * @see prisma/migrations/20260331_priority_2_operational_improvements.sql
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase.rpc(
    'cleanup_old_processed_events',
    { p_days_old: 30 }
  )

  if (error) {
    logError('cron.cleanup.failed', {
      error: error.message,
      daysOld: 30,
    })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const deletedCount = data?.[0]?.deleted_count ?? 0

  if (deletedCount > 0) {
    logInfo('cron.cleanup.completed', {
      deletedCount,
      daysOld: 30,
    })
  } else {
    logWarn('cron.cleanup.no_deletes', {
      daysOld: 30,
      message: 'No records older than 30 days found for cleanup',
    })
  }

  return NextResponse.json({ deleted: deletedCount })
}
