import type {
  GeneratedClaimTrace,
  GeneratedClaimTraceSection,
  JobCompatibilityClaimPolicy,
  SectionRewritePlan,
} from '@/lib/agent/job-targeting/compatibility/types'
import type { CVState } from '@/types/cv'

type SectionItem = {
  section: GeneratedClaimTraceSection
  path: string
  text: string
}

export function buildSectionRewritePlan(params: {
  section: GeneratedClaimTraceSection
  originalCvState: CVState
  generatedCvState: CVState
  claimPolicy: JobCompatibilityClaimPolicy
}): SectionRewritePlan {
  const originalTexts = new Set(
    flattenSection(params.originalCvState, params.section).map((item) => normalize(item.text)),
  )
  const items = flattenSection(params.generatedCvState, params.section).map((item) => {
    const claimMatch = matchClaims(item.text, params.claimPolicy)
    const preservedOriginal = originalTexts.has(normalize(item.text))
    const prohibitedTermsAcknowledged = findProhibitedTerms(item.text, params.claimPolicy)
    const unclassifiedNewText = !preservedOriginal && claimMatch.claimPolicyIds.length === 0

    return {
      targetPath: item.path,
      intendedText: item.text,
      claimPolicyIds: claimMatch.claimPolicyIds,
      expressedSignals: unclassifiedNewText ? [item.text] : claimMatch.expressedSignals,
      evidenceBasis: claimMatch.evidenceBasis,
      permissionLevel: claimMatch.permissionLevel,
      prohibitedTermsAcknowledged,
      ...(preservedOriginal && claimMatch.claimPolicyIds.length === 0
        ? {
          expressedSignals: [],
          evidenceBasis: [],
        }
        : {}),
    }
  })

  return {
    section: params.section,
    items,
  }
}

export function buildGeneratedClaimTraceFromSectionPlans(
  plans: SectionRewritePlan[],
): GeneratedClaimTrace[] {
  return plans.flatMap((plan) => plan.items.map((item) => ({
    section: plan.section,
    itemPath: item.targetPath,
    generatedText: item.intendedText,
    expressedSignals: item.expressedSignals,
    usedClaimPolicyIds: item.claimPolicyIds,
    evidenceBasis: item.evidenceBasis,
    prohibitedTermsFound: item.prohibitedTermsAcknowledged,
    validationStatus: item.prohibitedTermsAcknowledged.length > 0
      ? 'invalid'
      : item.claimPolicyIds.length > 0 || item.expressedSignals.length === 0
        ? 'valid'
        : 'warning',
    rationale: item.claimPolicyIds.length > 0
      ? 'claim_policy_matched'
      : item.expressedSignals.length > 0
        ? 'new_text_without_claim_policy'
        : 'original_preserved_without_new_claim',
  })))
}

function matchClaims(
  text: string,
  claimPolicy: JobCompatibilityClaimPolicy,
): {
  claimPolicyIds: string[]
  expressedSignals: string[]
  evidenceBasis: string[]
  permissionLevel: 'allowed' | 'cautious'
} {
  const allowedMatches = claimPolicy.allowedClaims.filter((claim) => claimMatchesText(text, claim.signal, [
    ...claim.allowedTerms,
    ...claim.evidenceBasis.map((basis) => basis.text),
  ]))
  const cautiousMatches = claimPolicy.cautiousClaims.filter((claim) => claimMatchesText(text, claim.signal, [
    ...claim.allowedTerms,
    ...claim.evidenceBasis.map((basis) => basis.text),
  ]))
  const matches = allowedMatches.length > 0 ? allowedMatches : cautiousMatches

  return {
    claimPolicyIds: matches.map((claim) => claim.id),
    expressedSignals: unique(matches.map((claim) => claim.signal)),
    evidenceBasis: unique(matches.flatMap((claim) => [
      ...claim.allowedTerms,
      ...claim.evidenceBasis.map((basis) => basis.text),
    ])),
    permissionLevel: allowedMatches.length > 0 ? 'allowed' : 'cautious',
  }
}

function claimMatchesText(text: string, signal: string, terms: string[]): boolean {
  const normalizedText = normalize(text)
  const candidates = [signal, ...terms].map(normalize).filter((item) => item.length >= 3)

  return candidates.some((candidate) => normalizedText.includes(candidate))
}

function findProhibitedTerms(
  text: string,
  claimPolicy: JobCompatibilityClaimPolicy,
): string[] {
  const normalizedText = normalize(text)

  return unique([
    ...claimPolicy.forbiddenClaims,
    ...claimPolicy.cautiousClaims,
  ].flatMap((claim) => claim.prohibitedTerms)
    .filter((term) => {
      const normalizedTerm = normalize(term)
      return normalizedTerm.length >= 3 && normalizedText.includes(normalizedTerm)
    }))
}

function flattenSection(cvState: CVState, section: GeneratedClaimTraceSection): SectionItem[] {
  switch (section) {
    case 'summary':
      return [{ section, path: 'summary', text: cvState.summary }]
    case 'skills':
      return cvState.skills.map((skill, index) => ({ section, path: `skills.${index}`, text: skill }))
    case 'experience':
      return cvState.experience.flatMap((entry, entryIndex) => [
        {
          section,
          path: `experience.${entryIndex}.title`,
          text: [entry.title, entry.company].filter(Boolean).join(' '),
        },
        ...entry.bullets.map((bullet, bulletIndex) => ({
          section,
          path: `experience.${entryIndex}.bullets.${bulletIndex}`,
          text: bullet,
        })),
      ])
    case 'education':
      return cvState.education.map((entry, index) => ({
        section,
        path: `education.${index}`,
        text: [entry.degree, entry.institution, entry.year, entry.gpa].filter(Boolean).join(' '),
      }))
    case 'certifications':
      return (cvState.certifications ?? []).map((entry, index) => ({
        section,
        path: `certifications.${index}`,
        text: [entry.name, entry.issuer, entry.year].filter(Boolean).join(' '),
      }))
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

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
}
