import { describe, expect, it } from 'vitest'

import {
  buildGeneratedClaimTraceFromSectionPlans,
  buildSectionRewritePlan,
} from '@/lib/agent/job-targeting/compatibility/rewrite-trace'
import type { JobCompatibilityClaimPolicy } from '@/lib/agent/job-targeting/compatibility/types'
import type { CVState } from '@/types/cv'

const originalCvState: CVState = {
  fullName: 'Ana Silva',
  email: 'ana@example.com',
  phone: '555-0100',
  summary: 'Original summary.',
  experience: [{
    title: 'Analyst',
    company: 'Acme',
    startDate: '2022',
    endDate: '2024',
    bullets: ['Maintained existing reports.'],
  }],
  skills: ['Supported signal'],
  education: [],
  certifications: [],
}

const claimPolicy: JobCompatibilityClaimPolicy = {
  allowedClaims: [{
    id: 'claim-allowed',
    signal: 'Supported signal',
    permission: 'allowed',
    evidenceBasis: [{ id: 'basis-allowed', text: 'Supported signal' }],
    allowedTerms: ['Supported signal'],
    prohibitedTerms: [],
    rationale: 'supported',
    requirementIds: ['req-supported'],
  }],
  cautiousClaims: [{
    id: 'claim-cautious',
    signal: 'Cautious target',
    permission: 'cautious',
    verbalizationTemplate: 'Context related to {allowedTerms}.',
    evidenceBasis: [{ id: 'basis-related', text: 'Related evidence' }],
    allowedTerms: ['Related evidence'],
    prohibitedTerms: ['Cautious target'],
    rationale: 'adjacent',
    requirementIds: ['req-cautious'],
  }],
  forbiddenClaims: [{
    id: 'claim-forbidden',
    signal: 'Forbidden signal',
    permission: 'forbidden',
    evidenceBasis: [],
    allowedTerms: [],
    prohibitedTerms: ['Forbidden signal'],
    rationale: 'unsupported',
    requirementIds: ['req-forbidden'],
  }],
}

describe('rewrite claim trace builder', () => {
  it('builds section rewrite plans and generated claim traces from claim policy matches', () => {
    const generatedCvState: CVState = {
      ...originalCvState,
      skills: [
        'Supported signal',
        'Context related to Related evidence',
        'Forbidden signal',
      ],
    }

    const plan = buildSectionRewritePlan({
      section: 'skills',
      originalCvState,
      generatedCvState,
      claimPolicy,
    })
    const traces = buildGeneratedClaimTraceFromSectionPlans([plan])

    expect(plan.items).toEqual([
      expect.objectContaining({
        targetPath: 'skills.0',
        claimPolicyIds: ['claim-allowed'],
        permissionLevel: 'allowed',
      }),
      expect.objectContaining({
        targetPath: 'skills.1',
        claimPolicyIds: ['claim-cautious'],
        permissionLevel: 'cautious',
      }),
      expect.objectContaining({
        targetPath: 'skills.2',
        claimPolicyIds: [],
        expressedSignals: ['Forbidden signal'],
        prohibitedTermsAcknowledged: ['Forbidden signal'],
      }),
    ])
    expect(traces).toEqual(expect.arrayContaining([
      expect.objectContaining({
        itemPath: 'skills.0',
        usedClaimPolicyIds: ['claim-allowed'],
        validationStatus: 'valid',
      }),
      expect.objectContaining({
        itemPath: 'skills.2',
        validationStatus: 'invalid',
        rationale: 'new_text_without_claim_policy',
      }),
    ]))
  })
})
