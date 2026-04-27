import type { TargetEvidence, TargetingPlan, ValidationIssue } from '@/types/agent'
import type { CVState } from '@/types/cv'
import { buildCanonicalSignal, normalizeSemanticText } from '@/lib/agent/job-targeting/semantic-normalization'

const BRIDGE_LANGUAGE_TERMS = [
  'experiencia relacionada a',
  'atuacao com',
  'contexto de',
  'base em',
  'aplicacao em',
  'praticas proximas a',
  'exposicao a',
  'relacionado a',
  'relacionada a',
]

const SENIORITY_INFLATION_TERMS = [
  'especialista',
  'specialist',
  'expert',
  'advanced',
  'avancado',
  'avancada',
  'owner',
  'lead',
  'lider',
  'dominio',
  'deep expertise',
  'responsavel por',
  'referencia em',
  'autoridade em',
  'certificado em',
]

function buildEvidenceText(cvState: CVState): string {
  return [
    cvState.summary,
    cvState.skills.join(' '),
    ...cvState.experience.flatMap((entry) => [entry.title, ...entry.bullets]),
    ...cvState.education.flatMap((entry) => [entry.degree, entry.institution, entry.year, entry.gpa]),
    ...(cvState.certifications ?? []).flatMap((entry) => [entry.name, entry.issuer, entry.year]),
  ].join(' ')
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
}

function getTargetEvidence(targetingPlan?: TargetingPlan): TargetEvidence[] {
  return targetingPlan?.targetEvidence ?? []
}

function textContainsEvidenceSignal(text: string, evidence: TargetEvidence): boolean {
  const normalizedText = normalizeSemanticText(text)
  const candidates = [
    evidence.jobSignal,
    evidence.canonicalSignal,
    ...evidence.allowedRewriteForms,
    ...evidence.forbiddenRewriteForms,
  ]
    .map((value) => normalizeSemanticText(value))
    .filter(Boolean)

  return candidates.some((candidate) => normalizedText.includes(candidate))
}

function textContainsEvidenceClaim(text: string, evidence: TargetEvidence): boolean {
  const normalizedText = normalizeSemanticText(text)
  const candidates = [
    evidence.jobSignal,
    evidence.canonicalSignal,
    ...evidence.forbiddenRewriteForms,
  ]
    .map((value) => normalizeSemanticText(value))
    .filter(Boolean)

  return candidates.some((candidate) => normalizedText.includes(candidate))
}

function sentenceContainsEvidenceSignal(sentence: string, evidence: TargetEvidence): boolean {
  return textContainsEvidenceClaim(sentence, evidence) || textContainsEvidenceSignal(sentence, evidence)
}

function isAllowedOnSkillsSurface(skill: string, targetingPlan?: TargetingPlan): boolean {
  const normalizedSkill = buildCanonicalSignal(skill)
  const permissions = targetingPlan?.rewritePermissions?.skillsSurfaceAllowed ?? []

  return permissions.some((allowed) => buildCanonicalSignal(allowed) === normalizedSkill)
}

function hasBridgeLanguage(sentence: string): boolean {
  const normalizedSentence = normalizeSemanticText(sentence)
  return BRIDGE_LANGUAGE_TERMS.some((term) => normalizedSentence.includes(term))
}

function hasSeniorityInflation(sentence: string): boolean {
  const normalizedSentence = normalizeSemanticText(sentence)
  return SENIORITY_INFLATION_TERMS.some((term) => normalizedSentence.includes(term))
}

function hasGroundedSupportingSpan(sentence: string, evidence: TargetEvidence): boolean {
  const normalizedSentence = normalizeSemanticText(sentence)

  return evidence.supportingResumeSpans.some((span) => {
    const normalizedSpan = normalizeSemanticText(span)

    return normalizedSpan.length >= 3
      && (
        normalizedSentence.includes(normalizedSpan)
        || normalizedSpan.includes(normalizedSentence)
        || normalizedSentence
          .split(' ')
          .some((token) => token.length >= 4 && normalizedSpan.includes(token))
      )
  })
}

export function buildTargetedRewritePermissionIssues(params: {
  originalCvState: CVState
  optimizedCvState: CVState
  targetingPlan?: TargetingPlan
}): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const targetEvidence = getTargetEvidence(params.targetingPlan)

  if (targetEvidence.length === 0) {
    return issues
  }

  const originalSkills = new Set(params.originalCvState.skills.map((skill) => buildCanonicalSignal(skill)))

  const newlyIntroducedSkills = params.optimizedCvState.skills.filter((skill) => {
    const canonicalSkill = buildCanonicalSignal(skill)
    return canonicalSkill && !originalSkills.has(canonicalSkill)
  })

  newlyIntroducedSkills.forEach((skill) => {
    if (isAllowedOnSkillsSurface(skill, params.targetingPlan)) {
      return
    }

    const matchingEvidence = targetEvidence.find((evidence) => textContainsEvidenceSignal(skill, evidence))
    const severity = matchingEvidence?.rewritePermission === 'must_not_claim'
      || matchingEvidence?.rewritePermission === 'can_mention_as_related_context'
      || matchingEvidence?.validationSeverityIfViolated === 'critical'
      ? 'high'
      : 'medium'

    issues.push({
      severity,
      message: severity === 'high'
        ? 'A lista de skills targetizada promoveu um gap sem suporte como competencia direta.'
        : 'A lista de skills targetizada introduziu um termo nao comprovado ou nao permitido para claim direta.',
      section: 'skills',
    })
  })

  const originalEvidenceText = normalizeSemanticText(buildEvidenceText(params.originalCvState))
  const optimizedSummarySentences = splitSentences(params.optimizedCvState.summary)
  const optimizedExperienceSentences = params.optimizedCvState.experience.flatMap((entry) => entry.bullets)

  targetEvidence.forEach((evidence) => {
    const isNewToResume = textContainsEvidenceClaim(buildEvidenceText(params.optimizedCvState), evidence)
      && !textContainsEvidenceClaim(originalEvidenceText, evidence)

    if (!isNewToResume) {
      return
    }

    if (evidence.rewritePermission === 'must_not_claim') {
      issues.push({
        severity: 'high',
        message: 'A versao targetizada declarou um requisito sem suporte factual no curriculo original.',
        section: 'summary',
      })
      return
    }

    const affectedSummarySentence = optimizedSummarySentences.find((sentence) => sentenceContainsEvidenceSignal(sentence, evidence))
    const affectedExperienceSentence = optimizedExperienceSentences.find((sentence) => sentenceContainsEvidenceSignal(sentence, evidence))
    const bridgeSentence = affectedSummarySentence ?? affectedExperienceSentence

    if (!bridgeSentence) {
      return
    }

    if (
      evidence.rewritePermission === 'can_bridge_carefully'
      || evidence.rewritePermission === 'can_mention_as_related_context'
    ) {
      if (evidence.supportingResumeSpans.length === 0 || !hasGroundedSupportingSpan(bridgeSentence, evidence)) {
        issues.push({
          severity: 'high',
          message: 'A versao targetizada usou uma ponte semantica sem ancoragem verificavel em experiencia real do curriculo.',
          section: affectedSummarySentence ? 'summary' : 'experience',
        })
        return
      }

      if (hasSeniorityInflation(bridgeSentence)) {
        issues.push({
          severity: 'high',
          message: 'A versao targetizada elevou uma inferencia contextual para senioridade ou dominio nao comprovado.',
          section: affectedSummarySentence ? 'summary' : 'experience',
        })
        return
      }

      if (!hasBridgeLanguage(bridgeSentence)) {
        issues.push({
          severity: evidence.rewritePermission === 'can_mention_as_related_context' ? 'high' : 'medium',
          message: evidence.rewritePermission === 'can_mention_as_related_context'
            ? 'A versao targetizada transformou uma ponte semantica em claim direta.'
            : 'A versao targetizada apresentou uma inferencia contextual de forma forte demais.',
          section: affectedSummarySentence ? 'summary' : 'experience',
        })
      }
    }
  })

  return issues
}
