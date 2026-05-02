import { describe, expect, it } from 'vitest'

import { calculateJobCompatibilityScore } from '@/lib/agent/job-targeting/compatibility/score'
import type { RequirementEvidence } from '@/lib/agent/job-targeting/compatibility/types'

function requirement(
  overrides: Partial<RequirementEvidence> & Pick<RequirementEvidence, 'id' | 'kind' | 'productGroup'>,
): RequirementEvidence {
  return {
    originalRequirement: overrides.id,
    normalizedRequirement: overrides.id,
    extractedSignals: [overrides.id],
    importance: 'core',
    evidenceLevel: 'explicit',
    rewritePermission: 'can_claim_directly',
    matchedResumeTerms: [overrides.id],
    supportingResumeSpans: [],
    confidence: 1,
    rationale: 'test',
    source: 'exact',
    catalogTermIds: [],
    catalogCategoryIds: [],
    prohibitedTerms: [],
    audit: {
      matcherVersion: 'test',
      precedence: ['exact'],
      catalogIds: [],
      catalogVersions: {},
      catalogTermIds: [],
      catalogCategoryIds: [],
    },
    ...overrides,
  }
}

describe('job compatibility score', () => {
  it('uses locked weights when all dimensions are present', () => {
    const score = calculateJobCompatibilityScore([
      requirement({ id: 'skill-supported', kind: 'skill', productGroup: 'supported' }),
      requirement({ id: 'skill-adjacent', kind: 'skill', productGroup: 'adjacent' }),
      requirement({ id: 'skill-unsupported', kind: 'skill', productGroup: 'unsupported' }),
      requirement({ id: 'experience-supported', kind: 'responsibility', productGroup: 'supported' }),
      requirement({ id: 'education-unsupported', kind: 'education', productGroup: 'unsupported' }),
    ])

    expect(score.version).toBe('job-compat-score-v1')
    expect(score.total).toBe(63)
    expect(score.maxTotal).toBe(100)
    expect(score.adjacentDiscount).toBe(0.5)
    expect(score.weights).toEqual({
      skills: 0.34,
      experience: 0.46,
      education: 0.2,
    })
    expect(score.activeWeights).toEqual({
      skills: 0.34,
      experience: 0.46,
      education: 0.2,
    })
    expect(score.dimensions).toEqual({
      skills: 50,
      experience: 100,
      education: 0,
    })
    expect(score.audit.dimensionDetails.skills).toMatchObject({
      requirementCount: 3,
      supportedCount: 1,
      adjacentCount: 1,
      unsupportedCount: 1,
      rawScore: 0.5,
      weightedScore: 0.17,
    })
    expect(score.audit.dimensionDetails.experience).toMatchObject({
      requirementCount: 1,
      supportedCount: 1,
      adjacentCount: 0,
      unsupportedCount: 0,
      rawScore: 1,
      weightedScore: 0.46,
    })
    expect(score.audit.dimensionDetails.education).toMatchObject({
      requirementCount: 1,
      supportedCount: 0,
      adjacentCount: 0,
      unsupportedCount: 1,
      rawScore: 0,
      weightedScore: 0,
    })
  })

  it('redistributes education weight when education requirements are absent', () => {
    const score = calculateJobCompatibilityScore([
      requirement({ id: 'skill-supported', kind: 'skill', productGroup: 'supported' }),
      requirement({ id: 'experience-unsupported', kind: 'responsibility', productGroup: 'unsupported' }),
    ])

    expect(score.total).toBe(43)
    expect(score.activeWeights).toEqual({
      skills: 0.425,
      experience: 0.575,
    })
    expect(score.audit.dimensionDetails.experience).toMatchObject({
      requirementCount: 1,
      rawScore: 0,
    })
    expect(score.audit.dimensionDetails.education).toMatchObject({
      requirementCount: 0,
      rawScore: 0,
      weightedScore: 0,
    })
  })

  it('redistributes experience weight when experience requirements are absent', () => {
    const score = calculateJobCompatibilityScore([
      requirement({ id: 'skill-supported', kind: 'skill', productGroup: 'supported' }),
      requirement({ id: 'education-unsupported', kind: 'education', productGroup: 'unsupported' }),
    ])

    expect(score.total).toBe(63)
    expect(score.activeWeights).toEqual({
      skills: 0.6296,
      education: 0.3704,
    })
  })

  it('uses a single active dimension as 100 percent of the score', () => {
    const score = calculateJobCompatibilityScore([
      requirement({ id: 'skill-supported', kind: 'skill', productGroup: 'supported' }),
    ])

    expect(score.total).toBe(100)
    expect(score.activeWeights).toEqual({
      skills: 1,
    })
  })

  it('uses a documented conservative fallback when no requirements are extracted', () => {
    const score = calculateJobCompatibilityScore([])

    expect(score.total).toBe(1)
    expect(score.activeWeights).toEqual({})
    expect(score.warnings).toContain('no_requirements_extracted')
  })

  it('applies evidence confidence to supported and adjacent contributions', () => {
    const score = calculateJobCompatibilityScore([
      requirement({
        id: 'skill-supported-from-skills-only',
        kind: 'skill',
        productGroup: 'supported',
        confidence: 0.65,
      }),
      requirement({
        id: 'skill-adjacent',
        kind: 'skill',
        productGroup: 'adjacent',
        confidence: 0.8,
      }),
    ])

    expect(score.total).toBe(53)
    expect(score.dimensions.skills).toBe(53)
  })
})
