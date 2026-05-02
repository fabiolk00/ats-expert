import type {
  JobCompatibilityAssessment,
  JobCompatibilityScoreBreakdown,
  JobCompatibilityScoreDimensionBreakdown,
  JobCompatibilityScoreDimensionId,
  ProductEvidenceGroup,
  RequirementEvidence,
} from '@/lib/agent/job-targeting/compatibility/types'

function dimensionDetail(
  id: JobCompatibilityScoreDimensionId,
  rawScore: number,
  weight: number,
): JobCompatibilityScoreDimensionBreakdown {
  return {
    id,
    weight,
    requirementCount: 1,
    supportedCount: rawScore === 1 ? 1 : 0,
    adjacentCount: rawScore === 0.5 ? 1 : 0,
    unsupportedCount: rawScore === 0 ? 1 : 0,
    rawScore,
    weightedScore: rawScore * weight,
  }
}

function scoreBreakdown(overrides: Partial<JobCompatibilityScoreBreakdown> = {}): JobCompatibilityScoreBreakdown {
  return {
    version: 'job-compat-score-v1',
    total: 44,
    maxTotal: 100,
    adjacentDiscount: 0.5,
    dimensions: {
      skills: 20,
      experience: 55,
      education: 40,
    },
    counts: {
      total: 3,
      supported: 1,
      adjacent: 1,
      unsupported: 1,
    },
    weights: {
      skills: 0.34,
      experience: 0.46,
      education: 0.2,
    },
    formula: {
      supportedValue: 1,
      adjacentValue: 0.5,
      unsupportedValue: 0,
    },
    audit: {
      dimensionDetails: {
        skills: dimensionDetail('skills', 0, 0.34),
        experience: dimensionDetail('experience', 0.5, 0.46),
        education: dimensionDetail('education', 1, 0.2),
      },
    },
    ...overrides,
  }
}

function requirement(
  overrides: Partial<RequirementEvidence> & Pick<RequirementEvidence, 'id' | 'productGroup' | 'rewritePermission'>,
): RequirementEvidence {
  const signal = overrides.extractedSignals?.[0] ?? overrides.originalRequirement ?? overrides.id
  const { id, ...rest } = overrides

  return {
    id,
    originalRequirement: signal,
    normalizedRequirement: signal.toLowerCase(),
    extractedSignals: [signal],
    kind: 'skill',
    importance: 'core',
    evidenceLevel: overrides.productGroup === 'supported'
      ? 'explicit'
      : overrides.productGroup === 'adjacent'
        ? 'semantic_bridge_only'
        : 'unsupported_gap',
    matchedResumeTerms: overrides.productGroup === 'unsupported' ? [] : [`Resume ${signal}`],
    supportingResumeSpans: overrides.productGroup === 'unsupported'
      ? []
      : [{ id: `span-${id}`, text: `Resume ${signal}`, section: 'experience' }],
    confidence: overrides.productGroup === 'unsupported' ? 0.7 : 0.9,
    rationale: `Assessment rationale for ${signal}`,
    source: overrides.productGroup === 'supported' ? 'exact' : 'fallback',
    catalogTermIds: [],
    catalogCategoryIds: [],
    prohibitedTerms: overrides.productGroup === 'unsupported' ? [signal] : [],
    audit: {
      matcherVersion: 'test',
      precedence: ['exact'],
      catalogIds: ['test-catalog'],
      catalogVersions: { 'test-catalog': '1.0.0' },
      catalogTermIds: [],
      catalogCategoryIds: [],
    },
    ...rest,
  }
}

export function buildCompatibilityAssessmentFixture(
  overrides: Partial<JobCompatibilityAssessment> = {},
): JobCompatibilityAssessment {
  const supported = requirement({
    id: 'req-supported',
    productGroup: 'supported',
    rewritePermission: 'can_claim_directly',
    extractedSignals: ['Supported signal'],
  })
  const adjacent = requirement({
    id: 'req-adjacent',
    productGroup: 'adjacent',
    rewritePermission: 'can_mention_as_related_context',
    extractedSignals: ['Adjacent target signal'],
    matchedResumeTerms: ['Related resume signal'],
    supportingResumeSpans: [{ id: 'span-adjacent', text: 'Related resume signal', section: 'experience' }],
    prohibitedTerms: ['Adjacent target signal'],
  })
  const unsupported = requirement({
    id: 'req-unsupported',
    productGroup: 'unsupported',
    rewritePermission: 'must_not_claim',
    extractedSignals: ['Unsupported signal'],
    prohibitedTerms: [
      'Unsupported signal',
      'Unsupported certification',
      'Unsupported education',
    ],
  })

  return {
    version: 'job-compat-assessment-v1',
    targetRole: 'Target Role',
    targetRoleConfidence: 'low',
    targetRoleSource: 'fallback',
    requirements: [supported, adjacent, unsupported],
    supportedRequirements: [supported],
    adjacentRequirements: [adjacent],
    unsupportedRequirements: [unsupported],
    claimPolicy: {
      allowedClaims: [{
        id: 'claim-supported',
        signal: 'Supported signal',
        permission: 'allowed',
        evidenceBasis: [{ id: 'span-supported', text: 'Supported signal' }],
        allowedTerms: ['Supported signal'],
        prohibitedTerms: [],
        rationale: 'Supported by assessment.',
        requirementIds: ['req-supported'],
      }],
      cautiousClaims: [{
        id: 'claim-adjacent',
        signal: 'Adjacent target signal',
        permission: 'cautious',
        verbalizationTemplate: 'Use related evidence: {allowedTerms}.',
        evidenceBasis: [{ id: 'span-adjacent', text: 'Related resume signal' }],
        allowedTerms: ['Related resume signal'],
        prohibitedTerms: ['Adjacent target signal'],
        rationale: 'Adjacent by assessment.',
        requirementIds: ['req-adjacent'],
      }],
      forbiddenClaims: [{
        id: 'claim-unsupported',
        signal: 'Unsupported signal',
        permission: 'forbidden',
        evidenceBasis: [],
        allowedTerms: [],
        prohibitedTerms: [
          'Unsupported signal',
          'Unsupported certification',
          'Unsupported education',
        ],
        rationale: 'Unsupported by assessment.',
        requirementIds: ['req-unsupported'],
      }],
    },
    scoreBreakdown: scoreBreakdown(),
    criticalGaps: [{
      id: 'gap-unsupported',
      signal: 'Unsupported signal',
      kind: 'skill',
      importance: 'core',
      severity: 'critical',
      rationale: 'No direct evidence.',
      requirementIds: ['req-unsupported'],
      prohibitedTerms: ['Unsupported signal'],
    }],
    reviewNeededGaps: [],
    lowFit: {
      triggered: true,
      blocking: true,
      reason: 'very_low_compatibility_score',
      riskLevel: 'high',
      reasons: ['very_low_compatibility_score'],
      thresholdAudit: {
        score: 44,
        minimumScore: 25,
        unsupportedCoreCount: 1,
        totalCoreCount: 3,
        unsupportedCoreRatio: 1 / 3,
        supportedOrAdjacentCount: 2,
      },
    },
    catalog: {
      catalogIds: ['test-catalog'],
      catalogVersions: { 'test-catalog': '1.0.0' },
    },
    audit: {
      generatedAt: '2026-05-02T12:00:00.000Z',
      assessmentVersion: 'job-compat-assessment-v1',
      requirementExtractionVersion: 'test',
      evidenceExtractionVersion: 'test',
      matcherVersion: 'test',
      claimPolicyVersion: 'job-compat-claim-policy-v1',
      scoreVersion: 'job-compat-score-v1',
      counters: {
        requirements: 3,
        resumeEvidence: 2,
        supported: 1,
        adjacent: 1,
        unsupported: 1,
        allowedClaims: 1,
        cautiousClaims: 1,
        forbiddenClaims: 1,
        criticalGaps: 1,
        reviewNeededGaps: 0,
      },
    },
    ...overrides,
  }
}

export type { ProductEvidenceGroup }
