import type { CVState, GapAnalysisResult } from '@/types/cv'
import type {
  CareerFitCheckpoint,
  CareerFitEvaluation,
  CareerFitRiskLevel,
  Session,
  TargetFitAssessment,
} from '@/types/agent'
import { fingerprintJD } from '@/lib/agent/jd-fingerprint'
import { localizeTargetFitSummary } from '@/lib/agent/target-fit'

type RoleFamily =
  | 'frontend'
  | 'backend'
  | 'devops'
  | 'data'
  | 'design'
  | 'product'
  | 'qa'
  | 'mobile'
  | 'marketing'
  | 'unknown'

type RoleFamilyDistance = 'same' | 'adjacent' | 'distant' | 'unknown'

type SeniorityLevel = 'intern' | 'junior' | 'mid' | 'senior' | 'lead' | 'executive' | 'unknown'

const ADJACENCY_MAP: Partial<Record<RoleFamily, Partial<Record<RoleFamily, RoleFamilyDistance>>>> = {
  frontend: {
    backend: 'adjacent',
    design: 'adjacent',
    mobile: 'adjacent',
    qa: 'adjacent',
  },
  backend: {
    frontend: 'adjacent',
    devops: 'adjacent',
    data: 'adjacent',
    mobile: 'adjacent',
    qa: 'adjacent',
  },
  devops: {
    backend: 'adjacent',
  },
  data: {
    backend: 'adjacent',
    product: 'adjacent',
    marketing: 'adjacent',
  },
  design: {
    frontend: 'adjacent',
    mobile: 'adjacent',
    product: 'adjacent',
    marketing: 'adjacent',
  },
  product: {
    data: 'adjacent',
    design: 'adjacent',
    marketing: 'adjacent',
  },
  qa: {
    frontend: 'adjacent',
    backend: 'adjacent',
    mobile: 'adjacent',
  },
  mobile: {
    frontend: 'adjacent',
    backend: 'adjacent',
    design: 'adjacent',
    qa: 'adjacent',
  },
  marketing: {
    data: 'adjacent',
    product: 'adjacent',
    design: 'adjacent',
  },
}

export type ProfileAuditFinding = {
  key: 'headline' | 'contact' | 'summary' | 'experience' | 'skills' | 'education' | 'proof'
  item: string
  reason: string
}

function hasMetric(text: string): boolean {
  return /(?:\d|%|r\$|usd|eur|kpi|meta|aument|reduz|cresceu|growth|lift|roi|ctr|conversion)/i.test(text)
}

function wordCount(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .length
}

function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function inferProfileText(cvState: CVState): string {
  return [
    cvState.summary,
    cvState.skills.join(', '),
    ...cvState.experience.flatMap((entry) => [entry.title, entry.company, ...entry.bullets]),
  ].join('\n')
}

function inferRoleFamily(text: string): RoleFamily {
  const normalized = normalizeText(text)

  if (/\b(front[- ]?end|react|vue|angular|ui)\b/.test(normalized)) return 'frontend'
  if (/\b(back[- ]?end|api|postgres|sql server|node|java|c#)\b/.test(normalized)) return 'backend'
  if (/\b(devops|sre|kubernetes|docker|terraform|aws|azure|gcp)\b/.test(normalized)) return 'devops'
  if (/\b(data|analytics|bi|etl|machine learning|bigquery|dbt|looker|power bi)\b/.test(normalized)) return 'data'
  if (/\b(designer|ux|product design|figma)\b/.test(normalized)) return 'design'
  if (/\b(product manager|product owner|roadmap|discovery)\b/.test(normalized)) return 'product'
  if (/\b(qa|quality assurance|test automation|selenium)\b/.test(normalized)) return 'qa'
  if (/\b(mobile|android|ios|react native|flutter)\b/.test(normalized)) return 'mobile'
  if (/\b(marketing|growth|seo|crm|paid media)\b/.test(normalized)) return 'marketing'

  return 'unknown'
}

function roleFamilyDistance(profile: RoleFamily, target: RoleFamily): RoleFamilyDistance {
  if (profile === target) {
    return 'same'
  }

  if (profile === 'unknown' || target === 'unknown') {
    return 'unknown'
  }

  return ADJACENCY_MAP[profile]?.[target] ?? 'distant'
}

function inferSeniorityLevel(text: string): SeniorityLevel {
  const normalized = normalizeText(text)

  if (/\b(head|director|vp|chief|gerente|manager)\b/.test(normalized)) return 'executive'
  if (/\b(staff|principal|lead|lider|tech lead)\b/.test(normalized)) return 'lead'
  if (/\b(senior|sr)\b/.test(normalized)) return 'senior'
  if (/\b(pleno|mid|intermediario)\b/.test(normalized)) return 'mid'
  if (/\b(junior|jr)\b/.test(normalized)) return 'junior'
  if (/\b(estagiario|intern|trainee)\b/.test(normalized)) return 'intern'

  return 'unknown'
}

function seniorityGapIsMajor(profile: SeniorityLevel, target: SeniorityLevel): boolean {
  const rank: Record<SeniorityLevel, number> = {
    unknown: 0,
    intern: 1,
    junior: 2,
    mid: 3,
    senior: 4,
    lead: 5,
    executive: 6,
  }

  if (profile === 'unknown' || target === 'unknown') {
    return false
  }

  return rank[target] - rank[profile] >= 2
}

export function assessProfileAuditFindings(cvState: CVState): ProfileAuditFinding[] {
  const findings: ProfileAuditFinding[] = []
  const latestTitle = cvState.experience[0]?.title?.trim() ?? ''
  const summary = cvState.summary.trim()
  const skillCount = cvState.skills.filter((skill) => skill.trim().length > 0).length
  const experienceEntries = cvState.experience.filter((entry) => entry.title.trim() || entry.company.trim())
  const totalBullets = experienceEntries.reduce((total, entry) => total + entry.bullets.filter((bullet) => bullet.trim().length > 0).length, 0)
  const metricBullets = experienceEntries.flatMap((entry) => entry.bullets).filter((bullet) => hasMetric(bullet)).length
  const missingContactFields = [
    !cvState.email.trim() ? 'email' : null,
    !cvState.phone.trim() ? 'telefone' : null,
    !cvState.location?.trim() ? 'localização' : null,
    !cvState.linkedin?.trim() ? 'LinkedIn' : null,
  ].filter((value): value is string => Boolean(value))

  if (!latestTitle && wordCount(summary) < 10) {
    findings.push({
      key: 'headline',
      item: 'headline profissional / cargo atual',
      reason: 'Sem um cargo-alvo claro, recrutadores e ATS entendem pior o seu posicionamento e a senioridade pretendida.',
    })
  }

  if (missingContactFields.length > 0) {
    findings.push({
      key: 'contact',
      item: `informações de contato (${missingContactFields.join(', ')})`,
      reason: 'Contato incompleto reduz alcance com recrutadores e pode atrapalhar filtros básicos de ATS ou o retorno para entrevistas.',
    })
  }

  if (wordCount(summary) < 35) {
    findings.push({
      key: 'summary',
      item: 'resumo / sobre',
      reason: 'Um resumo curto demais perde palavras-chave, contexto de senioridade e narrativa profissional para convencer recrutadores rapidamente.',
    })
  }

  if (experienceEntries.length === 0 || totalBullets < Math.max(2, experienceEntries.length * 2)) {
    findings.push({
      key: 'experience',
      item: 'seção de experiência',
      reason: 'Experiências rasas ou incompletas enfraquecem a leitura de impacto real e reduzem a aderência em vagas filtradas por histórico.',
    })
  } else if (metricBullets === 0) {
    findings.push({
      key: 'experience',
      item: 'resultados mensuráveis na experiência',
      reason: 'Sem métricas ou resultados concretos, o currículo perde força para recrutadores e parece mais genérico para o ATS.',
    })
  }

  if (skillCount < 6) {
    findings.push({
      key: 'skills',
      item: 'seção de habilidades',
      reason: 'Poucas skills limitam correspondência por palavra-chave e dificultam mostrar amplitude técnica para a vaga certa.',
    })
  }

  if (cvState.education.length === 0) {
    findings.push({
      key: 'education',
      item: 'educação',
      reason: 'Ausência de formação declarada pode derrubar confiança do recrutador e prejudicar filtros que exigem escolaridade mínima.',
    })
  }

  if (experienceEntries.length < 2 && (cvState.certifications?.length ?? 0) === 0) {
    findings.push({
      key: 'proof',
      item: 'projetos ou certificações',
      reason: 'Quando a experiência ainda é curta, projetos e certificações ajudam a provar profundidade, consistência e intenção de carreira.',
    })
  }

  return findings
}

export function formatProfileAuditSummary(cvState: CVState, maxItems = 3): string | null {
  const findings = assessProfileAuditFindings(cvState).slice(0, maxItems)

  if (findings.length === 0) {
    return null
  }

  return findings
    .map((finding) => `${finding.item}: ${finding.reason}`)
    .join(' ')
}

export function buildProfileAuditSnapshot(cvState: CVState, maxItems = 4): string {
  const findings = assessProfileAuditFindings(cvState).slice(0, maxItems)

  if (findings.length === 0) {
    return 'Profile audit: no obvious ATS or recruiter-visibility weaknesses detected in the saved profile.'
  }

  return [
    'Profile audit findings:',
    ...findings.map((finding) => `- ${finding.item}: ${finding.reason}`),
  ].join('\n')
}

function resolveCurrentCareerFitEvaluation(
  session: Pick<Session, 'agentState' | 'cvState'>,
): CareerFitEvaluation | null {
  return session.agentState.careerFitEvaluation ?? evaluateCareerFitRisk(session)
}

function buildFamilyDistanceReason(params: {
  profileFamily: RoleFamily
  targetFamily: RoleFamily
  familyDistance: RoleFamilyDistance
}): string | null {
  if (
    params.profileFamily === 'unknown'
    || params.targetFamily === 'unknown'
    || params.familyDistance === 'same'
  ) {
    return null
  }

  if (params.familyDistance === 'adjacent') {
    return `Seu histórico atual é adjacente a ${params.targetFamily}, mas a vaga concentra mais em ${params.targetFamily} do que o seu histórico recente demonstra hoje.`
  }

  return `Seu histórico atual parece mais alinhado a ${params.profileFamily}, enquanto esta vaga pede um foco mais claro em ${params.targetFamily}.`
}

export function evaluateCareerFitRisk(session: Pick<Session, 'agentState' | 'cvState'>): CareerFitEvaluation | null {
  const targetJobDescription = session.agentState.targetJobDescription?.trim()
  if (!targetJobDescription) {
    return null
  }

  const gapAnalysisResult = session.agentState.gapAnalysis?.result
  const targetFitAssessment = session.agentState.targetFitAssessment
  const profileText = inferProfileText(session.cvState)
  const profileFamily = inferRoleFamily(profileText)
  const targetFamily = inferRoleFamily(targetJobDescription)
  const familyDistance = roleFamilyDistance(profileFamily, targetFamily)
  const seniorityGapMajor = seniorityGapIsMajor(
    inferSeniorityLevel(profileText),
    inferSeniorityLevel(targetJobDescription),
  )
  const matchScore = gapAnalysisResult?.matchScore
  const missingSkillsCount = gapAnalysisResult?.missingSkills.length ?? 0
  const weakAreasCount = gapAnalysisResult?.weakAreas.length ?? 0

  let riskPoints = 0

  if (matchScore !== undefined) {
    if (matchScore < 45) {
      riskPoints += 4
    } else if (matchScore < 60) {
      riskPoints += 2
    }
  }

  if (missingSkillsCount >= 6) {
    riskPoints += 3
  } else if (missingSkillsCount >= 4) {
    riskPoints += 2
  } else if (missingSkillsCount >= 2) {
    riskPoints += 1
  }

  if (weakAreasCount >= 5) {
    riskPoints += 3
  } else if (weakAreasCount >= 3) {
    riskPoints += 2
  } else if (weakAreasCount >= 1) {
    riskPoints += 1
  }

  if (familyDistance === 'distant') {
    riskPoints += 4
  } else if (familyDistance === 'adjacent') {
    riskPoints += 1
  }

  if (seniorityGapMajor) {
    riskPoints += 3
  }

  if (
    familyDistance === 'adjacent'
    && matchScore !== undefined
    && matchScore >= 55
    && missingSkillsCount <= 3
  ) {
    riskPoints = Math.max(0, riskPoints - 1)
  }

  let riskLevel: CareerFitRiskLevel
  if (riskPoints >= 8) {
    riskLevel = 'high'
  } else if (riskPoints >= 4) {
    riskLevel = 'medium'
  } else {
    riskLevel = 'low'
  }

  const summaryByRiskLevel: Record<CareerFitRiskLevel, string> = {
    low: 'Alinhamento viável com gaps tratáveis.',
    medium: 'Alinhamento parcial com lacunas relevantes.',
    high: 'Desalinhamento estrutural para a vaga.',
  }

  const familyDistanceReason = buildFamilyDistanceReason({
    profileFamily,
    targetFamily,
    familyDistance,
  })
  const seniorityReason = seniorityGapMajor
    ? 'A senioridade pedida pela vaga parece acima do que seu histórico recente demonstra hoje.'
    : null

  const reasons = Array.from(new Set([
    ...(targetFitAssessment?.reasons ?? []),
    familyDistanceReason,
    seniorityReason,
    ...(gapAnalysisResult?.missingSkills ?? []).slice(0, 2).map((skill) => `Skill ausente: ${skill}`),
  ].filter((value): value is string => Boolean(value)))).slice(0, 4)

  return {
    riskLevel,
    needsExplicitConfirmation: riskLevel === 'high',
    summary: summaryByRiskLevel[riskLevel],
    reasons,
    riskPoints,
    assessedAt: session.agentState.gapAnalysis?.analyzedAt
      ?? targetFitAssessment?.assessedAt
      ?? new Date().toISOString(),
    signals: {
      matchScore,
      missingSkillsCount,
      weakAreasCount,
      familyDistance,
      seniorityGapMajor,
    },
  }
}

export function requiresCareerFitWarning(session: Pick<Session, 'agentState' | 'cvState'>): boolean {
  const evaluation = resolveCurrentCareerFitEvaluation(session)
  if (!evaluation) {
    return false
  }

  return evaluation.riskLevel === 'medium' || evaluation.riskLevel === 'high'
}

export function hasActiveCareerFitWarning(session: Pick<Session, 'agentState'>): boolean {
  const targetJobDescription = session.agentState.targetJobDescription?.trim()
  const phaseMeta = session.agentState.phaseMeta

  if (!targetJobDescription || !phaseMeta?.careerFitWarningIssuedAt || !phaseMeta.careerFitWarningJDFingerprint) {
    return false
  }

  return phaseMeta.careerFitWarningJDFingerprint === fingerprintJD(targetJobDescription)
}

export function hasConfirmedCareerFitOverride(session: Pick<Session, 'agentState'>): boolean {
  const targetJobDescription = session.agentState.targetJobDescription?.trim()
  const phaseMeta = session.agentState.phaseMeta

  if (!targetJobDescription || !phaseMeta?.careerFitOverrideConfirmedAt) {
    return false
  }

  return phaseMeta.careerFitOverrideTargetJobDescription?.trim() === targetJobDescription
}

export function requiresCareerFitOverrideConfirmation(session: Pick<Session, 'agentState' | 'cvState'>): boolean {
  const evaluation = resolveCurrentCareerFitEvaluation(session)

  if (evaluation?.riskLevel !== 'high') {
    return false
  }

  return hasActiveCareerFitWarning(session)
    && !hasConfirmedCareerFitOverride(session)
}

function buildCareerFitMismatchNotes(session: Pick<Session, 'agentState' | 'cvState'>): {
  familyDistance: RoleFamilyDistance
  seniorityMismatch: boolean
  mismatchReason: string | null
} {
  const targetJobDescription = session.agentState.targetJobDescription?.trim() ?? ''
  const profileText = inferProfileText(session.cvState)
  const profileFamily = inferRoleFamily(profileText)
  const targetFamily = inferRoleFamily(targetJobDescription)
  const familyDistance = roleFamilyDistance(profileFamily, targetFamily)
  const seniorityMismatch = seniorityGapIsMajor(
    inferSeniorityLevel(profileText),
    inferSeniorityLevel(targetJobDescription),
  )

  const mismatchReason = buildFamilyDistanceReason({
    profileFamily,
    targetFamily,
    familyDistance,
  }) ?? (seniorityMismatch
      ? 'A senioridade pedida pela vaga parece acima do que seu histórico recente demonstra hoje.'
      : null)

  return {
    familyDistance,
    seniorityMismatch,
    mismatchReason,
  }
}

/**
 * CURRIA-105 migration note:
 * - Audited current consumers: `src/lib/agent/agent-persistence.ts` and
 *   `src/app/api/session/[id]/route.ts`.
 * - Both consumers feed the existing hard-block confirmation modal flow only.
 * - No softer UI badge, tooltip, or informational consumer was found in the current codebase.
 *
 * @deprecated Behavior changed in CURRIA-105: checkpoint is now only emitted for
 * riskLevel='high' with pending confirmation. For medium risk, consumers should
 * read agentState.careerFitEvaluation directly.
 *
 * This function will be removed in a future cleanup phase. Do not add new consumers.
 */
// NEW-CONSUMER-FORBIDDEN: use agentState.careerFitEvaluation instead
export function buildCareerFitCheckpoint(session: Pick<Session, 'agentState' | 'cvState'>): CareerFitCheckpoint | null {
  const targetJobDescription = session.agentState.targetJobDescription?.trim()
  const evaluation = resolveCurrentCareerFitEvaluation(session)

  if (
    !targetJobDescription
    || !evaluation?.needsExplicitConfirmation
    || !requiresCareerFitOverrideConfirmation(session)
  ) {
    return null
  }

  const gapAnalysis = session.agentState.gapAnalysis?.result
  const { familyDistance, seniorityMismatch, mismatchReason } = buildCareerFitMismatchNotes(session)

  if (!gapAnalysis && familyDistance === 'same' && !seniorityMismatch) {
    return null
  }

  return {
    status: 'pending_confirmation',
    targetJobDescription,
    summary: evaluation.summary,
    reasons: Array.from(new Set([
      ...evaluation.reasons,
      mismatchReason,
      gapAnalysis?.weakAreas.length
        ? `Áreas ainda frágeis para esta vaga: ${gapAnalysis.weakAreas.slice(0, 2).join(', ')}.`
        : null,
    ].filter((value): value is string => Boolean(value)))).slice(0, 4),
    nextSteps: [
      'Cancelar para revisar a vaga alvo ou ajustar a estratégia antes de gerar.',
      'Continuar mesmo assim para seguir com a otimização usando apenas o seu histórico real.',
    ],
    assessedAt: evaluation.assessedAt,
  }
}

export function buildCareerFitWarningText(
  input: CareerFitEvaluation | Pick<Session, 'agentState' | 'cvState'>,
): string | null {
  const evaluation = 'riskLevel' in input ? input : resolveCurrentCareerFitEvaluation(input)
  if (!evaluation) {
    return null
  }

  const tonePrefix: Record<CareerFitRiskLevel, string> = {
    low: '[Informativo]',
    medium: '[Atenção]',
    high: '[Aviso]',
  }

  const reasonLines = evaluation.reasons.map((reason) => `- ${reason}`).join('\n')
  const suffix = evaluation.riskLevel === 'high'
    ? 'Reescrever o CV não fecha lacunas estruturais. Confirme explicitamente para continuar.'
    : ''

  return [
    `${tonePrefix[evaluation.riskLevel]} ${evaluation.summary}`,
    reasonLines,
    suffix,
  ].filter(Boolean).join('\n')
}

export function buildCareerFitPromptSnapshot(
  careerFitEvaluation?: CareerFitEvaluation | null,
  targetFitAssessment?: TargetFitAssessment,
  gapAnalysis?: GapAnalysisResult,
): string {
  if (!careerFitEvaluation) {
    return ''
  }

  const lines: string[] = [
    `Career Fit Risk: ${careerFitEvaluation.riskLevel}.`,
    `Career fit summary: ${careerFitEvaluation.summary}`,
  ]

  if (careerFitEvaluation.riskLevel === 'high') {
    lines.push('Require explicit confirmation before generation.')
  } else if (careerFitEvaluation.riskLevel === 'medium') {
    lines.push('Warn, but continue with conservative optimization.')
  } else {
    lines.push('Informative only: proceed with standard honest optimization.')
  }

  if (targetFitAssessment) {
    lines.push(`Current fit level: ${targetFitAssessment.level}. ${localizeTargetFitSummary(targetFitAssessment.summary)}`)
  }

  if (gapAnalysis) {
    lines.push(`Current gap score: ${gapAnalysis.matchScore}/100.`)
    if (gapAnalysis.missingSkills.length > 0) {
      lines.push(`Main missing skills: ${gapAnalysis.missingSkills.slice(0, 3).join(', ')}.`)
    }
    if (gapAnalysis.weakAreas.length > 0) {
      lines.push(`Main weak areas: ${gapAnalysis.weakAreas.slice(0, 3).join(', ')}.`)
    }
  }

  return lines.join('\n')
}
