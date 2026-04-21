import { describe, expect, it } from 'vitest'

import type { CVState } from '@/types/cv'

import { shapeRewriteCurrentContent } from './ats-enhancement-retry'

function buildCvState(): CVState {
  return {
    fullName: 'Fábio Kröker',
    email: 'fabio@example.com',
    phone: '555-0100',
    summary: 'Resumo',
    experience: [{
      title: 'Senior Business Intelligence',
      company: 'Grupo Positivo',
      startDate: '2025',
      endDate: 'present',
      bullets: [
        'Atuei com dashboards executivos para acompanhamento operacional.',
        'Aumentei em 15% os indicadores de qualidade de produção na LATAM com dashboards e governança analítica.',
        'Organizei rotinas de dados para times internos.',
        'Apoiei análises recorrentes para stakeholders.',
        'Reduzi em 40% o tempo de processamento de relatórios críticos para a operação regional.',
      ],
    }],
    skills: ['SQL', 'Power BI'],
    education: [],
    certifications: [],
  }
}

describe('shapeRewriteCurrentContent', () => {
  it('keeps premium quantified bullets when compacting experience payloads', () => {
    const { content, compacted } = shapeRewriteCurrentContent(buildCvState(), 'experience')
    const parsed = JSON.parse(content) as Array<{ bullets: string[] }>

    expect(compacted).toBe(true)
    expect(parsed[0].bullets).toContain(
      'Aumentei em 15% os indicadores de qualidade de produção na LATAM com dashboards e governança analítica.',
    )
    expect(parsed[0].bullets).toContain(
      'Reduzi em 40% o tempo de processamento de relatórios críticos para a operação regional.',
    )
    expect(parsed[0].bullets).not.toContain(
      'Apoiei análises recorrentes para stakeholders.',
    )
  })
})
