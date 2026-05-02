import { describe, expect, it } from 'vitest'

import {
  buildGeneratedClaimTracesFromCvState,
  validateGeneratedClaims,
  type GeneratedClaimTrace,
} from '@/lib/agent/job-targeting/compatibility/structured-validation'
import type { JobCompatibilityClaimPolicy } from '@/lib/agent/job-targeting/compatibility/types'
import type { CVState } from '@/types/cv'

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
      prohibitedTerms: [
        'Unsupported signal',
        'Unsupported certification',
        'Unsupported education',
      ],
      rationale: 'No supporting evidence exists.',
      requirementIds: ['req-unsupported'],
    },
  ],
}

const generatedCvState: CVState = {
  fullName: 'Ana Silva',
  email: 'ana@example.com',
  phone: '555-0100',
  summary: 'Target Role with direct ownership of Adjacent target signal.',
  experience: [{
    title: 'Analyst',
    company: 'Acme',
    startDate: '2022',
    endDate: '2024',
    bullets: ['Delivered reports with Supported signal.'],
  }],
  skills: ['Supported signal', 'Unsupported signal'],
  education: [{
    degree: 'Unsupported education',
    institution: 'Example University',
    year: '2020',
  }],
  certifications: [{
    name: 'Unsupported certification',
    issuer: 'Example issuer',
    year: '2024',
  }],
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

  it('builds deterministic traces for generated CV sections', () => {
    const traces = buildGeneratedClaimTracesFromCvState(generatedCvState)

    expect(traces).toEqual(expect.arrayContaining([
      expect.objectContaining({
        section: 'summary',
        text: generatedCvState.summary,
      }),
      expect.objectContaining({
        section: 'skills',
        text: 'Unsupported signal',
      }),
      expect.objectContaining({
        section: 'education',
        text: 'Unsupported education Example University 2020',
      }),
      expect.objectContaining({
        section: 'certifications',
        text: 'Unsupported certification Example issuer 2024',
      }),
    ]))
  })

  it('classifies forbidden and cautious boundary violations by generated CV section', () => {
    const traces: GeneratedClaimTrace[] = buildGeneratedClaimTracesFromCvState(generatedCvState)
    const result = validateGeneratedClaims({
      generatedClaimTraces: traces,
      claimPolicy: policy,
      targetRole: {
        value: 'Target Role',
        permission: 'must_not_claim_target_role',
      },
    })

    expect(result.blocked).toBe(true)
    expect(result.issues.map((issue) => issue.type)).toEqual(expect.arrayContaining([
      'unsupported_skill_added',
      'unsupported_certification',
      'unsupported_education_claim',
      'target_role_asserted_without_permission',
      'unsafe_direct_claim',
    ]))
  })

  it('allows cautious target signals when they are verbalized with related evidence', () => {
    const result = validateGeneratedClaims({
      generatedClaimTraces: [{
        id: 'summary',
        section: 'summary',
        text: 'Experience related to Adjacent target signal based on Related resume signal.',
      }],
      claimPolicy: policy,
    })

    expect(result.valid).toBe(true)
    expect(result.issues).toEqual([])
  })
})
