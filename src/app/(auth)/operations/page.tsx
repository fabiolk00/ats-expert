import { redirect } from 'next/navigation'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentAppUser } from '@/lib/auth/app-user'
import { canAccessOperationsDashboard } from '@/lib/auth/operations-access'
import { getExportOperationsSnapshot } from '@/lib/ops/export-operations'
import { PROFILE_SETUP_PATH } from '@/lib/routes/app'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function ageCopy(value: number | null): string {
  return value === null ? 'none' : `${value} min`
}

export default async function OperationsPage() {
  const appUser = await getCurrentAppUser()

  if (!canAccessOperationsDashboard(appUser)) {
    redirect(PROFILE_SETUP_PATH)
  }

  const snapshot = await getExportOperationsSnapshot()

  return (
    <div className="space-y-6 px-4 py-6 lg:px-8">
      <div className="space-y-3">
        <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.2em]">
          Operations
        </Badge>
        <div>
          <h1 className="text-3xl font-black tracking-tight">Export health</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Queue, export, and reconciliation visibility for worker operations.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><CardHeader><CardTitle>Queue</CardTitle></CardHeader><CardContent className="space-y-1 text-sm"><p>Queued: {snapshot.queue.queuedJobs}</p><p>Running: {snapshot.queue.runningJobs}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Exports</CardTitle></CardHeader><CardContent className="space-y-1 text-sm"><p>Started: {snapshot.exports.started}</p><p>Completed: {snapshot.exports.completed}</p><p>Failed: {snapshot.exports.failed}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Reservations</CardTitle></CardHeader><CardContent className="space-y-1 text-sm"><p>Created: {snapshot.reservations.created}</p><p>Finalized: {snapshot.reservations.finalized}</p><p>Released: {snapshot.reservations.released}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Reconciliation</CardTitle></CardHeader><CardContent className="space-y-1 text-sm"><p>Pending: {snapshot.reservations.needsReconciliation}</p><p>Manual review: {snapshot.reservations.manualReview}</p><p>Oldest pending: {ageCopy(snapshot.reservations.oldestPendingReconciliationAgeMinutes)}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {snapshot.alerts.length === 0 ? (
            <p className="text-muted-foreground">No active alerts in the current window.</p>
          ) : (
            snapshot.alerts.map((alert) => (
              <div key={alert.kind} className="rounded-xl border border-border/60 bg-background/70 px-4 py-3">
                <p className="font-medium">{alert.kind}</p>
                <p className="mt-1 text-muted-foreground">{alert.message}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
