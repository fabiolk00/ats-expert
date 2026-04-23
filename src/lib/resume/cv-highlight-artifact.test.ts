import { describe, expect, it } from 'vitest'

import {
  buildExperienceBulletHighlightItemIds,
  CV_HIGHLIGHT_ARTIFACT_VERSION,
  createExperienceBulletHighlightItemId,
  createSummaryHighlightItemId,
  flattenCvStateForHighlight,
  getHighlightRangesForItem,
  isEditoriallyAcceptableHighlightRange,
  normalizeCvHighlightState,
  normalizeHighlightRangesForSegmentation,
  normalizeHighlightSpanBoundaries,
  segmentTextByHighlightRanges,
  validateAndResolveHighlights,
} from './cv-highlight-artifact'
import type { CVState } from '@/types/cv'
import type { CvHighlightReason } from './cv-highlight-artifact'

function buildCvState(overrides: Partial<CVState> = {}): CVState {
  return {
    fullName: 'Fabio Silva',
    email: 'fabio@example.com',
    phone: '11999999999',
    summary: 'Senior data engineer focused on BI modernization.',
    experience: [
      {
        title: 'Senior BI Engineer',
        company: 'ACME',
        startDate: '2022',
        endDate: 'present',
        bullets: [
          'Led Azure Databricks pipelines that reduced processing time by 40%.',
          '',
          'Built executive dashboards for regional stakeholders.',
        ],
      },
    ],
    skills: ['SQL', 'Python'],
    education: [],
    ...overrides,
  }
}

function buildRange(
  text: string,
  fragment: string,
  reason: CvHighlightReason = 'tool_context',
) {
  const start = text.indexOf(fragment)
  if (start < 0) {
    throw new Error(`Fragment not found: ${fragment}`)
  }

  return {
    start,
    end: start + fragment.length,
    reason,
  }
}

describe('cv highlight artifact helpers', () => {
  it('emits summary_0 when summary is present', () => {
    const items = flattenCvStateForHighlight(buildCvState())

    expect(items[0]).toEqual({
      itemId: createSummaryHighlightItemId(),
      section: 'summary',
      text: 'Senior data engineer focused on BI modernization.',
    })
  })

  it('ignores empty summary values', () => {
    const items = flattenCvStateForHighlight(buildCvState({ summary: '   ' }))

    expect(items.some((item) => item.section === 'summary')).toBe(false)
  })

  it('emits stable experience bullet ids and ignores empty bullets', () => {
    const items = flattenCvStateForHighlight(buildCvState())
    const experience = buildCvState().experience[0]
    const bulletItemIds = buildExperienceBulletHighlightItemIds(experience)

    expect(items).toEqual([
      {
        itemId: 'summary_0',
        section: 'summary',
        text: 'Senior data engineer focused on BI modernization.',
      },
      {
        itemId: bulletItemIds[0],
        section: 'experience',
        experienceIndex: 0,
        bulletIndex: 0,
        text: 'Led Azure Databricks pipelines that reduced processing time by 40%.',
      },
      {
        itemId: bulletItemIds[2],
        section: 'experience',
        experienceIndex: 0,
        bulletIndex: 2,
        text: 'Built executive dashboards for regional stakeholders.',
      },
    ])
  })

  it('drops invalid highlight entries and ranges', () => {
    const items = flattenCvStateForHighlight(buildCvState())
    const summaryText = items[0].text
    const result = validateAndResolveHighlights(items, [
      {
        itemId: 'missing_item',
        ranges: [{ start: 0, end: 5, reason: 'ats_strength' }],
      },
      {
        itemId: 'summary_0',
        ranges: [
          { start: -1, end: 5, reason: 'ats_strength' },
          { start: 0, end: 6, reason: 'ats_strength' },
          buildRange(summaryText, 'focused'),
          { start: 10, end: 10, reason: 'ats_strength' },
        ],
      },
    ])

    expect(result).toEqual([
      {
        itemId: 'summary_0',
        section: 'summary',
        ranges: [
          { start: 0, end: 6, reason: 'ats_strength' },
          buildRange(summaryText, 'focused'),
        ],
      },
    ])
  })

  it('returns no highlight item when no valid ranges remain', () => {
    const items = flattenCvStateForHighlight(buildCvState())

    expect(validateAndResolveHighlights(items, [
      {
        itemId: 'summary_0',
        ranges: [{ start: -1, end: 0, reason: 'ats_strength' }],
      },
    ])).toEqual([])
  })

  it('merges duplicate detector entries for the same item id', () => {
    const items = flattenCvStateForHighlight(buildCvState())

    expect(validateAndResolveHighlights(items, [
      {
        itemId: 'summary_0',
        ranges: [{ start: 0, end: 6, reason: 'ats_strength' }],
      },
      {
        itemId: 'summary_0',
        ranges: [{ start: 7, end: 15, reason: 'business_impact' }],
      },
    ])).toEqual([{
      itemId: 'summary_0',
      section: 'summary',
      ranges: [
        { start: 0, end: 6, reason: 'ats_strength' },
        { start: 7, end: 20, reason: 'business_impact' },
      ],
    }])
  })

  it('segments text without mutating non-highlighted content', () => {
    const text = 'Reduced processing time by 40% with Azure Databricks.'
    const segments = segmentTextByHighlightRanges(text, [
      { start: 0, end: 27, reason: 'metric_impact' },
      { start: 33, end: 50, reason: 'tool_context' },
    ])

    expect(segments).toEqual([
      { text: 'Reduced processing time by', highlighted: true, reason: 'metric_impact' },
      { text: ' 40% ', highlighted: false },
      { text: 'with Azure Databricks', highlighted: true, reason: 'tool_context' },
      { text: '.', highlighted: false },
    ])
  })

  it('keeps adjacent ranges highlighted without creating an artificial plain gap', () => {
    const text = 'Improved latency 40%'
    const segments = segmentTextByHighlightRanges(text, [
      { start: 0, end: 8, reason: 'action_result' },
      { start: 8, end: text.length, reason: 'metric_impact' },
    ])

    expect(segments).toEqual([
      { text: 'Improved', highlighted: true, reason: 'action_result' },
      { text: ' ', highlighted: false },
      { text: 'latency 40%', highlighted: true, reason: 'metric_impact' },
    ])
    expect(segments.map((segment) => segment.text).join('')).toBe(text)
  })

  it('normalizes unsorted, duplicate, overlapping, and out-of-bounds ranges before segmentation', () => {
    const text = 'Reduced processing time by 40% with Azure Databricks.'
    const segments = segmentTextByHighlightRanges(text, [
      { start: 33, end: 1000, reason: 'tool_context' },
      { start: 0, end: 27, reason: 'metric_impact' },
      { start: 24, end: 40, reason: 'business_impact' },
      { start: 0, end: 27, reason: 'metric_impact' },
      { start: -5, end: 4, reason: 'ats_strength' },
    ])

    expect(segments.map((segment) => segment.text).join('')).toBe(text)
    expect(segments).toEqual([
      { text: 'Reduced processing time by 40% with Azure Databricks', highlighted: true, reason: 'ats_strength' },
      { text: '.', highlighted: false },
    ])
  })

  it('uses semantic bullet ids that remain stable across reorder and index shifts', () => {
    const experience = buildCvState().experience[0]
    const reorderedExperience = {
      ...experience,
      bullets: [
        experience.bullets[2],
        experience.bullets[0],
      ],
    }
    const shiftedExperience = {
      ...experience,
      bullets: [
        'Introduced a new bullet before the original ones.',
        experience.bullets[0],
        experience.bullets[2],
      ],
    }

    const baseId = createExperienceBulletHighlightItemId(experience, experience.bullets[0])
    const reorderedId = createExperienceBulletHighlightItemId(reorderedExperience, reorderedExperience.bullets[1])
    const shiftedId = createExperienceBulletHighlightItemId(shiftedExperience, shiftedExperience.bullets[1])

    expect(baseId).toBe(reorderedId)
    expect(baseId).toBe(shiftedId)
  })

  it('changes bullet ids when semantic ownership or bullet text changes', () => {
    const experience = buildCvState().experience[0]
    const changedBulletTextId = createExperienceBulletHighlightItemId(
      experience,
      'Led Azure Databricks pipelines that reduced processing time by 55%.',
    )
    const changedCompanyId = createExperienceBulletHighlightItemId(
      { ...experience, company: 'Different Co' },
      experience.bullets[0],
    )

    expect(createExperienceBulletHighlightItemId(experience, experience.bullets[0])).not.toBe(changedBulletTextId)
    expect(createExperienceBulletHighlightItemId(experience, experience.bullets[0])).not.toBe(changedCompanyId)
  })

  it('creates unique semantic ids for duplicate bullets within the same experience', () => {
    const experience = {
      ...buildCvState().experience[0],
      bullets: ['Reduced costs 40%.', 'Reduced costs 40%.'],
    }

    expect(buildExperienceBulletHighlightItemIds(experience)).toEqual([
      expect.any(String),
      expect.any(String),
    ])
    expect(buildExperienceBulletHighlightItemIds(experience)[0]).not.toBe(buildExperienceBulletHighlightItemIds(experience)[1])
  })

  it('rejects summary and long bullet ranges that exceed editorial coverage thresholds', () => {
    const summary = 'Senior data engineer focused on BI modernization and executive reporting across LATAM.'
    const longBullet = 'Led Azure Databricks pipelines that reduced processing time by 40% with governance, orchestration, and stakeholder reporting.'

    expect(isEditoriallyAcceptableHighlightRange(summary, {
      start: 0,
      end: Math.floor(summary.length * 0.75),
      reason: 'ats_strength',
    }, 'summary')).toBe(false)

    expect(isEditoriallyAcceptableHighlightRange(longBullet, {
      start: 0,
      end: longBullet.length,
      reason: 'metric_impact',
    }, 'experience')).toBe(false)
  })

  it('allows compact measurable full-bullet highlights only for short experience bullets', () => {
    const compactBullet = 'Reduced costs 40% in LATAM.'

    expect(isEditoriallyAcceptableHighlightRange(compactBullet, {
      start: 0,
      end: compactBullet.length,
      reason: 'metric_impact',
    }, 'experience')).toBe(true)
  })

  it('returns matching ranges for an item or an empty array', () => {
    const resolved = [
      {
        itemId: 'summary_0',
        section: 'summary' as const,
        ranges: [{ start: 0, end: 6, reason: 'ats_strength' as const }],
      },
    ]

    expect(getHighlightRangesForItem(resolved, 'summary_0')).toEqual([
      { start: 0, end: 6, reason: 'ats_strength' },
    ])
    expect(getHighlightRangesForItem(resolved, 'exp_0_bullet_0')).toEqual([])
  })

  it('normalizes valid persisted highlight state and rejects invalid shapes', () => {
    expect(normalizeCvHighlightState({
      source: 'rewritten_cv_state',
      version: CV_HIGHLIGHT_ARTIFACT_VERSION,
      generatedAt: '2026-04-22T12:00:00.000Z',
      resolvedHighlights: [{
        itemId: 'summary_0',
        section: 'summary',
        ranges: [{ start: 0, end: 6, reason: 'ats_strength' }],
      }],
    })).toEqual({
      source: 'rewritten_cv_state',
      version: CV_HIGHLIGHT_ARTIFACT_VERSION,
      generatedAt: '2026-04-22T12:00:00.000Z',
      resolvedHighlights: [{
        itemId: 'summary_0',
        section: 'summary',
        ranges: [{ start: 0, end: 6, reason: 'ats_strength' }],
      }],
    })

    expect(normalizeCvHighlightState({
      source: 'rewritten_cv_state',
      version: 1,
      resolvedHighlights: [],
      generatedAt: '2026-04-22T12:00:00.000Z',
    })).toBeUndefined()
  })

  it('extends slash-separated technical phrases to a complete local term', () => {
    const text = 'Improved CI/CD reliability for weekly releases.'
    const range = normalizeHighlightSpanBoundaries(
      text,
      buildRange(text, 'CI'),
    )

    expect(range).not.toBeNull()
    expect(text.slice(range!.start, range!.end)).toBe('CI/CD')
  })

  it('preserves a leading currency symbol as meaningful span content', () => {
    const text = 'Generated $2.4M in annual savings for the operation.'
    const range = normalizeHighlightSpanBoundaries(
      text,
      buildRange(text, '2.4M in annual savings', 'metric_impact'),
    )

    expect(range).not.toBeNull()
    expect(text.slice(range!.start, range!.end)).toBe('$2.4M in annual savings')
  })

  it('expands across a short comma-separated continuation when the phrase stays compact', () => {
    const text = 'Built Power BI dashboards, executive reporting.'
    const range = normalizeHighlightSpanBoundaries(
      text,
      buildRange(text, 'Power BI dashboards'),
    )

    expect(range).not.toBeNull()
    expect(text.slice(range!.start, range!.end)).toBe('Power BI dashboards, executive reporting')
  })

  it('does not expand across a real clause break after a comma', () => {
    const text = 'Reduced latency by 40%, while mentoring the team.'
    const range = normalizeHighlightSpanBoundaries(
      text,
      buildRange(text, 'Reduced latency by 40%', 'metric_impact'),
    )

    expect(range).not.toBeNull()
    expect(text.slice(range!.start, range!.end)).toBe('Reduced latency by 40%')
  })

  it('expands compact metric follow-ups after a colon', () => {
    const text = 'Savings: $2.4M annualized.'
    const range = normalizeHighlightSpanBoundaries(
      text,
      buildRange(text, 'Savings', 'business_impact'),
    )

    expect(range).not.toBeNull()
    expect(text.slice(range!.start, range!.end)).toBe('Savings: $2.4M annualized')
  })

  it('keeps parenthetical technical content readable instead of truncating mid-token', () => {
    const text = 'Built governance workflows (Azure Databricks).'
    const range = normalizeHighlightSpanBoundaries(
      text,
      buildRange(text, 'Azure Databrick'),
    )

    expect(range).not.toBeNull()
    expect(text.slice(range!.start, range!.end)).toBe('Azure Databricks')
  })

  it('keeps balanced parenthetical continuations intact when expanding across an opening wrapper', () => {
    const text = 'Built governance workflows (Azure Databricks).'
    const range = normalizeHighlightSpanBoundaries(
      text,
      buildRange(text, 'governance workflows'),
    )

    expect(range).not.toBeNull()
    expect(text.slice(range!.start, range!.end)).toBe('governance workflows (Azure Databricks)')
  })

  it('merges same-reason ranges across ignorable punctuation gaps without crossing a pipe', () => {
    const text = 'Power BI dashboards, executive reporting'
    const ranges = normalizeHighlightRangesForSegmentation(text, [
      buildRange(text, 'Power BI dashboards'),
      buildRange(text, 'executive reporting'),
    ])

    expect(ranges).toEqual([
      buildRange(text, 'Power BI dashboards, executive reporting'),
    ])
  })

  it('drops weak pipe-separated stack atoms instead of preserving noisy micro-spans', () => {
    const text = 'Python | SQL | dbt | Airflow'
    const items = [{
      itemId: 'exp_pipe_stack',
      section: 'experience' as const,
      text,
    }]

    expect(validateAndResolveHighlights(items, [{
      itemId: 'exp_pipe_stack',
      ranges: [buildRange(text, 'SQL')],
    }])).toEqual([])
  })

  it('drops weak pipe-separated stack atoms even when the flat list includes numeric tokens', () => {
    const text = 'Python | SQL | dbt | ISO 27001'
    const items = [{
      itemId: 'exp_pipe_stack_numeric',
      section: 'experience' as const,
      text,
    }]

    expect(validateAndResolveHighlights(items, [{
      itemId: 'exp_pipe_stack_numeric',
      ranges: [buildRange(text, 'SQL')],
    }])).toEqual([])
  })

  it('keeps a meaningful pipe-separated segment local instead of grouping the full list', () => {
    const text = 'Power BI dashboards | stakeholder reporting'
    const range = normalizeHighlightSpanBoundaries(
      text,
      buildRange(text, 'Power BI dashboards |'),
    )

    expect(range).not.toBeNull()
    expect(text.slice(range!.start, range!.end)).toBe('Power BI dashboards')
  })
})
