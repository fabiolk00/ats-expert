import { describe, expect, it } from 'vitest'

import type { CVState } from '@/types/cv'

import {
  countPreservedMetricImpactBullets,
  findMetricImpactRegressions,
  isHighValueMetricBullet,
  scoreMetricImpactBulletPriority,
} from './metric-impact-guard'

function buildCvState(bullet: string): CVState {
  return {
    fullName: 'Fábio Kröker',
    email: 'fabio@example.com',
    phone: '555-0100',
    summary: 'Engenheiro de Dados com foco em BI e analytics.',
    experience: [{
      title: 'Senior Business Intelligence',
      company: 'Grupo Positivo',
      startDate: '2025',
      endDate: 'present',
      bullets: [bullet],
    }],
    skills: ['SQL', 'Power BI', 'Databricks'],
    education: [],
    certifications: [],
  }
}

describe('metric impact guard', () => {
  it('detects premium bullets with percentage-based impact', () => {
    expect(
      isHighValueMetricBullet('Aumentei em 15% os indicadores de qualidade de produção na LATAM com dashboards em Power BI.'),
    ).toBe(true)
  })

  it('detects premium bullets with absolute volumes and throughput context', () => {
    expect(
      isHighValueMetricBullet('Processei 12 mil registros por hora, reduzindo gargalos de throughput em pipelines críticos.'),
    ).toBe(true)
  })

  it('prioritizes technology plus metric bullets above generic bullets', () => {
    const premiumScore = scoreMetricImpactBulletPriority(
      'Reduzi em 40% o tempo de processamento com PySpark e Databricks em pipelines regionais.',
    )
    const genericScore = scoreMetricImpactBulletPriority(
      'Atuei em projetos de dados e dashboards para o time.',
    )

    expect(premiumScore).toBeGreaterThan(genericScore)
  })

  it('counts preserved premium bullets when the optimized rewrite keeps the real metric and scope', () => {
    const original = buildCvState(
      'Aumentei em 15% os indicadores de qualidade de produção na LATAM com dashboards em Power BI.',
    )
    const optimized = buildCvState(
      'Liderei dashboards em Power BI, contribuindo para aumento de 15% nos indicadores de qualidade de produção na LATAM.',
    )

    expect(countPreservedMetricImpactBullets(original, optimized)).toBe(1)
    expect(findMetricImpactRegressions(original, optimized)).toEqual([])
  })

  it('flags regression when a quantified impact bullet becomes generic', () => {
    const original = buildCvState(
      'Aumentei em 15% os indicadores de qualidade de produção na LATAM com dashboards em Power BI.',
    )
    const optimized = buildCvState(
      'Atuei em dashboards estratégicos para qualidade e acompanhamento operacional.',
    )

    expect(findMetricImpactRegressions(original, optimized)).toHaveLength(1)
  })
})
