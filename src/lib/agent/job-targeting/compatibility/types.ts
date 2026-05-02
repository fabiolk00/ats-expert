export type ProductEvidenceGroup = 'supported' | 'adjacent' | 'unsupported'

export type InternalEvidenceLevel =
  | 'explicit'
  | 'catalog_alias'
  | 'category_equivalent'
  | 'strong_contextual_inference'
  | 'semantic_bridge_only'
  | 'unsupported_gap'

export type ClaimPermission =
  | 'can_claim_directly'
  | 'can_claim_normalized'
  | 'can_bridge_carefully'
  | 'can_mention_as_related_context'
  | 'must_not_claim'

export type ClaimPolicyPermission = 'allowed' | 'cautious' | 'forbidden'

export type RequirementKind =
  | 'tool'
  | 'skill'
  | 'platform'
  | 'methodology'
  | 'education'
  | 'certification'
  | 'industry'
  | 'business_domain'
  | 'responsibility'
  | 'seniority'
  | 'soft_skill'
  | 'language'
  | 'unknown'

export type RequirementImportance = 'core' | 'secondary' | 'differential'

export type RequirementEvidenceSource =
  | 'exact'
  | 'catalog_alias'
  | 'catalog_category'
  | 'catalog_anti_equivalence'
  | 'composite_decomposition'
  | 'llm_ambiguous'
  | 'fallback'

export type JobCompatibilityAssessmentVersion = 'job-compat-assessment-v1'
export type JobCompatibilityScoreVersion = 'job-compat-score-v1'
export type JobCompatibilityClaimPolicyVersion = 'job-compat-claim-policy-v1'
export type StructuredValidationVersion = 'job-compat-structured-validation-v1'
export type JobCompatibilityTargetRoleSource = 'heuristic' | 'llm' | 'fallback'

export type JobCompatibilityScoreDimensionId = 'skills' | 'experience' | 'education'

export type JobCompatibilityRequirementSourceKind = 'section_heading' | 'sentence' | 'list_item'

export type JobCompatibilityEvidenceSection =
  | 'summary'
  | 'skills'
  | 'experience'
  | 'education'
  | 'certifications'

export type JobCompatibilityEvidenceSourceKind =
  | 'summary_sentence'
  | 'skill'
  | 'experience_title'
  | 'experience_bullet'
  | 'education_entry'
  | 'certification_entry'

export type JobCompatibilityRequirementKind = RequirementKind
export type JobCompatibilityRequirementImportance = RequirementImportance

export interface JobCompatibilityRequirement {
  id: string
  text: string
  normalizedText: string
  kind: RequirementKind
  importance: RequirementImportance
  scoreDimension: JobCompatibilityScoreDimensionId
  source: {
    section: string
    heading?: string
    sourceKind: JobCompatibilityRequirementSourceKind
    sentenceIndex?: number
    listIndex?: number
  }
  catalogTermIds?: string[]
  audit?: {
    extractorVersion: string
    signalIds: string[]
  }
}

export interface JobCompatibilityEvidence {
  id: string
  text: string
  normalizedText: string
  section: JobCompatibilityEvidenceSection
  sourceKind: JobCompatibilityEvidenceSourceKind
  cvPath: string
  entryIndex?: number
  bulletIndex?: number
  catalogTermIds?: string[]
}

export interface RequirementEvidenceSpan {
  id: string
  text: string
  section?: JobCompatibilityEvidenceSection | string
  sourceKind?: JobCompatibilityEvidenceSourceKind | string
  cvPath?: string
}

export interface RequirementEvidenceAudit {
  matcherVersion: string
  precedence: readonly RequirementEvidenceSource[]
  catalogIds: string[]
  catalogVersions: Record<string, string>
  catalogTermIds: string[]
  catalogCategoryIds: string[]
  antiEquivalenceTermIds?: string[]
  ambiguityResolved?: boolean
}

export interface RequirementEvidence {
  id: string
  originalRequirement: string
  normalizedRequirement: string
  extractedSignals: string[]
  kind: RequirementKind
  importance: RequirementImportance
  productGroup: ProductEvidenceGroup
  evidenceLevel: InternalEvidenceLevel
  rewritePermission: ClaimPermission
  matchedResumeTerms: string[]
  supportingResumeSpans: RequirementEvidenceSpan[]
  confidence: number
  rationale: string
  source: RequirementEvidenceSource
  catalogTermIds: string[]
  catalogCategoryIds: string[]
  prohibitedTerms: string[]
  audit: RequirementEvidenceAudit
}

export interface ClaimPolicyItem {
  id: string
  signal: string
  permission: ClaimPolicyPermission
  verbalizationTemplate?: string
  evidenceBasis: RequirementEvidenceSpan[]
  allowedTerms: string[]
  prohibitedTerms: string[]
  rationale: string
  requirementIds: string[]
}

export interface JobCompatibilityClaimPolicy {
  allowedClaims: ClaimPolicyItem[]
  cautiousClaims: ClaimPolicyItem[]
  forbiddenClaims: ClaimPolicyItem[]
}

export interface JobCompatibilityScoreDimensionBreakdown {
  id: JobCompatibilityScoreDimensionId
  weight: number
  requirementCount: number
  supportedCount: number
  adjacentCount: number
  unsupportedCount: number
  rawScore: number
  weightedScore: number
}

export interface JobCompatibilityScoreBreakdown {
  version: JobCompatibilityScoreVersion
  total: number
  maxTotal: 100
  adjacentDiscount: 0.5
  dimensions: Record<JobCompatibilityScoreDimensionId, number>
  counts: {
    total: number
    supported: number
    adjacent: number
    unsupported: number
  }
  weights: Record<JobCompatibilityScoreDimensionId, number>
  formula: {
    supportedValue: 1
    adjacentValue: 0.5
    unsupportedValue: 0
  }
  audit: {
    dimensionDetails: Record<JobCompatibilityScoreDimensionId, JobCompatibilityScoreDimensionBreakdown>
  }
}

export interface JobCompatibilityGap {
  id: string
  signal: string
  kind: RequirementKind
  importance: RequirementImportance
  severity: 'critical' | 'review'
  rationale: string
  requirementIds: string[]
  prohibitedTerms?: string[]
}

export interface JobCompatibilityLowFitState {
  triggered: boolean
  blocking: boolean
  reason?: string
  riskLevel: 'low' | 'medium' | 'high'
  reasons: string[]
  thresholdAudit: {
    score: number
    minimumScore: number
    unsupportedCoreCount: number
    totalCoreCount: number
    unsupportedCoreRatio: number
    supportedOrAdjacentCount: number
  }
}

export interface JobCompatibilityAssessment {
  version: JobCompatibilityAssessmentVersion
  targetRole: string
  targetRoleConfidence: 'low' | 'medium' | 'high'
  targetRoleSource: JobCompatibilityTargetRoleSource
  requirements: RequirementEvidence[]
  supportedRequirements: RequirementEvidence[]
  adjacentRequirements: RequirementEvidence[]
  unsupportedRequirements: RequirementEvidence[]
  claimPolicy: JobCompatibilityClaimPolicy
  scoreBreakdown: JobCompatibilityScoreBreakdown
  criticalGaps: JobCompatibilityGap[]
  reviewNeededGaps: JobCompatibilityGap[]
  lowFit: JobCompatibilityLowFitState
  catalog: {
    catalogIds: string[]
    catalogVersions: Record<string, string>
  }
  audit: {
    generatedAt: string
    assessmentVersion: JobCompatibilityAssessmentVersion
    requirementExtractionVersion: string
    evidenceExtractionVersion: string
    matcherVersion: string
    claimPolicyVersion: JobCompatibilityClaimPolicyVersion
    scoreVersion: JobCompatibilityScoreVersion
    counters: {
      requirements: number
      resumeEvidence: number
      supported: number
      adjacent: number
      unsupported: number
      allowedClaims: number
      cautiousClaims: number
      forbiddenClaims: number
      criticalGaps: number
      reviewNeededGaps: number
    }
    runIds?: {
      userId?: string
      sessionId?: string
    }
  }
}
