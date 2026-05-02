import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { decomposeJobRequirements } from '@/lib/agent/job-targeting/compatibility/requirement-decomposition'

describe('requirement decomposition', () => {
  it('extracts generic requirements from sections and list items', () => {
    const requirements = decomposeJobRequirements(`
      Required qualifications:
      - Strong written communication
      - Experience leading recurring planning routines

      Preferred qualifications:
      - Formal education in a related field

      Responsibilities:
      - Coordinate cross-functional delivery
    `)

    expect(requirements).toHaveLength(4)
    expect(requirements).toEqual([
      expect.objectContaining({
        text: 'Strong written communication',
        normalizedText: 'strong written communication',
        kind: 'skill',
        importance: 'core',
        scoreDimension: 'skills',
        source: expect.objectContaining({
          section: 'required qualifications',
          heading: 'Required qualifications',
          sourceKind: 'list_item',
          listIndex: 0,
        }),
      }),
      expect.objectContaining({
        text: 'Experience leading recurring planning routines',
        kind: 'responsibility',
        importance: 'core',
        scoreDimension: 'experience',
        source: expect.objectContaining({
          section: 'required qualifications',
          sourceKind: 'list_item',
          listIndex: 1,
        }),
      }),
      expect.objectContaining({
        text: 'Formal education in a related field',
        kind: 'education',
        importance: 'differential',
        scoreDimension: 'education',
        source: expect.objectContaining({
          section: 'preferred qualifications',
          sourceKind: 'list_item',
        }),
      }),
      expect.objectContaining({
        text: 'Coordinate cross-functional delivery',
        kind: 'responsibility',
        importance: 'secondary',
        scoreDimension: 'experience',
        source: expect.objectContaining({
          section: 'responsibilities',
          sourceKind: 'list_item',
        }),
      }),
    ])
  })

  it('decomposes sentence requirements and composite lists without catalog assumptions', () => {
    const requirements = decomposeJobRequirements(
      'Must have clear communication, structured planning, and measurable delivery outcomes. Nice to have: group facilitation.',
    )

    expect(requirements.map((requirement) => requirement.text)).toEqual([
      'Clear communication',
      'Structured planning',
      'Measurable delivery outcomes',
      'Group facilitation',
    ])
    expect(requirements.slice(0, 3).every((requirement) => requirement.importance === 'core')).toBe(true)
    expect(requirements[3]).toEqual(expect.objectContaining({
      importance: 'differential',
      source: expect.objectContaining({ sourceKind: 'sentence' }),
    }))
  })

  it('keeps compatibility runtime free from fixture-specific domain hardcodes', () => {
    const runtimeSources = [
      'src/lib/agent/job-targeting/compatibility/requirement-decomposition.ts',
      'src/lib/agent/job-targeting/compatibility/evidence-extraction.ts',
    ].map((filePath) => readFileSync(filePath, 'utf8'))
    const forbiddenRuntimeExamples = [
      /Power\s*BI/i,
      /Power\s*Query/i,
      /Totvs/i,
      /Java/i,
      /Salesforce/i,
      /SAP/i,
      /Google\s*Ads/i,
      /Excel/i,
      /Tableau/i,
      /HubSpot/i,
      /AutoCAD/i,
      /\bCRM\b/i,
      /\bERP\b/i,
    ]

    runtimeSources.forEach((source) => {
      forbiddenRuntimeExamples.forEach((pattern) => {
        expect(source).not.toMatch(pattern)
      })
    })
  })
})
