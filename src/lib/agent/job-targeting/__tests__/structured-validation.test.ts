import { describe, expect, it } from 'vitest'

import { validateGeneratedClaims } from '@/lib/agent/job-targeting/compatibility/structured-validation'
import type { JobCompatibilityClaimPolicy } from '@/lib/agent/job-targeting/compatibility/types'

const policy: JobCompatibilityClaimPolicy = {
  allowedClaims: [
    {
      id: 'claim-allowed-supported',
      signal: 'Supported signal',
      permission: 'allowed',
      evidenceBasis: [{ id: 'span-supported', text: 'Supported signal' }],
      allowedTerms: ['Supported signal'],
      prohibitedTerms: [],
      rationale: 'Supported by resume evidence.',
      requirementIds: ['req-supported'],
    },
  ],
  cautiousClaims: [
    {
      id: 'claim-cautious-adjacent',
      signal: 'Adjacent target signal',
      permission: 'cautious',
      verbalizationTemplate: 'Use related evidence: {allowedTerms}.',
      evidenceBasis: [{ id: 'span-related', text: 'Related resume signal' }],
      allowedTerms: ['Related resume signal'],
      prohibitedTerms: ['Adjacent target signal'],
      rationale: 'Only related evidence exists.',
      requirementIds: ['req-adjacent'],
    },
  ],
  forbiddenClaims: [
    {
      id: 'claim-forbidden-unsupported',
      signal: 'Unsupported signal',
      permission: 'forbidden',
      evidenceBasis: [],
      allowedTerms: [],
      prohibitedTerms: ['Unsupported signal'],
      rationale: 'No supporting evidence exists.',
      requirementIds: ['req-unsupported'],
    },
  ],
}

describe('structured compatibility validation', () => {
  it('blocks forbidden terms from unsupported requirements', () => {
    const result = validateGeneratedClaims({
      generatedText: 'The resume claims Unsupported signal as a proven capability.',
      claimPolicy: policy,
    })

    expect(result.blocked).toBe(true)
    expect(result.valid).toBe(false)
    expect(result.issues).toEqual([
      expect.objectContaining({
        type: 'forbidden_term',
        severity: 'error',
        term: 'Unsupported signal',
        claimPolicyItemId: 'claim-forbidden-unsupported',
        requirementIds: ['req-unsupported'],
      }),
    ])
  })

  it('blocks unsafe direct claims for cautious requirements', () => {
    const result = validateGeneratedClaims({
      generatedText: 'The resume directly claims Adjacent target signal.',
      claimPolicy: policy,
    })

    expect(result.blocked).toBe(true)
    expect(result.issues).toEqual([
      expect.objectContaining({
        type: 'unsafe_direct_claim',
        severity: 'error',
        term: 'Adjacent target signal',
        claimPolicyItemId: 'claim-cautious-adjacent',
        requirementIds: ['req-adjacent'],
      }),
    ])
  })

  it('allows generated text that stays inside allowed evidence terms', () => {
    const result = validateGeneratedClaims({
      generatedText: 'The resume emphasizes Supported signal and Related resume signal.',
      claimPolicy: policy,
    })

    expect(result).toMatchObject({
      valid: true,
      blocked: false,
      issues: [],
      validationVersion: 'job-compat-structured-validation-v1',
    })
  })
})
