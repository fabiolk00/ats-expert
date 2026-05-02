import { readFileSync } from 'node:fs'

type ShadowComparisonEvent = {
  event?: string
  name?: string
  domain?: string
  requirementType?: string
  legacyScore?: number
  assessmentScore?: number
  scoreDelta?: number
  legacyCriticalGapsCount?: number
  assessmentCriticalGapsCount?: number
  legacyLowFitTriggered?: boolean
  assessmentLowFitTriggered?: boolean
  legacyUnsupportedCount?: number
  assessmentUnsupportedCount?: number
}

type ParsedEvent = ShadowComparisonEvent & {
  raw: unknown
}

const EVENT_NAME = 'job_targeting.compatibility.shadow_comparison'

function parseInputFiles(paths: string[]): ParsedEvent[] {
  return paths.flatMap((path) => {
    const source = readFileSync(path, 'utf8')

    return source
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter(Boolean)
      .flatMap((line) => {
        try {
          const parsed = JSON.parse(line) as ShadowComparisonEvent
          const eventName = parsed.event ?? parsed.name

          return eventName === undefined || eventName === EVENT_NAME
            ? [{ ...parsed, raw: parsed }]
            : []
        } catch {
          return []
        }
      })
  })
}

function percentile(values: number[], percentileValue: number): number {
  if (values.length === 0) {
    return 0
  }

  const sorted = [...values].sort((left, right) => left - right)
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((percentileValue / 100) * sorted.length) - 1),
  )

  return sorted[index] ?? 0
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0
  }

  return values.reduce((total, value) => total + value, 0) / values.length
}

function groupTop(
  events: ParsedEvent[],
  key: keyof Pick<ParsedEvent, 'domain' | 'requirementType'>,
): Array<{ key: string; count: number; meanScoreDelta: number }> {
  const groups = new Map<string, number[]>()

  events.forEach((event) => {
    const groupKey = typeof event[key] === 'string' && event[key]
      ? event[key]
      : 'unknown'
    const delta = Math.abs(event.scoreDelta ?? ((event.assessmentScore ?? 0) - (event.legacyScore ?? 0)))

    groups.set(groupKey, [...(groups.get(groupKey) ?? []), delta])
  })

  return [...groups.entries()]
    .map(([groupKey, values]) => ({
      key: groupKey,
      count: values.length,
      meanScoreDelta: round(average(values)),
    }))
    .sort((left, right) => right.meanScoreDelta - left.meanScoreDelta || right.count - left.count)
    .slice(0, 10)
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}

function main() {
  const paths = process.argv.slice(2)
  if (paths.length === 0) {
    console.error('Usage: tsx scripts/job-targeting/analyze-shadow-divergence.ts <jsonl-log-file...>')
    process.exitCode = 1
    return
  }

  const events = parseInputFiles(paths)
  const deltas = events.map((event) => Math.abs(
    event.scoreDelta ?? ((event.assessmentScore ?? 0) - (event.legacyScore ?? 0)),
  ))
  const lowFitDivergent = events.filter((event) => (
    typeof event.legacyLowFitTriggered === 'boolean'
    && typeof event.assessmentLowFitTriggered === 'boolean'
    && event.legacyLowFitTriggered !== event.assessmentLowFitTriggered
  ))
  const criticalGapDivergent = events.filter((event) => (
    typeof event.legacyCriticalGapsCount === 'number'
    && typeof event.assessmentCriticalGapsCount === 'number'
    && event.legacyCriticalGapsCount !== event.assessmentCriticalGapsCount
  ))
  const possibleFalsePositive = events.filter((event) => (
    (event.assessmentScore ?? 0) > (event.legacyScore ?? 0)
    && (event.assessmentUnsupportedCount ?? 0) < (event.legacyUnsupportedCount ?? 0)
  ))
  const possibleFalseNegative = events.filter((event) => (
    (event.assessmentScore ?? 0) < (event.legacyScore ?? 0)
    && (event.assessmentUnsupportedCount ?? 0) > (event.legacyUnsupportedCount ?? 0)
  ))

  console.log(JSON.stringify({
    totalCases: events.length,
    scoreDelta: {
      mean: round(average(deltas)),
      p50: percentile(deltas, 50),
      p90: percentile(deltas, 90),
      p95: percentile(deltas, 95),
    },
    topDivergencesByDomain: groupTop(events, 'domain'),
    topDivergencesByRequirementType: groupTop(events, 'requirementType'),
    lowFitDivergent: lowFitDivergent.length,
    criticalGapsDivergent: criticalGapDivergent.length,
    possibleFalsePositiveCount: possibleFalsePositive.length,
    possibleFalseNegativeCount: possibleFalseNegative.length,
  }, null, 2))
}

main()
