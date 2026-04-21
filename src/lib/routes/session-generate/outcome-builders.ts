import type { JobStatusSnapshot } from '@/types/jobs'

import { getHttpStatusForToolError, isToolErrorCode, TOOL_ERROR_CODES } from '@/lib/agent/tool-errors'

export function resolveGenerationType(scope: 'base' | 'target') {
  return scope === 'target' ? 'JOB_TARGETING' : 'ATS_ENHANCEMENT'
}

export function buildSuccessResponseBody(input: {
  job: JobStatusSnapshot
  scope: 'base' | 'target'
  targetId?: string
  inProgress?: boolean
}) {
  return {
    success: true,
    ...(input.inProgress ? { inProgress: true } : {}),
    scope: input.scope,
    targetId: input.targetId,
    creditsUsed: 0,
    generationType: resolveGenerationType(input.scope),
    jobId: input.job.jobId,
    billingStage: input.job.stage,
    resumeGenerationId: input.job.terminalResultRef?.kind === 'resume_generation'
      ? input.job.terminalResultRef.resumeGenerationId
      : undefined,
  }
}

export function buildFailedJobResponse(job: JobStatusSnapshot): {
  status: number
  body: Record<string, unknown>
} {
  const terminalErrorRef = job.terminalErrorRef

  if (terminalErrorRef?.kind === 'resume_generation_failure') {
    return {
      status: getHttpStatusForToolError(TOOL_ERROR_CODES.GENERATION_ERROR),
      body: {
        success: false,
        code: TOOL_ERROR_CODES.GENERATION_ERROR,
        error: terminalErrorRef.failureReason ?? 'File generation failed.',
        resumeGenerationId: terminalErrorRef.resumeGenerationId,
      },
    }
  }

  if (terminalErrorRef?.kind === 'job_error') {
    const status = isToolErrorCode(terminalErrorRef.code)
      ? getHttpStatusForToolError(terminalErrorRef.code)
      : 500

    return {
      status,
      body: {
        success: false,
        code: terminalErrorRef.code,
        error: terminalErrorRef.message,
      },
    }
  }

  return {
    status: 500,
    body: {
      success: false,
      code: TOOL_ERROR_CODES.GENERATION_ERROR,
      error: 'File generation failed.',
    },
  }
}

export function buildBlockedReconciliationBody() {
  return {
    success: false,
    code: 'BILLING_RECONCILIATION_PENDING',
    error: 'Previous generation billing is still being reconciled.',
  }
}

export function buildActiveExportConflictBody(job: JobStatusSnapshot) {
  return {
    success: false,
    code: 'EXPORT_ALREADY_PROCESSING',
    error: 'You already have an export in progress. Aguarde a conclus\u00e3o antes de iniciar outra exporta\u00e7\u00e3o.',
    jobId: job.jobId,
    billingStage: job.stage,
  }
}

export function buildCareerFitConfirmationBody() {
  return {
    success: false,
    error: 'A vaga parece um encaixe fraco para o perfil atual. Confirme explicitamente no chat que deseja continuar antes de gerar esta vers\u00e3o.',
    code: 'CAREER_FIT_CONFIRMATION_REQUIRED',
  }
}
