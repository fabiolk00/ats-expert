import type { WorkflowMode } from '@/types/agent'

export type SmartGenerationWorkflowMode = Extract<WorkflowMode, 'ats_enhancement' | 'job_targeting'>
export type SmartGenerationCopy = {
  incompleteError: string
  creditsError: string
  pipelineError: string
  generationType: 'JOB_TARGETING' | 'ATS_ENHANCEMENT'
  idempotencyKeyPrefix: string
}

export function resolveWorkflowMode(targetJobDescription?: string): SmartGenerationWorkflowMode {
  return targetJobDescription?.trim() ? 'job_targeting' : 'ats_enhancement'
}

export function buildGenerationCopy(mode: WorkflowMode): SmartGenerationCopy {
  if (mode === 'job_targeting') {
    return {
      incompleteError: 'Complete seu currículo para adaptar sua versão para a vaga.',
      creditsError: 'Seus créditos acabaram. Recarregue seu saldo para adaptar seu currículo para a vaga.',
      pipelineError: 'Não foi possível adaptar seu currículo para a vaga agora.',
      generationType: 'JOB_TARGETING',
      idempotencyKeyPrefix: 'profile-target',
    }
  }

  return {
    incompleteError: 'Complete seu currículo para gerar uma versão ATS.',
    creditsError: 'Seus créditos acabaram. Recarregue seu saldo para gerar uma versão ATS.',
    pipelineError: 'Não foi possível melhorar sua versão ATS agora.',
    generationType: 'ATS_ENHANCEMENT',
    idempotencyKeyPrefix: 'profile-ats',
  }
}
