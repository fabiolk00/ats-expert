import type { SmartGenerationContext, SmartGenerationDecision } from './types'
import { dispatchSmartGenerationArtifact, runSmartGenerationPipeline } from './dispatch'
import { evaluateSmartGenerationValidation } from './generation-validation'
import { evaluateSmartGenerationReadiness } from './readiness'
import {
  normalizeSmartGenerationDispatchFailure,
  normalizeSmartGenerationPipelineFailure,
  normalizeSmartGenerationSuccess,
} from './result-normalization'
import { bootstrapSmartGenerationSession } from './session-bootstrap'
import { buildGenerationCopy, resolveWorkflowMode } from './workflow-mode'
export { buildGenerationCopy, resolveWorkflowMode } from './workflow-mode'

export async function executeSmartGenerationDecision(
  context: SmartGenerationContext,
): Promise<SmartGenerationDecision> {
  // Execution order:
  // 1. resolve workflow mode and copy
  // 2. validate readiness and quota
  // 3. bootstrap the session with the request snapshot
  // 4. run the selected pipeline and artifact generation
  // 5. normalize the public outcome
  const workflowMode = resolveWorkflowMode(context.targetJobDescription)
  const copy = buildGenerationCopy(workflowMode)
  const readinessError = await evaluateSmartGenerationReadiness(context)
  if (readinessError) {
    return readinessError
  }

  const validationError = evaluateSmartGenerationValidation(context)
  if (validationError) {
    return validationError
  }

  const { session, patchedSession } = await bootstrapSmartGenerationSession(context)
  const workflow = { workflowMode, copy, session, patchedSession } as const
  const pipeline = await runSmartGenerationPipeline(patchedSession, workflowMode)

  if (!pipeline.success || !pipeline.optimizedCvState) {
    return normalizeSmartGenerationPipelineFailure({
      pipeline,
      workflow,
      sessionId: session.id,
      patchedSession,
    })
  }

  const generationResult = await dispatchSmartGenerationArtifact({
    patchedSession,
    optimizedCvState: pipeline.optimizedCvState,
    idempotencyKey: `${copy.idempotencyKeyPrefix}:${session.id}`,
  })

  if (generationResult.outputFailure) {
    return normalizeSmartGenerationDispatchFailure(generationResult)
  }

  return normalizeSmartGenerationSuccess({
    context,
    sessionId: session.id,
    optimizedCvState: pipeline.optimizedCvState,
    generationResult,
    workflow,
  })
}
