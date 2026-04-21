import { describe, expect, it } from 'vitest'

import { buildGenerationCopy, resolveWorkflowMode } from './decision'

describe('smart-generation helpers', () => {
  it('resolves workflow mode from target job description presence', () => {
    expect(resolveWorkflowMode()).toBe('ats_enhancement')
    expect(resolveWorkflowMode('vaga alvo')).toBe('job_targeting')
  })

  it('builds the current generation copy for ATS mode', () => {
    expect(buildGenerationCopy('ats_enhancement')).toEqual({
      incompleteError: 'Complete seu currículo para gerar uma versão ATS.',
      creditsError: 'Seus créditos acabaram. Recarregue seu saldo para gerar uma versão ATS.',
      pipelineError: 'Não foi possível melhorar sua versão ATS agora.',
      generationType: 'ATS_ENHANCEMENT',
      idempotencyKeyPrefix: 'profile-ats',
    })
  })
})
