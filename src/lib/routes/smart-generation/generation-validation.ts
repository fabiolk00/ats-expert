import { validateGenerationCvState } from '@/lib/agent/tools/generate-file'

import type { SmartGenerationContext, SmartGenerationDecision } from './types'
import { buildGenerationCopy, resolveWorkflowMode } from './workflow-mode'

export function evaluateSmartGenerationValidation(
  context: SmartGenerationContext,
): Extract<SmartGenerationDecision, { kind: 'validation_error' }> | null {
  const copy = buildGenerationCopy(resolveWorkflowMode(context.targetJobDescription))
  const generationValidation = validateGenerationCvState(context.cvState)
  if (!generationValidation.success) {
    return {
      kind: 'validation_error',
      status: 400,
      body: {
        error: copy.incompleteError,
        reasons: [generationValidation.errorMessage],
        missingItems: [generationValidation.errorMessage],
      },
    }
  }

  return null
}
