import {
  buildCanonicalSignal,
  hasLexicalAliasMatch,
  includesNormalizedPhrase,
  normalizeSemanticText,
} from '@/lib/agent/job-targeting/semantic-normalization'
import type { EvidenceLevel, RewritePermission } from '@/types/agent'

export type RequirementSubSignal = {
  originalRequirement: string
  signal: string
  kind: 'tool' | 'domain' | 'education' | 'experience' | 'business_context' | 'unknown'
  requiredness: 'required' | 'preferred' | 'unknown'
}

export type DomainEquivalentRule = {
  jobSignals: string[]
  resumeSignals: string[]
  evidenceLevel: Extract<EvidenceLevel, 'technical_equivalent' | 'strong_contextual_inference' | 'semantic_bridge_only'>
  rewritePermission: Extract<RewritePermission, 'can_claim_normalized' | 'can_bridge_carefully' | 'can_mention_as_related_context'>
}

export type DomainResumeEvidenceEntry = {
  term: string
  span: string
  normalized: string
  canonical: string
}

export type DomainEquivalentMatch = {
  evidenceLevel: DomainEquivalentRule['evidenceLevel']
  confidence: number
  matchedResumeTerms: string[]
  supportingResumeSpans: string[]
  rationale: string
}

export const DOMAIN_EQUIVALENT_RULES: DomainEquivalentRule[] = [
  {
    jobSignals: [
      'ferramentas de bi',
      'business intelligence',
      'power bi',
      'tableau ou similares',
      'ferramentas de visualizacao',
      'ferramentas de visualização',
      'dashboards gerenciais',
      'construcao de dashboards',
      'construção de dashboards',
    ],
    resumeSignals: [
      'power bi',
      'microsoft power bi',
      'qlik sense',
      'qlikview',
      'qlik view',
      'dashboards',
      'data visualization',
      'visualizacao de dados',
      'visualização de dados',
      'business intelligence',
      'bi',
    ],
    evidenceLevel: 'technical_equivalent',
    rewritePermission: 'can_claim_normalized',
  },
  {
    jobSignals: [
      'bases de dados',
      'base de dados',
      'banco de dados',
      'bancos de dados',
      'sql intermediario',
      'sql intermediário',
      'sql avancado',
      'sql avançado',
      'manipulacao de dados',
      'manipulação de dados',
      'modelagem de dados',
    ],
    resumeSignals: [
      'sql',
      'postgresql',
      'sql server',
      'bigquery',
      'databricks',
      'azure databricks',
      'data modeling',
      'modelagem de dados',
      'etl',
      'pipelines etl',
    ],
    evidenceLevel: 'technical_equivalent',
    rewritePermission: 'can_claim_normalized',
  },
  {
    jobSignals: [
      'coleta limpeza estruturacao e modelagem de dados',
      'coleta limpeza estruturação e modelagem de dados',
      'limpeza de dados',
      'estruturacao de dados',
      'estruturação de dados',
      'tratamento de dados',
      'preparacao de dados',
      'preparação de dados',
    ],
    resumeSignals: [
      'etl',
      'pipelines etl',
      'data modeling',
      'modelagem de dados',
      'databricks',
      'azure databricks',
      'pyspark',
    ],
    evidenceLevel: 'technical_equivalent',
    rewritePermission: 'can_claim_normalized',
  },
  {
    jobSignals: [
      'governanca de dados',
      'governança de dados',
      'qualidade dos dados',
      'qualidade de dados',
      'integridade e qualidade dos dados',
      'dados nos sistemas corporativos',
    ],
    resumeSignals: [
      'data governance',
      'governanca de dados',
      'governança de dados',
      'governanca e qualidade de dados',
      'governança e qualidade de dados',
      'qualidade de dados',
      'bases confiaveis',
      'bases confiáveis',
    ],
    evidenceLevel: 'technical_equivalent',
    rewritePermission: 'can_claim_normalized',
  },
  {
    jobSignals: [
      'sistemas de informacao',
      'sistemas de informação',
      'ciencia de dados',
      'ciência de dados',
      'areas correlatas',
      'áreas correlatas',
      'area correlata',
      'área correlata',
      'formacao correlata',
      'formação correlata',
      'formacao em area correlata',
      'formação em área correlata',
    ],
    resumeSignals: [
      'analise e desenvolvimento de sistemas',
      'análise e desenvolvimento de sistemas',
      'sistemas',
      'tecnologia da informacao',
      'tecnologia da informação',
      'data engineering',
      'engenharia de dados',
    ],
    evidenceLevel: 'technical_equivalent',
    rewritePermission: 'can_claim_normalized',
  },
  {
    jobSignals: [
      'automacao de processos',
      'automação de processos',
      'robos',
      'robôs',
      'automatizar rotinas',
      'processos administrativos',
      'automacoes',
      'automações',
    ],
    resumeSignals: [
      'power automate',
      'automacao',
      'automação',
      'apis',
      'api',
      'rest',
      'integrei apis',
      'eliminar processos manuais',
    ],
    evidenceLevel: 'strong_contextual_inference',
    rewritePermission: 'can_bridge_carefully',
  },
]

const STRICT_LITERAL_SIGNALS = [
  'power query',
  'totvs protheus',
  'protheus',
  'excel avancado',
  'excel avançado',
  'procv',
  'xlookup',
  'demonstrações financeiras',
  'demonstracoes financeiras',
  'indicadores financeiros',
  'tableau',
]

function requirednessForRequirement(requirement: string): RequirementSubSignal['requiredness'] {
  const normalized = normalizeSemanticText(requirement)
  if (/\b(?:desejavel|desejaveis|diferencial|nice to have|preferred)\b/u.test(normalized)) {
    return 'preferred'
  }

  if (/\b(?:requisito|obrigatorio|required|dominio|experiencia|vivencia|conhecimento)\b/u.test(normalized)) {
    return 'required'
  }

  return 'unknown'
}

function kindForSignal(signal: string): RequirementSubSignal['kind'] {
  const normalized = normalizeSemanticText(signal)

  if (/\b(?:power bi|tableau|power query|totvs|protheus|excel|sql|python|qlik|databricks|bigquery|postgresql)\b/u.test(normalized)) {
    return 'tool'
  }

  if (/\b(?:formacao|formação|graduacao|graduação|bacharelado|sistemas de informacao|ciencia de dados|areas correlatas|area correlata)\b/u.test(normalized)) {
    return 'education'
  }

  if (/\b(?:ferramentas de bi|business intelligence|bases de dados|modelagem de dados|dashboards|governanca|qualidade de dados)\b/u.test(normalized)) {
    return 'domain'
  }

  if (/\b(?:experiencia|vivencia|atuacao)\b/u.test(normalized)) {
    return 'experience'
  }

  if (/\b(?:marketing|financeiro|administrativos|negocio|areas de negocio)\b/u.test(normalized)) {
    return 'business_context'
  }

  return 'unknown'
}

function cleanSubSignal(value: string): string {
  return value
    .replace(/^[\-*•]\s*/u, '')
    .replace(/^experi[eê]ncia\s+(?:com|em)\s+/iu, '')
    .replace(/^viv[eê]ncia\s+(?:com|em)\s+/iu, '')
    .replace(/^conhecimento\s+(?:em|com)\s+/iu, '')
    .replace(/^dom[ií]nio\s+(?:de|em)\s+/iu, '')
    .replace(/^ferramentas?\s+de\s+manipula[cç][aã]o\s+de\s+dados:\s*/iu, '')
    .replace(/^como\s+/iu, '')
    .replace(/\s+/gu, ' ')
    .replace(/[.;:]+$/u, '')
    .trim()
}

function pushSubSignal(
  result: RequirementSubSignal[],
  originalRequirement: string,
  signal: string,
  requiredness: RequirementSubSignal['requiredness'],
): void {
  const cleaned = cleanSubSignal(signal)
  const canonical = buildCanonicalSignal(cleaned)
  if (!cleaned || !canonical) {
    return
  }

  if (result.some((entry) => buildCanonicalSignal(entry.signal) === canonical)) {
    return
  }

  result.push({
    originalRequirement,
    signal: cleaned,
    kind: kindForSignal(cleaned),
    requiredness,
  })
}

export function decomposeRequirementSignal(requirement: string): RequirementSubSignal[] {
  const requiredness = requirednessForRequirement(requirement)
  const result: RequirementSubSignal[] = []
  const normalizedRequirement = normalizeSemanticText(requirement)

  pushSubSignal(result, requirement, requirement, requiredness)

  if (/\bferramentas? de bi\b/u.test(normalizedRequirement) || /\bbusiness intelligence\b/u.test(normalizedRequirement)) {
    pushSubSignal(result, requirement, 'ferramentas de BI', requiredness)
  }

  if (/\b(?:formacao|graduacao|bacharelado|superior)\b/u.test(normalizedRequirement) && /\b(?:areas correlatas|area correlata|correlatas)\b/u.test(normalizedRequirement)) {
    pushSubSignal(result, requirement, 'formação em área correlata', requiredness)
  }

  const explicitTechnologyMatches = requirement.match(/\b(?:Power BI|Microsoft Power BI|Tableau|Power Query|Totvs Protheus|Protheus|SQL|Python|Excel|Qlik Sense|QlikView|Databricks|BigQuery|PostgreSQL)\b/giu) ?? []
  explicitTechnologyMatches.forEach((signal) => pushSubSignal(result, requirement, signal, requiredness))

  const explicitEducationMatches = requirement.match(/\b(?:Sistemas de Informa[cç][aã]o|Ci[eê]ncia de Dados|Administra[cç][aã]o|Engenharia|Estat[ií]stica|Economia|[aá]reas correlatas)\b/giu) ?? []
  explicitEducationMatches.forEach((signal) => pushSubSignal(result, requirement, signal, requiredness))

  requirement
    .split(/[,;]|\s+\bou\b\s+|\s+\bor\b\s+/iu)
    .map((part) => cleanSubSignal(part))
    .filter((part) => part.split(/\s+/u).filter(Boolean).length <= 5)
    .forEach((signal) => pushSubSignal(result, requirement, signal, requiredness))

  if (/\b(?:banco|bancos|base|bases)\s+de\s+dados\b/u.test(normalizedRequirement)) {
    pushSubSignal(result, requirement, 'bases de dados', requiredness)
  }

  if (/\b(?:automatizar|automacao|automacoes|robos|robôs)\b/u.test(normalizedRequirement)) {
    pushSubSignal(result, requirement, 'automação de processos', requiredness)
  }

  return result
}

function textMatchesSignal(text: string, signal: string): boolean {
  const normalizedText = normalizeSemanticText(text)
  const normalizedSignal = normalizeSemanticText(signal)
  const canonicalText = buildCanonicalSignal(text)
  const canonicalSignal = buildCanonicalSignal(signal)

  return Boolean(
    normalizedText
    && normalizedSignal
    && canonicalText
    && canonicalSignal
    && (
      canonicalText === canonicalSignal
      || includesNormalizedPhrase(normalizedText, normalizedSignal)
      || includesNormalizedPhrase(normalizedSignal, normalizedText)
      || hasLexicalAliasMatch(text, signal)
    ),
  )
}

function hasResumeSignal(resumeEvidence: DomainResumeEvidenceEntry[], signal: string): boolean {
  return resumeEvidence.some((entry) => (
    textMatchesSignal(entry.term, signal)
    || textMatchesSignal(entry.span, signal)
  ))
}

function isStrictLiteralSignal(signal: string): boolean {
  const normalized = normalizeSemanticText(signal)
  return STRICT_LITERAL_SIGNALS.some((strictSignal) => normalizeSemanticText(strictSignal) === normalized)
}

function candidateMatchesRuleSignal(candidate: string, ruleSignal: string): boolean {
  return textMatchesSignal(candidate, ruleSignal)
}

function collectRuleResumeMatches(
  resumeEvidence: DomainResumeEvidenceEntry[],
  resumeSignals: string[],
): DomainResumeEvidenceEntry[] {
  const matches = resumeEvidence.filter((entry) => resumeSignals.some((resumeSignal) => (
    textMatchesSignal(entry.term, resumeSignal)
    || textMatchesSignal(entry.span, resumeSignal)
  )))

  return Array.from(new Map(matches.map((entry) => [`${entry.term}|${entry.span}`, entry])).values())
}

export function findDomainEquivalentMatch(
  jobSignal: string,
  resumeEvidence: DomainResumeEvidenceEntry[],
): DomainEquivalentMatch | null {
  const subSignals = decomposeRequirementSignal(jobSignal)
  const candidates = subSignals.length > 0 ? subSignals.map((entry) => entry.signal) : [jobSignal]
  const resumeHasExactStrictSignals = new Set(
    STRICT_LITERAL_SIGNALS
      .filter((signal) => hasResumeSignal(resumeEvidence, signal))
      .map((signal) => buildCanonicalSignal(signal)),
  )

  for (const rule of DOMAIN_EQUIVALENT_RULES) {
    const matchingJobSignals = candidates.filter((candidate) => {
      const canonicalCandidate = buildCanonicalSignal(candidate)
      if (isStrictLiteralSignal(candidate) && !resumeHasExactStrictSignals.has(canonicalCandidate)) {
        return false
      }

      return rule.jobSignals.some((ruleSignal) => candidateMatchesRuleSignal(candidate, ruleSignal))
    })

    if (matchingJobSignals.length === 0) {
      continue
    }

    const resumeMatches = collectRuleResumeMatches(resumeEvidence, rule.resumeSignals)
    if (resumeMatches.length === 0) {
      continue
    }

    return {
      evidenceLevel: rule.evidenceLevel,
      confidence: rule.evidenceLevel === 'technical_equivalent' ? 0.88 : 0.78,
      matchedResumeTerms: resumeMatches.map((entry) => entry.term),
      supportingResumeSpans: resumeMatches.map((entry) => entry.span),
      rationale: `The compound job signal is supported by safe domain-equivalent resume evidence for: ${matchingJobSignals.join(', ')}.`,
    }
  }

  return null
}
