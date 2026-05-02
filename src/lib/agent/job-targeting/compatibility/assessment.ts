import type { LoadedJobTargetingCatalog } from '@/lib/agent/job-targeting/catalog/catalog-types'
import { loadJobTargetingCatalog } from '@/lib/agent/job-targeting/catalog/catalog-loader'
import type {
  JobCompatibilityAssessment,
  JobCompatibilityGap,
  RequirementEvidence,
  RequirementKind,
} from '@/lib/agent/job-targeting/compatibility/types'
import type { CVState } from '@/types/cv'

import {
  buildJobCompatibilityClaimPolicy,
  JOB_COMPATIBILITY_CLAIM_POLICY_VERSION,
} from './claim-policy'
import {
  EVIDENCE_EXTRACTION_VERSION,
  extractResumeEvidence,
} from './evidence-extraction'
import {
  classifyRequirementEvidence,
  JOB_COMPATIBILITY_MATCHER_VERSION,
} from './matcher'
import {
  extractJobRequirements,
  REQUIREMENT_EXTRACTION_VERSION,
} from './requirement-extraction'
import {
  calculateJobCompatibilityScore,
  JOB_COMPATIBILITY_SCORE_VERSION,
} from './score'

export const JOB_COMPATIBILITY_ASSESSMENT_VERSION = 'job-compat-assessment-v1'

export const DEFAULT_JOB_TARGETING_DOMAIN_PACK_PATHS = [
  'src/lib/agent/job-targeting/catalog/domain-packs/data-bi.json',
  'src/lib/agent/job-targeting/catalog/domain-packs/software-engineering.json',
  'src/lib/agent/job-targeting/catalog/domain-packs/finance.json',
  'src/lib/agent/job-targeting/catalog/domain-packs/marketing.json',
  'src/lib/agent/job-targeting/catalog/domain-packs/operations.json',
  'src/lib/agent/job-targeting/catalog/domain-packs/sales.json',
  'src/lib/agent/job-targeting/catalog/domain-packs/hr.json',
] as const

export interface CompatibilityGapAnalysisInput {
  criticalGaps?: Array<{ id?: string; text: string }>
  reviewNeededGaps?: Array<{ id?: string; text: string }>
  missingSkills?: string[]
  weakAreas?: string[]
  improvementSuggestions?: string[]
  matchScore?: number
}

export interface EvaluateJobCompatibilityInput {
  cvState: CVState
  targetJobDescription: string
  gapAnalysis?: CompatibilityGapAnalysisInput
  catalog?: LoadedJobTargetingCatalog
  userId?: string
  sessionId?: string
}

export async function evaluateJobCompatibility({
  cvState,
  targetJobDescription,
  gapAnalysis,
  catalog,
  userId,
  sessionId,
}: EvaluateJobCompatibilityInput): Promise<JobCompatibilityAssessment> {
  const loadedCatalog = catalog ?? await loadJobTargetingCatalog({
    domainPackPaths: [...DEFAULT_JOB_TARGETING_DOMAIN_PACK_PATHS],
  })
  const extractedRequirements = extractJobRequirements({ targetJobDescription })
  const resumeEvidence = extractResumeEvidence(cvState)
  const requirements = extractedRequirements.map((requirement) => classifyRequirementEvidence({
    requirement,
    decomposedSignals: extractedRequirements,
    resumeEvidence,
    catalog: loadedCatalog,
  }))
  const supportedRequirements = requirements.filter((requirement) => requirement.productGroup === 'supported')
  const adjacentRequirements = requirements.filter((requirement) => requirement.productGroup === 'adjacent')
  const unsupportedRequirements = requirements.filter((requirement) => requirement.productGroup === 'unsupported')
  const claimPolicy = buildJobCompatibilityClaimPolicy(requirements)
  const scoreBreakdown = calculateJobCompatibilityScore(requirements)
  const criticalGaps = buildGaps({
    requirements,
    gapAnalysis,
    severity: 'critical',
  })
  const reviewNeededGaps = buildGaps({
    requirements,
    gapAnalysis,
    severity: 'review',
  })

  return {
    version: JOB_COMPATIBILITY_ASSESSMENT_VERSION,
    requirements,
    supportedRequirements,
    adjacentRequirements,
    unsupportedRequirements,
    claimPolicy,
    scoreBreakdown,
    criticalGaps,
    reviewNeededGaps,
    lowFit: calculateLowFitState(requirements, scoreBreakdown.total),
    catalog: {
      catalogIds: loadedCatalog.metadata.catalogIds,
      catalogVersions: loadedCatalog.metadata.catalogVersions,
    },
    audit: {
      generatedAt: new Date().toISOString(),
      assessmentVersion: JOB_COMPATIBILITY_ASSESSMENT_VERSION,
      requirementExtractionVersion: REQUIREMENT_EXTRACTION_VERSION,
      evidenceExtractionVersion: EVIDENCE_EXTRACTION_VERSION,
      matcherVersion: JOB_COMPATIBILITY_MATCHER_VERSION,
      claimPolicyVersion: JOB_COMPATIBILITY_CLAIM_POLICY_VERSION,
      scoreVersion: JOB_COMPATIBILITY_SCORE_VERSION,
      counters: {
        requirements: requirements.length,
        resumeEvidence: resumeEvidence.length,
        supported: supportedRequirements.length,
        adjacent: adjacentRequirements.length,
        unsupported: unsupportedRequirements.length,
        allowedClaims: claimPolicy.allowedClaims.length,
        cautiousClaims: claimPolicy.cautiousClaims.length,
        forbiddenClaims: claimPolicy.forbiddenClaims.length,
        criticalGaps: criticalGaps.length,
        reviewNeededGaps: reviewNeededGaps.length,
      },
      ...buildRunIds({ userId, sessionId }),
    },
  }
}

function buildGaps({
  requirements,
  gapAnalysis,
  severity,
}: {
  requirements: RequirementEvidence[]
  gapAnalysis?: CompatibilityGapAnalysisInput
  severity: JobCompatibilityGap['severity']
}): JobCompatibilityGap[] {
  const explicitGaps = severity === 'critical'
    ? gapAnalysis?.criticalGaps
    : gapAnalysis?.reviewNeededGaps

  if (explicitGaps !== undefined) {
    return explicitGaps.map((gap, index) => toGap({
      id: gap.id ?? `${severity}-gap-${index + 1}`,
      signal: gap.text,
      requirements,
      severity,
      rationale: severity === 'critical' ? 'external_critical_gap' : 'external_review_gap',
    }))
  }

  if (severity === 'critical' && gapAnalysis?.missingSkills !== undefined) {
    return gapAnalysis.missingSkills.map((signal, index) => toGap({
      id: `critical-gap-${index + 1}`,
      signal,
      requirements,
      severity,
      rationale: 'missing_skill_gap',
    }))
  }

  if (severity === 'review' && gapAnalysis?.weakAreas !== undefined) {
    return gapAnalysis.weakAreas.map((signal, index) => toGap({
      id: `review-gap-${index + 1}`,
      signal,
      requirements,
      severity,
      rationale: 'weak_area_gap',
    }))
  }

  return requirements
    .filter((requirement) => (
      requirement.productGroup === 'unsupported'
      && (severity === 'critical'
        ? requirement.importance === 'core'
        : requirement.importance !== 'core')
    ))
    .map((requirement) => toGap({
      id: `${severity}-gap-${requirement.id}`,
      signal: requirement.extractedSignals[0] ?? requirement.originalRequirement,
      requirements: [requirement],
      severity,
      rationale: severity === 'critical' ? 'unsupported_core_requirement' : 'unsupported_non_core_requirement',
    }))
}

function toGap({
  id,
  signal,
  requirements,
  severity,
  rationale,
}: {
  id: string
  signal: string
  requirements: RequirementEvidence[]
  severity: JobCompatibilityGap['severity']
  rationale: string
}): JobCompatibilityGap {
  const relatedRequirements = findRelatedRequirements(signal, requirements)
  const primaryRequirement = relatedRequirements[0]

  return {
    id,
    signal,
    kind: primaryRequirement?.kind ?? 'unknown',
    importance: primaryRequirement?.importance ?? 'secondary',
    severity,
    rationale,
    requirementIds: relatedRequirements.map((requirement) => requirement.id),
    prohibitedTerms: unique(relatedRequirements.flatMap((requirement) => requirement.prohibitedTerms)),
  }
}

function findRelatedRequirements(
  signal: string,
  requirements: RequirementEvidence[],
): RequirementEvidence[] {
  const normalizedSignal = normalize(signal)
  const matches = requirements.filter((requirement) => {
    const normalizedRequirement = normalize(requirement.originalRequirement)

    return normalizedRequirement.includes(normalizedSignal)
      || normalizedSignal.includes(normalizedRequirement)
      || requirement.extractedSignals.some((item) => normalizedSignal.includes(normalize(item)))
  })

  return matches.length > 0 ? matches : []
}

function calculateLowFitState(
  requirements: RequirementEvidence[],
  score: number,
): JobCompatibilityAssessment['lowFit'] {
  const coreRequirements = requirements.filter((requirement) => requirement.importance === 'core')
  const unsupportedCoreCount = coreRequirements.filter((requirement) => (
    requirement.productGroup === 'unsupported'
  )).length
  const totalCoreCount = coreRequirements.length
  const supportedOrAdjacentCount = requirements.filter((requirement) => (
    requirement.productGroup !== 'unsupported'
  )).length
  const unsupportedCoreRatio = totalCoreCount === 0 ? 0 : unsupportedCoreCount / totalCoreCount
  const minimumScore = 25
  const blocking = score < minimumScore
    || (unsupportedCoreCount >= 3 && supportedOrAdjacentCount <= 2)
  const reasons = [
    ...(score < minimumScore ? ['very_low_compatibility_score'] : []),
    ...(unsupportedCoreCount >= 3 && supportedOrAdjacentCount <= 2
      ? ['too_many_unsupported_core_requirements']
      : []),
  ]

  return {
    blocking,
    riskLevel: blocking ? 'high' : riskLevelFor({
      score,
      unsupportedCoreRatio,
    }),
    reasons,
    thresholdAudit: {
      score,
      minimumScore,
      unsupportedCoreCount,
      totalCoreCount,
      unsupportedCoreRatio,
      supportedOrAdjacentCount,
    },
  }
}

function riskLevelFor({
  score,
  unsupportedCoreRatio,
}: {
  score: number
  unsupportedCoreRatio: number
}): 'low' | 'medium' | 'high' {
  if (score < 50 || unsupportedCoreRatio >= 0.5) {
    return 'medium'
  }

  return 'low'
}

function buildRunIds({
  userId,
  sessionId,
}: {
  userId?: string
  sessionId?: string
}): Pick<JobCompatibilityAssessment['audit'], 'runIds'> | Record<string, never> {
  if (userId === undefined && sessionId === undefined) {
    return {}
  }

  return {
    runIds: {
      ...(userId === undefined ? {} : { userId }),
      ...(sessionId === undefined ? {} : { sessionId }),
    },
  }
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function unique(items: string[]): string[] {
  return [...new Set(items.filter(Boolean))]
}
