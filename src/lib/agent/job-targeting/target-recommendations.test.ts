import { describe, expect, it } from 'vitest'

import { buildTargetRecommendations } from '@/lib/agent/job-targeting/target-recommendations'
import type { CoreRequirement } from '@/types/agent'

function buildRequirement(overrides: Partial<CoreRequirement>): CoreRequirement {
  return {
    signal: 'DAX',
    importance: 'core',
    requirementKind: 'required',
    evidenceLevel: 'unsupported_gap',
    rewritePermission: 'must_not_claim',
    ...overrides,
  }
}

describe('buildTargetRecommendations', () => {
  it('creates a safe adjacent DAX recommendation from Power BI, dashboards, and SQL evidence', () => {
    const recommendations = buildTargetRecommendations({
      targetRole: 'Analista de BI',
      coreRequirements: [buildRequirement({ signal: 'DAX' })],
      preferredRequirements: [],
      supportedSignals: ['SQL'],
      adjacentSignals: ['Power BI', 'dashboards'],
      resumeSkillSignals: ['Power BI', 'SQL'],
    })

    expect(recommendations).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: 'adjacent_skill',
        jobRequirement: 'DAX',
        mustNotInvent: true,
      }),
    ]))
    expect(recommendations[0].suggestedUserAction).toMatch(/deixe isso expl[ií]cito/i)
    expect(recommendations[0].suggestedUserAction).toMatch(/DAX|Power Query|linguagem M/i)
    expect(recommendations[0].currentEvidence).toEqual(expect.arrayContaining([
      'Power BI',
      'SQL',
    ]))
  })

  it('does not use direct-order wording that would tell the user to invent a skill', () => {
    const [recommendation] = buildTargetRecommendations({
      coreRequirements: [buildRequirement({ signal: 'DAX' })],
      preferredRequirements: [],
      supportedSignals: ['SQL'],
      adjacentSignals: ['Power BI', 'dashboards'],
      resumeSkillSignals: ['Power BI', 'SQL'],
    })

    expect(recommendation.suggestedUserAction).not.toMatch(/^Adicione DAX/i)
    expect(recommendation.suggestedUserAction).not.toMatch(/^Coloque DAX/i)
    expect(recommendation.suggestedUserAction).toMatch(/Caso contr[aá]rio|fora/i)
  })

  it('normalizes verbose job requirement fragments into concise labels and copy', () => {
    const [recommendation] = buildTargetRecommendations({
      coreRequirements: [
        buildRequirement({
          signal: 'Também será responsável por identificar oportunidades de crescimento nas contas e estruturar propostas comerciais',
        }),
      ],
      preferredRequirements: [],
      supportedSignals: [],
      adjacentSignals: [],
      resumeSkillSignals: [],
    })

    expect(recommendation.jobRequirement).toBe('Identificação de oportunidades de crescimento nas contas e estruturação de propostas comerciais')
    expect(recommendation.suggestedUserAction).not.toMatch(/A vaga pede/i)
    expect(recommendation.suggestedUserAction).not.toContain('Também será responsável')
    expect(recommendation.safeExample).toBe('Se for verdadeiro: cite atividade, contexto e resultado real ligados a esse requisito.')
  })

  it('deduplicates narrower requirements covered by broader financial-accountability gaps', () => {
    const recommendations = buildTargetRecommendations({
      coreRequirements: [
        buildRequirement({ signal: 'Forecast e budget' }),
        buildRequirement({ signal: 'P&L, margem, faturamento, forecast e budget' }),
      ],
      preferredRequirements: [],
      supportedSignals: [],
      adjacentSignals: [],
      resumeSkillSignals: [],
    })

    expect(recommendations.map((recommendation) => recommendation.jobRequirement)).toEqual([
      'P&L, margem, faturamento, forecast e budget',
    ])
  })

  it('skips requirements that are already explicitly supported', () => {
    const recommendations = buildTargetRecommendations({
      coreRequirements: [
        buildRequirement({
          signal: 'SQL',
          evidenceLevel: 'explicit',
          rewritePermission: 'can_claim_directly',
        }),
      ],
      preferredRequirements: [],
      supportedSignals: ['SQL'],
      adjacentSignals: [],
      resumeSkillSignals: ['SQL'],
    })

    expect(recommendations).toEqual([])
  })
})
