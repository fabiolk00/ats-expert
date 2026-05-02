import type {
  JobCompatibilityScoreBreakdown,
  JobCompatibilityScoreDimensionBreakdown,
  JobCompatibilityScoreDimensionId,
  ProductEvidenceGroup,
  RequirementEvidence,
  RequirementKind,
} from '@/lib/agent/job-targeting/compatibility/types'

export const JOB_COMPATIBILITY_SCORE_VERSION = 'job-compat-score-v1'

export const JOB_COMPATIBILITY_SCORE_WEIGHTS = {
  skills: 0.34,
  experience: 0.46,
  education: 0.2,
} as const satisfies Record<JobCompatibilityScoreDimensionId, number>

export const JOB_COMPATIBILITY_ADJACENT_DISCOUNT = 0.5

const PRODUCT_GROUP_VALUES = {
  supported: 1,
  adjacent: JOB_COMPATIBILITY_ADJACENT_DISCOUNT,
  unsupported: 0,
} as const satisfies Record<ProductEvidenceGroup, number>

const SCORE_DIMENSIONS = ['skills', 'experience', 'education'] as const satisfies readonly JobCompatibilityScoreDimensionId[]

export function calculateJobCompatibilityScore(
  requirements: RequirementEvidence[],
): JobCompatibilityScoreBreakdown {
  const dimensionDetails = Object.fromEntries(
    SCORE_DIMENSIONS.map((dimension) => [
      dimension,
      calculateDimensionBreakdown(dimension, requirements),
    ]),
  ) as Record<JobCompatibilityScoreDimensionId, JobCompatibilityScoreDimensionBreakdown>
  const activeDimensions = SCORE_DIMENSIONS.filter((dimension) => (
    dimensionDetails[dimension].requirementCount > 0
  ))
  const totalActiveWeight = activeDimensions.reduce(
    (total, dimension) => total + JOB_COMPATIBILITY_SCORE_WEIGHTS[dimension],
    0,
  )
  const activeWeights = Object.fromEntries(activeDimensions.map((dimension) => [
    dimension,
    totalActiveWeight === 0 ? 0 : roundTo(JOB_COMPATIBILITY_SCORE_WEIGHTS[dimension] / totalActiveWeight, 4),
  ])) as Partial<Record<JobCompatibilityScoreDimensionId, number>>
  const weightedTotal = activeDimensions.reduce(
    (total, dimension) => total + (
      dimensionDetails[dimension].rawScore * (activeWeights[dimension] ?? 0)
    ),
    0,
  )
  const warnings = requirements.length === 0 ? ['no_requirements_extracted'] : []

  return {
    version: JOB_COMPATIBILITY_SCORE_VERSION,
    total: requirements.length === 0 ? 1 : Math.round(weightedTotal * 100),
    maxTotal: 100,
    adjacentDiscount: JOB_COMPATIBILITY_ADJACENT_DISCOUNT,
    dimensions: {
      skills: Math.round(dimensionDetails.skills.rawScore * 100),
      experience: Math.round(dimensionDetails.experience.rawScore * 100),
      education: Math.round(dimensionDetails.education.rawScore * 100),
    },
    counts: {
      total: requirements.length,
      supported: countByProductGroup(requirements, 'supported'),
      adjacent: countByProductGroup(requirements, 'adjacent'),
      unsupported: countByProductGroup(requirements, 'unsupported'),
    },
    weights: JOB_COMPATIBILITY_SCORE_WEIGHTS,
    activeWeights,
    warnings,
    formula: {
      supportedValue: 1,
      adjacentValue: JOB_COMPATIBILITY_ADJACENT_DISCOUNT,
      unsupportedValue: 0,
      confidenceMultiplier: true,
    },
    audit: {
      dimensionDetails,
    },
  }
}

function calculateDimensionBreakdown(
  dimension: JobCompatibilityScoreDimensionId,
  requirements: RequirementEvidence[],
): JobCompatibilityScoreDimensionBreakdown {
  const dimensionRequirements = requirements.filter((requirement) => (
    scoreDimensionForRequirementKind(requirement.kind) === dimension
  ))
  const requirementCount = dimensionRequirements.length
  const rawScore = requirementCount === 0
    ? 0
    : roundTo(
      dimensionRequirements.reduce(
        (total, requirement) => total + (
          PRODUCT_GROUP_VALUES[requirement.productGroup] * confidenceForScore(requirement)
        ),
        0,
      ) / requirementCount,
      2,
    )

  return {
    id: dimension,
    weight: JOB_COMPATIBILITY_SCORE_WEIGHTS[dimension],
    requirementCount,
    supportedCount: countByProductGroup(dimensionRequirements, 'supported'),
    adjacentCount: countByProductGroup(dimensionRequirements, 'adjacent'),
    unsupportedCount: countByProductGroup(dimensionRequirements, 'unsupported'),
    rawScore,
    weightedScore: roundTo(rawScore * JOB_COMPATIBILITY_SCORE_WEIGHTS[dimension], 2),
  }
}

function confidenceForScore(requirement: RequirementEvidence): number {
  if (requirement.productGroup === 'unsupported') {
    return 1
  }

  return Math.max(0, Math.min(1, requirement.confidence || 0))
}

function scoreDimensionForRequirementKind(kind: RequirementKind): JobCompatibilityScoreDimensionId {
  if (kind === 'education' || kind === 'certification') {
    return 'education'
  }

  if (
    kind === 'responsibility'
    || kind === 'seniority'
    || kind === 'industry'
    || kind === 'business_domain'
  ) {
    return 'experience'
  }

  return 'skills'
}

function countByProductGroup(
  requirements: RequirementEvidence[],
  productGroup: ProductEvidenceGroup,
): number {
  return requirements.filter((requirement) => requirement.productGroup === productGroup).length
}

function roundTo(value: number, places: number): number {
  const factor = 10 ** places
  return Math.round(value * factor) / factor
}
