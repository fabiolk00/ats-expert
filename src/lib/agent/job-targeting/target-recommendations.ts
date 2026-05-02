import {
  findSkillAdjacencyRule,
  type SkillAdjacencyRule,
} from '@/lib/agent/job-targeting/skill-adjacency'
import { buildCanonicalSignal } from '@/lib/agent/job-targeting/semantic-normalization'
import { buildTargetRecommendationsFromAssessment as buildAdapterTargetRecommendationsFromAssessment } from '@/lib/agent/job-targeting/compatibility/legacy-adapters'
import type { JobCompatibilityAssessment } from '@/lib/agent/job-targeting/compatibility/types'
import type {
  CoreRequirement,
  TargetRecommendation,
  TargetRecommendationKind,
  TargetRecommendationPriority,
} from '@/types/agent'

export type BuildTargetRecommendationsInput = {
  targetRole?: string
  coreRequirements: CoreRequirement[]
  preferredRequirements: CoreRequirement[]
  supportedSignals: string[]
  adjacentSignals: string[]
  resumeSkillSignals: string[]
  maxRecommendations?: number
}

const DEFAULT_MAX_RECOMMENDATIONS = 6
const DIRECTLY_SUPPORTED_LEVELS = new Set<CoreRequirement['evidenceLevel']>([
  'explicit',
  'normalized_alias',
  'technical_equivalent',
])
const GENERIC_TOOLING_DETAIL_WORDS = /\b(?:ferramentas?|tooling|stack|plataformas?|sistemas?|software|tecnologias?|technolog(?:y|ies)|ferramental|aplicativos?)\b/iu
const REDUNDANT_TOKEN_STOPWORDS = new Set([
  'a',
  'as',
  'com',
  'da',
  'das',
  'de',
  'do',
  'dos',
  'e',
  'em',
  'na',
  'nas',
  'no',
  'nos',
  'o',
  'os',
  'para',
])

function dedupe(values: string[]): string[] {
  const seen = new Set<string>()

  return values
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => {
      const canonical = buildCanonicalSignal(value) || value.toLocaleLowerCase('pt-BR')
      if (seen.has(canonical)) {
        return false
      }

      seen.add(canonical)
      return true
    })
}

function sentenceList(values: string[]): string {
  if (values.length <= 1) {
    return values[0] ?? ''
  }

  if (values.length === 2) {
    return `${values[0]} e ${values[1]}`
  }

  return `${values.slice(0, -1).join(', ')} e ${values.at(-1)}`
}

function cleanupRequirementText(value: string): string {
  return value
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

function capitalizeFirst(value: string): string {
  const trimmed = value.trim()

  if (!trimmed) {
    return ''
  }

  return `${trimmed.charAt(0).toLocaleUpperCase('pt-BR')}${trimmed.slice(1)}`
}

function formatRequirementLabel(value: string): string {
  const cleaned = cleanupRequirementText(value)
    .replace(/^tamb[eé]m\s+ser[aá]\s+respons[aá]vel\s+por\s+/iu, '')
    .replace(/^ser[aá]\s+respons[aá]vel\s+por\s+/iu, '')
    .replace(/^tem\s+experi[eê]ncia\s+com\s+/iu, '')

  if (/^identificar oportunidades de crescimento nas contas e estruturar propostas comerciais$/iu.test(cleaned)) {
    return 'Identificação de oportunidades de crescimento nas contas e estruturação de propostas comerciais'
  }

  return capitalizeFirst(cleaned)
}

function formatSentenceRequirement(value: string): string {
  const label = formatRequirementLabel(value)

  if (shouldPreserveSentenceCase(label)) {
    return label
  }

  return `${label.charAt(0).toLocaleLowerCase('pt-BR')}${label.slice(1)}`
}

function shouldPreserveSentenceCase(label: string): boolean {
  const [firstToken, secondToken] = label.split(/\s+/u)
  const acronymPattern = /^[A-Z0-9&/+.-]{2,}$/u

  return acronymPattern.test(firstToken ?? '') || acronymPattern.test(secondToken ?? '')
}

function tokenizeRequirement(value: string): Set<string> {
  const tokens = buildCanonicalSignal(formatRequirementLabel(value))
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length >= 3)
    .filter((token) => !REDUNDANT_TOKEN_STOPWORDS.has(token))

  return new Set(tokens)
}

function isRedundantRequirement(candidate: string, existing: string): boolean {
  const candidateTokens = tokenizeRequirement(candidate)
  const existingTokens = tokenizeRequirement(existing)

  if (candidateTokens.size === 0 || existingTokens.size <= candidateTokens.size) {
    return false
  }

  return Array.from(candidateTokens).every((token) => existingTokens.has(token))
}

function isDirectlySupported(requirement: CoreRequirement): boolean {
  return DIRECTLY_SUPPORTED_LEVELS.has(requirement.evidenceLevel)
    && requirement.rewritePermission !== 'must_not_claim'
}

function priorityFor(requirement: CoreRequirement): TargetRecommendationPriority {
  if (requirement.importance === 'core') {
    return 'high'
  }

  if (requirement.importance === 'differential') {
    return 'medium'
  }

  return 'low'
}

function inferKind(requirement: CoreRequirement, rule?: SkillAdjacencyRule): TargetRecommendationKind {
  if (rule?.explanationTemplate === 'tooling_detail') {
    return 'adjacent_skill'
  }

  if (rule?.explanationTemplate === 'integration_context') {
    return 'missing_tooling_detail'
  }

  if (rule?.explanationTemplate === 'methodology_detail') {
    return 'missing_methodology'
  }

  if (rule?.explanationTemplate === 'business_context') {
    return 'missing_stakeholder_context'
  }

  const signal = requirement.signal
  if (/\b(?:metricas?|indicadores?|kpis?|resultado|impacto|quantifica)/iu.test(signal)) {
    return 'needs_quantification'
  }

  if (/\b(?:negocio|business|dominio|industria|mercado|cliente)\b/iu.test(signal)) {
    return 'missing_business_domain'
  }

  if (
    (requirement.requirementKind === 'required' || requirement.importance === 'core')
    && GENERIC_TOOLING_DETAIL_WORDS.test(signal)
  ) {
    return 'missing_tooling_detail'
  }

  return requirement.evidenceLevel === 'unsupported_gap'
    ? 'missing_explicit_skill'
    : 'missing_context'
}

function relatedSectionFor(kind: TargetRecommendationKind): TargetRecommendation['relatedResumeSection'] {
  switch (kind) {
    case 'adjacent_skill':
    case 'missing_explicit_skill':
    case 'missing_tooling_detail':
    case 'missing_methodology':
      return 'skills'
    case 'needs_quantification':
    case 'missing_business_domain':
    case 'missing_context':
    case 'missing_stakeholder_context':
      return 'experience'
  }
}

function relatedEvidenceLevel(requirement: CoreRequirement, hasEvidence: boolean): TargetRecommendation['relatedEvidenceLevel'] {
  if (isDirectlySupported(requirement)) {
    return 'explicit'
  }

  return hasEvidence ? 'adjacent' : 'unsupported_gap'
}

function buildEvidenceCandidates(input: BuildTargetRecommendationsInput): string[] {
  return dedupe([
    ...input.resumeSkillSignals,
    ...input.supportedSignals,
    ...input.adjacentSignals,
  ])
}

function hasWeakOrMissingEvidence(requirement: CoreRequirement): boolean {
  return requirement.rewritePermission === 'must_not_claim'
    || requirement.evidenceLevel === 'unsupported_gap'
    || requirement.evidenceLevel === 'semantic_bridge_only'
    || requirement.evidenceLevel === 'strong_contextual_inference'
    || requirement.rewritePermission === 'can_bridge_carefully'
    || requirement.rewritePermission === 'can_mention_as_related_context'
}

function buildCurrentEvidence(params: {
  requirement: CoreRequirement
  evidenceCandidates: string[]
  adjacentMatch?: ReturnType<typeof findSkillAdjacencyRule>
}): string[] {
  if (params.adjacentMatch) {
    return params.adjacentMatch.evidence
  }

  const requirementTokens = new Set(
    buildCanonicalSignal(params.requirement.signal)
      .split(' ')
      .filter((token) => token.length >= 4),
  )

  return params.evidenceCandidates
    .filter((evidence) => {
      const evidenceTokens = buildCanonicalSignal(evidence).split(' ')
      return evidenceTokens.some((token) => requirementTokens.has(token))
    })
    .slice(0, 3)
}

function buildActionCopy(params: {
  requirement: CoreRequirement
  currentEvidence: string[]
  kind: TargetRecommendationKind
  relatedSuggestions: string[]
}): { suggestedUserAction: string; safeExample?: string } {
  const requirement = params.requirement.signal
  const requirementLabel = formatRequirementLabel(requirement)
  const sentenceRequirement = formatSentenceRequirement(requirement)
  const evidenceCopy = params.currentEvidence.length > 0
    ? `Seu currículo já mostra ${sentenceList(params.currentEvidence)}.`
    : 'Ainda não há evidência suficiente no currículo.'
  const suggestions = params.relatedSuggestions.length > 0
    ? sentenceList(params.relatedSuggestions.map(formatRequirementLabel))
    : requirementLabel

  if (params.kind === 'adjacent_skill' || params.kind === 'missing_tooling_detail') {
    return {
      suggestedUserAction: `${evidenceCopy} Se você usa ${suggestions}, deixe isso explícito em Skills e em uma experiência prática. Caso contrário, deixe fora.`,
      safeExample: `Se for verdadeiro: cite uma entrega real usando ${suggestions}, com contexto e resultado.`,
    }
  }

  if (params.kind === 'missing_stakeholder_context') {
    return {
      suggestedUserAction: `${evidenceCopy} Inclua esse ponto apenas se você tiver atuado com relacionamento, levantamento de demanda ou apresentação para stakeholders reais.`,
      safeExample: 'Se for verdadeiro: cite cliente, área parceira, tipo de demanda e resultado da interação.',
    }
  }

  if (params.kind === 'needs_quantification') {
    return {
      suggestedUserAction: `${evidenceCopy} Se você tiver números reais, acrescente métrica, volume, prazo, qualidade ou impacto. Não estime nem invente valores.`,
      safeExample: 'Se for verdadeiro: cite o indicador acompanhado, o período e o resultado mensurável.',
    }
  }

  if (params.kind === 'missing_methodology') {
    return {
      suggestedUserAction: `${evidenceCopy} Se você aplicou ${suggestions}, mencione a metodologia no contexto do projeto em que ela foi usada.`,
      safeExample: `Se for verdadeiro: cite rituais, priorização ou acompanhamento de entregas ligados a ${suggestions}.`,
    }
  }

  if (params.kind === 'missing_business_domain') {
    return {
      suggestedUserAction: `${evidenceCopy} Caso faça parte da sua experiência real, detalhe domínio de negócio, público atendido ou área parceira.`,
      safeExample: 'Se for verdadeiro: cite o domínio atendido e como seu trabalho apoiou a operação ou decisão.',
    }
  }

  return {
    suggestedUserAction: `${evidenceCopy} Inclua ${sentenceRequirement} somente se fizer parte da sua experiência real; se não fizer, deixe fora do currículo.`,
    safeExample: 'Se for verdadeiro: cite atividade, contexto e resultado real ligados a esse requisito.',
  }
}

function buildRecommendationId(requirement: CoreRequirement, index: number): string {
  const slug = (buildCanonicalSignal(requirement.signal) || `requisito-${index}`)
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 40)

  return `target-rec-${slug || index}`
}

function scoreRecommendation(recommendation: TargetRecommendation, sourceIndex: number): number {
  const priorityScore = recommendation.priority === 'high'
    ? 100
    : recommendation.priority === 'medium'
      ? 60
      : 30
  const evidenceScore = recommendation.currentEvidence.length > 0 ? 12 : 0
  const kindScore = recommendation.kind === 'adjacent_skill' ? 10 : 0
  const coverageScore = tokenizeRequirement(recommendation.jobRequirement).size * 2

  return priorityScore + evidenceScore + kindScore + coverageScore - sourceIndex
}

function removeRedundantRecommendations(recommendations: TargetRecommendation[]): TargetRecommendation[] {
  return recommendations.reduce<TargetRecommendation[]>((result, recommendation) => {
    if (result.some((existing) => isRedundantRequirement(recommendation.jobRequirement, existing.jobRequirement))) {
      return result
    }

    return [...result, recommendation]
  }, [])
}

export function buildTargetRecommendations(
  input: BuildTargetRecommendationsInput,
): TargetRecommendation[] {
  const maxRecommendations = input.maxRecommendations ?? DEFAULT_MAX_RECOMMENDATIONS
  const evidenceCandidates = buildEvidenceCandidates(input)
  const requirements = dedupe([
    ...input.coreRequirements.map((requirement) => requirement.signal),
    ...input.preferredRequirements.map((requirement) => requirement.signal),
  ]).map((signal) => (
    [...input.coreRequirements, ...input.preferredRequirements]
      .find((requirement) => buildCanonicalSignal(requirement.signal) === buildCanonicalSignal(signal))
  )).filter((requirement): requirement is CoreRequirement => Boolean(requirement))

  const recommendations = requirements
    .filter((requirement) => !isDirectlySupported(requirement))
    .filter(hasWeakOrMissingEvidence)
    .map((requirement, index) => {
      const adjacentMatch = findSkillAdjacencyRule(requirement.signal, evidenceCandidates)
      const currentEvidence = buildCurrentEvidence({
        requirement,
        evidenceCandidates,
        adjacentMatch,
      })
      const kind = inferKind(requirement, adjacentMatch?.rule)
      const relatedSuggestions = adjacentMatch?.rule.relatedSuggestions ?? [requirement.signal]
      const { suggestedUserAction, safeExample } = buildActionCopy({
        requirement,
        currentEvidence,
        kind,
        relatedSuggestions,
      })

      return {
        recommendation: {
          id: buildRecommendationId(requirement, index),
          kind,
          priority: priorityFor(requirement),
          jobRequirement: formatRequirementLabel(requirement.signal),
          currentEvidence,
          suggestedUserAction,
          safeExample,
          mustNotInvent: true,
          relatedResumeSection: relatedSectionFor(kind),
          relatedEvidenceLevel: relatedEvidenceLevel(requirement, currentEvidence.length > 0),
        } satisfies TargetRecommendation,
        sourceIndex: index,
      }
    })
    .filter(({ recommendation }) => (
      recommendation.priority === 'high'
      || recommendation.currentEvidence.length > 0
      || recommendation.kind === 'missing_explicit_skill'
    ))
    .filter(({ recommendation }) => !/benef[ií]cios?|cultura|sobre\s+n[oó]s|plano\s+de\s+carreira/iu.test(recommendation.jobRequirement))
    .sort((left, right) => scoreRecommendation(right.recommendation, right.sourceIndex) - scoreRecommendation(left.recommendation, left.sourceIndex))
    .map(({ recommendation }) => recommendation)

  return removeRedundantRecommendations(recommendations).slice(0, maxRecommendations)
}

export function buildTargetRecommendationsFromAssessment(
  assessment: JobCompatibilityAssessment,
): TargetRecommendation[] {
  return buildAdapterTargetRecommendationsFromAssessment(assessment)
}
