import { describe, expect, it } from 'vitest'

import { validateRewrite } from '@/lib/agent/tools/validate-rewrite'
import type { TargetEvidence, TargetingPlan } from '@/types/agent'
import type { CVState } from '@/types/cv'

function buildCvState(): CVState {
  return {
    fullName: 'Ana Silva',
    email: 'ana@example.com',
    phone: '555-0100',
    summary: 'Profissional de dados com foco em BI e SQL.',
    experience: [
      {
        title: 'Analista de Dados',
        company: 'Acme',
        startDate: '2022',
        endDate: '2024',
        bullets: ['Construi dashboards e rotinas em SQL.'],
      },
    ],
    skills: ['SQL', 'Power BI'],
    education: [],
    certifications: [],
  }
}

function buildTargetingPlan(overrides: Partial<TargetingPlan> = {}): TargetingPlan {
  return {
    targetRole: 'Analytics Engineer',
    targetRoleConfidence: 'high',
    targetRoleSource: 'heuristic',
    focusKeywords: ['analytics engineer'],
    mustEmphasize: [],
    shouldDeemphasize: [],
    missingButCannotInvent: [],
    targetEvidence: [],
    rewritePermissions: {
      directClaimsAllowed: [],
      normalizedClaimsAllowed: [],
      bridgeClaimsAllowed: [],
      relatedButNotClaimable: [],
      forbiddenClaims: [],
      skillsSurfaceAllowed: [],
    },
    sectionStrategy: {
      summary: [],
      experience: [],
      skills: [],
      education: [],
      certifications: [],
    },
    ...overrides,
  }
}

function buildTargetEvidence(overrides: Partial<TargetEvidence> = {}): TargetEvidence {
  return {
    jobSignal: 'Analytics Engineer',
    canonicalSignal: 'Analytics Engineer',
    evidenceLevel: 'strong_contextual_inference',
    rewritePermission: 'can_bridge_carefully',
    matchedResumeTerms: ['analise de dados'],
    supportingResumeSpans: ['Atuei com analise de dados e dashboards executivos.'],
    rationale: 'Existe evidencia contextual forte, mas nao literal.',
    confidence: 0.76,
    allowedRewriteForms: ['Analytics Engineer'],
    forbiddenRewriteForms: ['especialista em analytics engineer'],
    validationSeverityIfViolated: 'warning',
    ...overrides,
  }
}

describe('validateRewrite', () => {
  it('returns the expanded compatibility contract', () => {
    const result = validateRewrite(buildCvState(), buildCvState())

    expect(result).toEqual({
      blocked: false,
      valid: true,
      hardIssues: [],
      softWarnings: [],
      issues: [],
    })
  })

  it('ignores heading-like target roles in job targeting validation', () => {
    const result = validateRewrite(
      buildCvState(),
      {
        ...buildCvState(),
        summary: 'Profissional de dados com foco em BI e SQL. Requisitos obrigatórios atendidos com base na experiência.',
      },
      {
        mode: 'job_targeting',
        targetingPlan: buildTargetingPlan({
          targetRole: 'Requisitos Obrigatorios',
          targetRoleConfidence: 'low',
          targetRoleSource: 'fallback',
        }),
      },
    )

    expect(result.issues.some((issue) => issue.message.includes('cargo alvo'))).toBe(false)
  })

  it('blocks unsupported real target-role claims in targeted summaries', () => {
    const result = validateRewrite(
      buildCvState(),
      {
        ...buildCvState(),
        summary: 'Analytics engineer com foco em BI e SQL.',
      },
      {
        mode: 'job_targeting',
        targetingPlan: buildTargetingPlan(),
      },
    )

    expect(result.blocked).toBe(true)
    expect(result.hardIssues).toContainEqual(expect.objectContaining({
      severity: 'high',
      section: 'summary',
      issueType: 'target_role_overclaim',
    }))
  })

  it('does not fail job targeting when only weak-area labels appear in the optimized text', () => {
    const result = validateRewrite(
      buildCvState(),
      {
        ...buildCvState(),
        summary: 'Profissional de dados com foco em BI e SQL.',
      },
      {
        mode: 'job_targeting',
        targetingPlan: buildTargetingPlan({
          missingButCannotInvent: ['summary'],
        }),
      },
    )

    expect(result.issues.some((issue) => issue.message.includes('apagar gaps reais'))).toBe(false)
  })

  it('passes when a supported quantified bullet is rewritten without inventing evidence', () => {
    const original = {
      ...buildCvState(),
      summary: 'Profissional de dados com foco em resultados analiticos.',
      experience: [{
        title: 'Analista de Dados',
        company: 'Acme',
        startDate: '2022',
        endDate: '2024',
        bullets: ['Aumentei em 15% os indicadores de qualidade de producao na LATAM com dashboards em Power BI.'],
      }],
    }

    const optimized = {
      ...original,
      experience: [{
        ...original.experience[0],
        bullets: ['Liderei dashboards em Power BI e SQL, contribuindo para aumento de 15% nos indicadores de qualidade de producao na LATAM.'],
      }],
    }

    const result = validateRewrite(original, optimized)

    expect(result.valid).toBe(true)
    expect(result.blocked).toBe(false)
    expect(result.issues).toEqual([])
  })

  it('does not warn when the optimized summary keeps a skill already claimed in the original summary', () => {
    const original = {
      ...buildCvState(),
      summary: 'Profissional de dados com foco em BI e SQL.',
      experience: [{
        title: 'Analista de Dados',
        company: 'Acme',
        startDate: '2022',
        endDate: '2024',
        bullets: ['Construi dashboards executivos para a operacao comercial.'],
      }],
    }

    const optimized = {
      ...original,
      summary: 'Profissional de dados com foco em BI e SQL para suportar decisoes de negocio.',
      experience: [{
        ...original.experience[0],
        bullets: ['Estruturei dashboards executivos para apoiar a operacao comercial.'],
      }],
    }

    const result = validateRewrite(original, optimized)

    expect(result.issues.some((issue) => issue.message.includes('skill sem evidência no currículo original'))).toBe(false)
  })

  it('does not warn when the skill exists only in original certifications', () => {
    const original = {
      ...buildCvState(),
      summary: 'Profissional de dados com foco em BI.',
      skills: ['SQL'],
      certifications: [{
        name: 'Power BI Data Analyst Associate',
        issuer: 'Microsoft',
        year: '2024',
      }],
    }

    const optimized = {
      ...original,
      summary: 'Profissional de dados com foco em BI, SQL e Power BI.',
      skills: ['SQL', 'Power BI'],
    }

    const result = validateRewrite(original, optimized)

    expect(result.issues.some((issue) => issue.message.includes('skill sem evidência no currículo original'))).toBe(false)
    expect(result.blocked).toBe(false)
  })

  it('returns a soft warning when the optimized summary introduces a skill with no original evidence', () => {
    const original = {
      ...buildCvState(),
      summary: 'Profissional de dados com foco em BI.',
      skills: ['SQL', 'Power BI'],
    }

    const optimized = {
      ...original,
      summary: 'Profissional de dados com foco em BI, SQL e Airflow.',
      skills: ['SQL', 'Power BI', 'Airflow'],
    }

    const result = validateRewrite(original, optimized)

    expect(result.blocked).toBe(false)
    expect(result.valid).toBe(false)
    expect(result.hardIssues).toEqual([])
    expect(result.softWarnings).toContainEqual(expect.objectContaining({
      severity: 'medium',
      section: 'summary',
      message: 'O resumo otimizado menciona skill sem evidência no currículo original.',
    }))
  })

  it('returns a hard issue when a company is invented', () => {
    const optimized = {
      ...buildCvState(),
      experience: [{
        title: 'Analista de Dados',
        company: 'Outra Empresa',
        startDate: '2022',
        endDate: '2024',
        bullets: ['Construi dashboards e rotinas em SQL.'],
      }],
    }

    const result = validateRewrite(buildCvState(), optimized)

    expect(result.blocked).toBe(true)
    expect(result.hardIssues).toContainEqual(expect.objectContaining({
      severity: 'high',
      section: 'experience',
    }))
  })

  it('returns a hard issue when a certification is invented', () => {
    const optimized = {
      ...buildCvState(),
      certifications: [{
        name: 'AWS Certified Data Engineer',
        issuer: 'AWS',
        year: '2025',
      }],
    }

    const result = validateRewrite(buildCvState(), optimized)

    expect(result.blocked).toBe(true)
    expect(result.hardIssues).toContainEqual(expect.objectContaining({
      severity: 'high',
      section: 'certifications',
    }))
  })

  it('returns a hard issue when dates are altered', () => {
    const optimized = {
      ...buildCvState(),
      experience: [{
        ...buildCvState().experience[0],
        endDate: '2025',
      }],
    }

    const result = validateRewrite(buildCvState(), optimized)

    expect(result.blocked).toBe(true)
    expect(result.hardIssues).toContainEqual(expect.objectContaining({
      severity: 'high',
      section: 'experience',
    }))
  })

  it('returns a hard issue when job targeting invents alignment for a missing skill gap', () => {
    const original = buildCvState()
    const optimized = {
      ...original,
      summary: 'Profissional de dados com foco em BI, SQL e Airflow.',
      skills: ['SQL', 'Power BI', 'Airflow'],
    }

    const result = validateRewrite(original, optimized, {
      mode: 'job_targeting',
      targetingPlan: buildTargetingPlan({
        missingButCannotInvent: ['airflow'],
      }),
    })

    expect(result.blocked).toBe(true)
    expect(result.hardIssues).toContainEqual(expect.objectContaining({
      severity: 'high',
      message: expect.stringContaining('apagar gaps reais'),
    }))
  })

  it('allows a normalized skill claim when the targeting evidence explicitly permits it on the skills surface', () => {
    const original = {
      ...buildCvState(),
      skills: ['SQL'],
    }

    const optimized = {
      ...original,
      skills: ['SQL', 'Structured Query Language'],
      summary: 'Profissional de dados com foco em SQL.',
    }

    const result = validateRewrite(original, optimized, {
      mode: 'job_targeting',
      targetingPlan: buildTargetingPlan({
        targetEvidence: [
          buildTargetEvidence({
            jobSignal: 'Structured Query Language',
            canonicalSignal: 'Structured Query Language',
            evidenceLevel: 'normalized_alias',
            rewritePermission: 'can_claim_normalized',
            matchedResumeTerms: ['SQL'],
            supportingResumeSpans: ['SQL'],
            confidence: 0.96,
            allowedRewriteForms: ['Structured Query Language', 'SQL'],
            forbiddenRewriteForms: [],
            validationSeverityIfViolated: 'none',
          }),
        ],
        rewritePermissions: {
          directClaimsAllowed: [],
          normalizedClaimsAllowed: ['Structured Query Language'],
          bridgeClaimsAllowed: [],
          relatedButNotClaimable: [],
          forbiddenClaims: [],
          skillsSurfaceAllowed: ['Structured Query Language'],
        },
      }),
    })

    expect(result.valid).toBe(true)
    expect(result.issues).toEqual([])
  })

  it('allows a careful bridge in the summary but rejects the same bridge as a direct skill claim', () => {
    const targetingPlan = buildTargetingPlan({
      targetEvidence: [
        buildTargetEvidence({
          jobSignal: 'Lean Six Sigma',
          canonicalSignal: 'Lean Six Sigma',
          evidenceLevel: 'semantic_bridge_only',
          rewritePermission: 'can_mention_as_related_context',
          matchedResumeTerms: ['melhoria continua'],
          supportingResumeSpans: ['Atuei com melhoria continua e reducao de desperdicio.'],
          confidence: 0.73,
          allowedRewriteForms: ['melhoria continua'],
          forbiddenRewriteForms: ['Lean Six Sigma'],
          validationSeverityIfViolated: 'major',
        }),
      ],
      rewritePermissions: {
        directClaimsAllowed: [],
        normalizedClaimsAllowed: [],
        bridgeClaimsAllowed: [{
          jobSignal: 'Lean Six Sigma',
          safeBridge: 'Relacione Lean Six Sigma apenas a melhoria continua.',
          doNotSay: ['Lean Six Sigma'],
        }],
        relatedButNotClaimable: ['Lean Six Sigma'],
        forbiddenClaims: [],
        skillsSurfaceAllowed: [],
      },
    })

    const summaryBridge = validateRewrite(
      buildCvState(),
      {
        ...buildCvState(),
        summary: 'Profissional de dados com experiencia relacionada a Lean Six Sigma por meio de melhoria continua.',
      },
      {
        mode: 'job_targeting',
        targetingPlan,
      },
    )

    expect(summaryBridge.issues).toEqual([])

    const directSkillClaim = validateRewrite(
      buildCvState(),
      {
        ...buildCvState(),
        skills: ['SQL', 'Power BI', 'Lean Six Sigma'],
      },
      {
        mode: 'job_targeting',
        targetingPlan,
      },
    )

    expect(directSkillClaim.blocked).toBe(true)
    expect(directSkillClaim.hardIssues).toContainEqual(expect.objectContaining({
      section: 'skills',
    }))
  })

  it('blocks unsupported gaps when they are declared as direct experience', () => {
    const result = validateRewrite(
      buildCvState(),
      {
        ...buildCvState(),
        summary: 'Profissional de dados com foco em BI, SQL e Airflow.',
      },
      {
        mode: 'job_targeting',
        targetingPlan: buildTargetingPlan({
          targetEvidence: [
            buildTargetEvidence({
              jobSignal: 'Airflow',
              canonicalSignal: 'Airflow',
              evidenceLevel: 'unsupported_gap',
              rewritePermission: 'must_not_claim',
              matchedResumeTerms: [],
              supportingResumeSpans: [],
              confidence: 0.95,
              allowedRewriteForms: [],
              forbiddenRewriteForms: ['Airflow'],
              validationSeverityIfViolated: 'critical',
            }),
          ],
          rewritePermissions: {
            directClaimsAllowed: [],
            normalizedClaimsAllowed: [],
            bridgeClaimsAllowed: [],
            relatedButNotClaimable: [],
            forbiddenClaims: ['Airflow'],
            skillsSurfaceAllowed: [],
          },
        }),
      },
    )

    expect(result.blocked).toBe(true)
    expect(result.hardIssues).toContainEqual(expect.objectContaining({
      message: expect.stringContaining('requisito sem suporte factual'),
    }))
  })

  it('blocks seniority inflation when a contextual inference is presented as mastery', () => {
    const result = validateRewrite(
      buildCvState(),
      {
        ...buildCvState(),
        summary: 'Especialista em enterprise sales com foco em grandes contas.',
      },
      {
        mode: 'job_targeting',
        targetingPlan: buildTargetingPlan({
          targetEvidence: [
            buildTargetEvidence({
              jobSignal: 'enterprise sales',
              canonicalSignal: 'enterprise sales',
              evidenceLevel: 'strong_contextual_inference',
              rewritePermission: 'can_bridge_carefully',
              matchedResumeTerms: ['vendas B2B', 'grandes contas'],
              supportingResumeSpans: ['Atuei com vendas B2B para grandes contas.'],
              confidence: 0.78,
              allowedRewriteForms: ['enterprise sales'],
              forbiddenRewriteForms: ['especialista em enterprise sales'],
              validationSeverityIfViolated: 'warning',
            }),
          ],
          rewritePermissions: {
            directClaimsAllowed: [],
            normalizedClaimsAllowed: [],
            bridgeClaimsAllowed: [{
              jobSignal: 'enterprise sales',
              safeBridge: 'Mencione apenas como experiencia relacionada a grandes contas.',
              doNotSay: ['especialista em enterprise sales'],
            }],
            relatedButNotClaimable: [],
            forbiddenClaims: [],
            skillsSurfaceAllowed: [],
          },
        }),
      },
    )

    expect(result.blocked).toBe(true)
    expect(result.hardIssues).toContainEqual(expect.objectContaining({
      issueType: 'seniority_inflation',
      message: expect.stringContaining('senioridade ou domínio não comprovado'),
    }))
  })

  it('still warns on unsupported target-role self-presentation when target evidence exists but no direct role claim is allowed', () => {
    const result = validateRewrite(
      buildCvState(),
      {
        ...buildCvState(),
        summary: 'Profissional de dados com foco em BI e SQL. Analytics Engineer com foco em automacao.',
      },
      {
        mode: 'job_targeting',
        targetingPlan: buildTargetingPlan({
          targetRole: 'Vaga Alvo',
          targetRoleConfidence: 'low',
          targetRoleSource: 'fallback',
          targetEvidence: [
            buildTargetEvidence({
              jobSignal: 'SQL',
              canonicalSignal: 'SQL',
              evidenceLevel: 'explicit',
              rewritePermission: 'can_claim_directly',
              matchedResumeTerms: ['SQL'],
              supportingResumeSpans: ['SQL'],
              confidence: 1,
              allowedRewriteForms: ['SQL'],
              forbiddenRewriteForms: [],
              validationSeverityIfViolated: 'none',
            }),
          ],
          rewritePermissions: {
            directClaimsAllowed: ['SQL'],
            normalizedClaimsAllowed: [],
            bridgeClaimsAllowed: [],
            relatedButNotClaimable: [],
            forbiddenClaims: [],
            skillsSurfaceAllowed: ['SQL'],
          },
        }),
      },
    )

    expect(result.blocked).toBe(false)
    expect(result.softWarnings).toContainEqual(expect.objectContaining({
      message: expect.stringContaining('cargo alvo'),
      section: 'summary',
    }))
  })

  it('still warns on unsupported summary-only skill claims when unrelated target evidence exists', () => {
    const result = validateRewrite(
      buildCvState(),
      {
        ...buildCvState(),
        summary: 'Profissional de dados com foco em BI, SQL e Airflow.',
      },
      {
        mode: 'job_targeting',
        targetingPlan: buildTargetingPlan({
          targetEvidence: [
            buildTargetEvidence({
              jobSignal: 'SQL',
              canonicalSignal: 'SQL',
              evidenceLevel: 'explicit',
              rewritePermission: 'can_claim_directly',
              matchedResumeTerms: ['SQL'],
              supportingResumeSpans: ['SQL'],
              confidence: 1,
              allowedRewriteForms: ['SQL'],
              forbiddenRewriteForms: [],
              validationSeverityIfViolated: 'none',
            }),
          ],
          rewritePermissions: {
            directClaimsAllowed: ['SQL'],
            normalizedClaimsAllowed: [],
            bridgeClaimsAllowed: [],
            relatedButNotClaimable: [],
            forbiddenClaims: [],
            skillsSurfaceAllowed: ['SQL'],
          },
        }),
      },
    )

    expect(result.softWarnings).toContainEqual(expect.objectContaining({
      message: expect.stringContaining('skill sem evid'),
      section: 'summary',
    }))
  })

  it('does not run job-targeting-only rules during ats enhancement mode', () => {
    const original = buildCvState()
    const optimized = {
      ...original,
      summary: 'Profissional de dados com foco em BI e SQL.',
    }

    const result = validateRewrite(original, optimized)

    expect(result.issues.some((issue) => issue.message.includes('cargo alvo'))).toBe(false)
    expect(result.issues.some((issue) => issue.message.includes('apagar gaps reais'))).toBe(false)
  })
})
