import { describe, expect, it } from 'vitest'

import { buildTargetingPlan } from '@/lib/agent/tools/build-targeting-plan'
import type { CVState, GapAnalysisResult } from '@/types/cv'

function buildCvState(): CVState {
  return {
    fullName: 'Ana Silva',
    email: 'ana@example.com',
    phone: '555-0100',
    summary: 'Engenheira de dados com foco em SQL e automacao.',
    experience: [
      {
        title: 'Engenheira de Dados',
        company: 'Acme',
        startDate: '2022',
        endDate: '2024',
        bullets: ['Automatizei pipelines em SQL e Python.'],
      },
    ],
    skills: ['SQL', 'Python', 'ETL'],
    education: [],
    certifications: [],
  }
}

const gapAnalysis: GapAnalysisResult = {
  matchScore: 72,
  missingSkills: ['Airflow'],
  weakAreas: ['summary'],
  improvementSuggestions: ['Aproxime o resumo da vaga sem inventar experiencia.'],
}

describe('buildTargetingPlan', () => {
  it('extracts a role from prose instead of promoting section headings', () => {
    const plan = buildTargetingPlan({
      cvState: buildCvState(),
      targetJobDescription: [
        'Requisitos Obrigatórios',
        'SQL avançado e modelagem de dados.',
        'Estamos contratando uma pessoa Engenheira de Dados para atuar com pipelines e analytics.',
      ].join('\n'),
      gapAnalysis,
    })

    expect(plan.targetRole).toBe('Engenheira De Dados')
  })

  it('preserves explicit role labels when present', () => {
    const plan = buildTargetingPlan({
      cvState: buildCvState(),
      targetJobDescription: [
        'Cargo: Analytics Engineer',
        'Requisitos Obrigatórios',
        'SQL e BigQuery.',
      ].join('\n'),
      gapAnalysis,
    })

    expect(plan.targetRole).toBe('Analytics Engineer')
  })

  it('does not treat weak areas as invented missing requirements', () => {
    const plan = buildTargetingPlan({
      cvState: buildCvState(),
      targetJobDescription: 'Cargo: Analytics Engineer',
      gapAnalysis: {
        ...gapAnalysis,
        missingSkills: ['Airflow'],
        weakAreas: ['summary', 'experience'],
      },
    })

    expect(plan.missingButCannotInvent).toEqual(['Airflow'])
  })
})
