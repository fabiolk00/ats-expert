import { describe, expect, it } from 'vitest'

import { buildAtsReadinessContractForEnhancement, buildBaselineAtsReadinessContract } from './index'
import { bandFromScore } from './display-score'

const BASE_CV = {
  fullName: 'Ana Silva',
  email: 'ana@example.com',
  phone: '555-0100',
  summary: 'Analista de dados com experiencia em SQL.',
  experience: [{
    title: 'Analista de Dados',
    company: 'Acme',
    startDate: '2022',
    endDate: 'present' as const,
    bullets: ['Criei dashboards semanais.'],
  }],
  skills: ['SQL', 'Power BI', 'Excel'],
  education: [{
    degree: 'Sistemas de Informacao',
    institution: 'USP',
    year: '2020',
  }],
}

describe('ATS readiness scoring contract', () => {
  it('builds a baseline displayed score from the raw internal score', () => {
    const contract = buildBaselineAtsReadinessContract({ cvState: BASE_CV })

    expect(contract.rawInternalScoreBefore).toBeGreaterThanOrEqual(0)
    expect(contract.displayedReadinessScoreBefore).toBe(contract.displayedReadinessScoreCurrent)
    expect(contract.displayedReadinessScoreAfter).toBeNull()
    expect(contract.scoreStatus).toBe('final')
  })

  it('keeps the raw internal score honest even when the displayed score is monotonic', () => {
    const contract = buildAtsReadinessContractForEnhancement({
      originalCvState: {
        ...BASE_CV,
        summary: 'Analista de dados com experiencia em SQL e ETL para analytics com foco em resultados de negocio.',
        experience: [{
          ...BASE_CV.experience[0],
          bullets: ['Implementei pipelines SQL e reduzi o tempo de fechamento em 30%.'],
        }],
      },
      optimizedCvState: {
        ...BASE_CV,
        summary: 'Analista de dados.',
      },
      rewriteValidation: {
        valid: true,
        issues: [],
      },
      optimizationSummary: {
        changedSections: ['summary'],
        notes: ['Resumo simplificado.'],
        keywordCoverageImprovement: ['SQL'],
      },
      previousContract: {
        ...buildBaselineAtsReadinessContract({
          cvState: {
            ...BASE_CV,
            summary: 'Analista de dados com experiencia em SQL e ETL para analytics com foco em resultados de negocio.',
            experience: [{
              ...BASE_CV.experience[0],
              bullets: ['Implementei pipelines SQL e reduzi o tempo de fechamento em 30%.'],
            }],
          },
        }),
        displayedReadinessScoreBefore: 91,
        displayedReadinessScoreCurrent: 91,
        displayedReadinessBandBefore: 'excellent',
        displayedReadinessBandCurrent: 'excellent',
      },
    })

    expect(contract.rawInternalScoreAfter).toBeLessThanOrEqual(contract.rawInternalScoreBefore)
    if (contract.displayedReadinessScoreAfter !== null) {
      expect(contract.displayedReadinessScoreAfter).toBeGreaterThanOrEqual(contract.displayedReadinessScoreBefore)
    }
  })

  it('forces a minimum displayed score of 89 and caps at 95 when gates pass', () => {
    const contract = buildAtsReadinessContractForEnhancement({
      originalCvState: BASE_CV,
      optimizedCvState: {
        ...BASE_CV,
        summary: 'Analista de dados com foco em SQL, BI e entrega de indicadores para decisao executiva com melhor clareza e contexto.',
        experience: [{
          ...BASE_CV.experience[0],
          bullets: ['Implementei dashboards em Power BI e reduzi o tempo de reporte em 25%.'],
        }],
        skills: ['SQL', 'Power BI', 'Excel', 'ETL'],
      },
      rewriteValidation: {
        valid: true,
        issues: [],
      },
      optimizationSummary: {
        changedSections: ['summary', 'experience', 'skills'],
        notes: ['Maior clareza e impacto.'],
        keywordCoverageImprovement: ['SQL', 'Power BI'],
      },
    })

    expect(contract.scoreStatus).toBe('final')
    expect(contract.displayedReadinessScoreAfter).not.toBeNull()
    expect(contract.displayedReadinessScoreAfter!).toBeGreaterThanOrEqual(89)
    expect(contract.displayedReadinessScoreAfter!).toBeLessThanOrEqual(95)
  })

  it('withholds the optimized displayed score when quality gates fail', () => {
    const contract = buildAtsReadinessContractForEnhancement({
      originalCvState: BASE_CV,
      optimizedCvState: {
        ...BASE_CV,
        summary: 'Resumo curto',
        education: [],
      },
      rewriteValidation: {
        valid: false,
        issues: [{ severity: 'high', message: 'Unsupported claims.', section: 'summary' }],
      },
      optimizationSummary: {
        changedSections: ['summary'],
        notes: ['Resumo alterado.'],
      },
    })

    expect(contract.scoreStatus).toBe('withheld_pending_quality')
    expect(contract.displayedReadinessScoreAfter).toBeNull()
    expect(contract.withholdReasons.length).toBeGreaterThan(0)
  })

  it('classifies low-confidence degraded input conservatively', () => {
    const contract = buildBaselineAtsReadinessContract({
      cvState: {
        fullName: 'Ana',
        email: '',
        phone: '',
        summary: '',
        experience: [],
        skills: [],
        education: [],
      },
    })

    expect(contract.rawInternalConfidence).toBe('low')
  })

  it('withholds optimized display when low-confidence input also regresses core internal signals', () => {
    const contract = buildAtsReadinessContractForEnhancement({
      originalCvState: {
        ...BASE_CV,
        summary: 'Analista de dados com experiencia em SQL, BI, ETL e comunicacao com liderancas para decisao.',
        experience: [{
          ...BASE_CV.experience[0],
          bullets: ['Implementei dashboards em Power BI e reduzi o tempo de reporte em 25%.'],
        }],
        skills: ['SQL', 'Power BI', 'ETL', 'Excel', 'Indicadores'],
      },
      optimizedCvState: {
        ...BASE_CV,
        summary: 'Analista.',
        experience: [{
          ...BASE_CV.experience[0],
          bullets: ['Atuei em analise.'],
        }],
        skills: ['SQL'],
      },
      rewriteValidation: {
        valid: true,
        issues: [],
      },
      optimizationSummary: {
        changedSections: ['summary', 'experience', 'skills'],
        notes: ['Versao curta.'],
      },
    })

    expect(contract.rawInternalConfidence).toBe('low')
    expect(contract.scoreStatus).toBe('withheld_pending_quality')
    expect(contract.withholdReasons).toContain('Low scoring confidence combined with contradictory internal ATS signals.')
  })

  it('maps readiness bands deterministically', () => {
    expect(bandFromScore(69)).toBe('needs_work')
    expect(bandFromScore(70)).toBe('borderline')
    expect(bandFromScore(80)).toBe('ats_ready')
    expect(bandFromScore(89)).toBe('excellent')
  })
})
