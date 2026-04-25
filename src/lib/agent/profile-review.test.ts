import { describe, expect, it } from 'vitest'

import { fingerprintJD } from './jd-fingerprint'
import {
  assessProfileAuditFindings,
  evaluateCareerFitRisk,
  buildCareerFitWarningText,
  requiresCareerFitWarning,
  requiresCareerFitOverrideConfirmation,
} from './profile-review'

function buildCareerFitSession(overrides?: {
  cvState?: Partial<{
    fullName: string
    email: string
    phone: string
    summary: string
    experience: Array<{
      title: string
      company: string
      startDate: string
      endDate: 'present'
      bullets: string[]
    }>
    skills: string[]
    education: unknown[]
  }>
  agentState?: Partial<{
    targetJobDescription: string
    gapAnalysis: {
      result: {
        matchScore: number
        missingSkills: string[]
        weakAreas: string[]
        improvementSuggestions: string[]
      }
      analyzedAt: string
    }
  }>
}) {
  return {
    cvState: {
      fullName: 'Ana Silva',
      email: 'ana@example.com',
      phone: '555-0100',
      summary: 'Backend engineer focused on Node.js APIs, PostgreSQL and integrations.',
      experience: [{
        title: 'Backend Engineer',
        company: 'Acme',
        startDate: '2022',
        endDate: 'present' as const,
        bullets: ['Built Node.js APIs and PostgreSQL services.'],
      }],
      skills: ['Node.js', 'PostgreSQL', 'TypeScript'],
      education: [],
      ...overrides?.cvState,
    },
    agentState: {
      parseStatus: 'parsed' as const,
      rewriteHistory: {},
      sourceResumeText: 'Backend engineer with Node.js and PostgreSQL experience.',
      targetJobDescription: 'Analytics engineer role with SQL, dbt and BI ownership.',
      gapAnalysis: {
        result: {
          matchScore: 60,
          missingSkills: ['dbt'],
          weakAreas: [],
          improvementSuggestions: ['Highlight analytics ownership more explicitly.'],
        },
        analyzedAt: '2026-04-12T12:00:00.000Z',
      },
      ...overrides?.agentState,
    },
  }
}

describe('profile review', () => {
  it('flags the main ATS and recruiter weaknesses in incomplete profiles', () => {
    const findings = assessProfileAuditFindings({
      fullName: 'Ana Silva',
      email: '',
      phone: '',
      summary: 'Analista de dados',
      experience: [],
      skills: ['SQL'],
      education: [],
    })

    expect(findings.map((finding) => finding.key)).toEqual(
      expect.arrayContaining(['contact', 'summary', 'experience', 'skills']),
    )
  })

  it('classifies an adjacent BI to growth analytics target as medium risk without explicit confirmation', () => {
    const session = {
      cvState: {
        fullName: 'Ana Silva',
        email: 'ana@example.com',
        phone: '555-0100',
        summary: 'Analista de BI com foco em Power BI, SQL e analytics para tomada de decisão.',
        experience: [{
          title: 'BI Analyst',
          company: 'Acme',
          startDate: '2023',
          endDate: 'present' as const,
          bullets: ['Built dashboards in Power BI and automated SQL reporting for commercial stakeholders.'],
        }],
        skills: ['Power BI', 'SQL', 'ETL'],
        education: [],
      },
      agentState: {
        parseStatus: 'parsed' as const,
        rewriteHistory: {},
        sourceResumeText: 'Analista de BI com foco em Power BI, SQL e ETL.',
        targetJobDescription: 'Growth marketing role with CRM optimization, SEO reporting and paid media ownership.',
        gapAnalysis: {
          result: {
            matchScore: 52,
            missingSkills: ['SEO', 'CRM'],
            weakAreas: ['summary', 'experience'],
            improvementSuggestions: ['Connect analytics outcomes to marketing funnel goals.'],
          },
          analyzedAt: '2026-04-12T12:00:00.000Z',
        },
      },
    }

    const evaluation = evaluateCareerFitRisk(session as never)

    expect(evaluation).toMatchObject({
      riskLevel: 'medium',
      needsExplicitConfirmation: false,
      riskPoints: 5,
      signals: expect.objectContaining({
        familyDistance: 'adjacent',
        matchScore: 52,
        missingSkillsCount: 2,
        weakAreasCount: 2,
        seniorityGapMajor: false,
      }),
    })
    expect(requiresCareerFitWarning(session as never)).toBe(true)
    expect(requiresCareerFitOverrideConfirmation(session as never)).toBe(false)
    expect(buildCareerFitWarningText(evaluation as never)).toContain('[Atenção]')
  })

  it('classifies a distant seniority jump as high risk and requires explicit confirmation after warning', () => {
    const targetJobDescription = 'Senior Product Designer role owning UX research, Figma systems and end-to-end product design.'
    const session = {
      cvState: {
        fullName: 'Carlos Souza',
        email: 'carlos@example.com',
        phone: '555-0200',
        summary: 'Analista de BI junior com foco em SQL, Power BI e ETL.',
        experience: [{
          title: 'BI Analyst Jr',
          company: 'Acme',
          startDate: '2024',
          endDate: 'present' as const,
          bullets: ['Built SQL reports and BI dashboards for operations.'],
        }],
        skills: ['SQL', 'Power BI', 'ETL'],
        education: [],
      },
      agentState: {
        parseStatus: 'parsed' as const,
        rewriteHistory: {},
        sourceResumeText: 'Analista de BI junior com foco em dashboards e ETL.',
        targetJobDescription,
        gapAnalysis: {
          result: {
            matchScore: 35,
            missingSkills: ['Figma', 'UX Research', 'Wireframing', 'Prototyping', 'Design Systems', 'Accessibility'],
            weakAreas: ['summary', 'experience', 'portfolio', 'skills', 'leadership'],
            improvementSuggestions: ['Build a design portfolio before targeting senior product design roles.'],
          },
          analyzedAt: '2026-04-12T12:00:00.000Z',
        },
        phaseMeta: {
          careerFitWarningIssuedAt: '2026-04-12T12:05:00.000Z',
          careerFitRiskLevelAtWarning: 'high' as const,
          careerFitWarningJDFingerprint: fingerprintJD(targetJobDescription),
          careerFitWarningTargetJobDescription: targetJobDescription,
        },
      },
    }

    const evaluation = evaluateCareerFitRisk(session as never)
    ;(session.agentState as { careerFitEvaluation?: unknown }).careerFitEvaluation = evaluation

    expect(evaluation).toMatchObject({
      riskLevel: 'high',
      needsExplicitConfirmation: true,
      signals: expect.objectContaining({
        familyDistance: 'distant',
        matchScore: 35,
        seniorityGapMajor: true,
      }),
    })
    expect(requiresCareerFitWarning(session as never)).toBe(true)
    expect(requiresCareerFitOverrideConfirmation(session as never)).toBe(true)
    expect(buildCareerFitWarningText(evaluation as never)).toContain('[Aviso]')
  })

  it('classifies a strong aligned target as low risk', () => {
    const session = {
      cvState: {
        fullName: 'Mariana Lima',
        email: 'mariana@example.com',
        phone: '555-0300',
        summary: 'Backend engineer focused on Node.js APIs, PostgreSQL and distributed systems.',
        experience: [{
          title: 'Backend Engineer',
          company: 'Acme',
          startDate: '2022',
          endDate: 'present' as const,
          bullets: ['Built Node.js APIs and PostgreSQL data pipelines for fintech products.'],
        }],
        skills: ['Node.js', 'PostgreSQL', 'TypeScript'],
        education: [],
      },
      agentState: {
        parseStatus: 'parsed' as const,
        rewriteHistory: {},
        sourceResumeText: 'Backend engineer with Node.js and PostgreSQL experience.',
        targetJobDescription: 'Backend engineer role building Node.js APIs, PostgreSQL services and integrations.',
        gapAnalysis: {
          result: {
            matchScore: 76,
            missingSkills: ['GraphQL'],
            weakAreas: [],
            improvementSuggestions: ['Highlight API ownership more explicitly.'],
          },
          analyzedAt: '2026-04-12T12:00:00.000Z',
        },
      },
    }

    const evaluation = evaluateCareerFitRisk(session as never)

    expect(evaluation).toMatchObject({
      riskLevel: 'low',
      needsExplicitConfirmation: false,
      riskPoints: 0,
      signals: expect.objectContaining({
        familyDistance: 'same',
        matchScore: 76,
        missingSkillsCount: 1,
        weakAreasCount: 0,
      }),
    })
    expect(requiresCareerFitWarning(session as never)).toBe(false)
  })

  it('should add zero riskPoints for unknown familyDistance', () => {
    const result = evaluateCareerFitRisk(buildCareerFitSession({
      agentState: {
        targetJobDescription: 'Operations role focused on stakeholder routines and process coordination.',
        gapAnalysis: {
          result: {
            matchScore: 50,
            missingSkills: ['Process mapping', 'Stakeholder communication'],
            weakAreas: ['summary', 'experience'],
            improvementSuggestions: ['Connect existing backend work to operational routines.'],
          },
          analyzedAt: '2026-04-12T12:00:00.000Z',
        },
      },
    }) as never)

    expect(result?.signals.familyDistance).toBe('unknown')
    expect(result?.riskPoints).toBe(4)
    expect(result?.riskLevel).toBe('medium')
    expect(result?.needsExplicitConfirmation).toBe(false)
  })

  it('should not reduce riskPoints when matchScore < 55 even if familyDistance is adjacent', () => {
    const result = evaluateCareerFitRisk(buildCareerFitSession({
      agentState: {
        targetJobDescription: 'Analytics engineer role with SQL, dbt, BI and data modeling ownership.',
        gapAnalysis: {
          result: {
            matchScore: 48,
            missingSkills: ['dbt', 'Looker'],
            weakAreas: ['summary', 'experience'],
            improvementSuggestions: ['Connect backend APIs to analytics delivery outcomes.'],
          },
          analyzedAt: '2026-04-12T12:00:00.000Z',
        },
      },
    }) as never)

    expect(result?.signals.familyDistance).toBe('adjacent')
    expect(result?.riskPoints).toBe(5)
  })

  it('should not reduce riskPoints when missingSkills > 3 even with high matchScore', () => {
    const result = evaluateCareerFitRisk(buildCareerFitSession({
      agentState: {
        targetJobDescription: 'Analytics engineer role with SQL, dbt, BI and data modeling ownership.',
        gapAnalysis: {
          result: {
            matchScore: 60,
            missingSkills: ['dbt', 'Looker', 'Airflow', 'BigQuery', 'Dimensional modeling'],
            weakAreas: ['summary'],
            improvementSuggestions: ['Highlight analytical stack depth before targeting this role.'],
          },
          analyzedAt: '2026-04-12T12:00:00.000Z',
        },
      },
    }) as never)

    expect(result?.signals.familyDistance).toBe('adjacent')
    expect(result?.riskPoints).toBe(4)
  })
})
