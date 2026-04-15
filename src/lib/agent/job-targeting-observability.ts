import type { Session, AtsWorkflowStage } from '@/types/agent'

export function createJobTargetingLogContext(
  session: Session,
  stage: AtsWorkflowStage,
  extra?: Record<string, string | number | boolean | null | undefined>,
): Record<string, string | number | boolean | null | undefined> {
  return {
    workflowMode: 'job_targeting',
    sessionId: session.id,
    userId: session.userId,
    stage,
    targetJobDescriptionPresent: Boolean(session.agentState.targetJobDescription?.trim()),
    rewriteStatus: session.agentState.rewriteStatus,
    ...extra,
  }
}
