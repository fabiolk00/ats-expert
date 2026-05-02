import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

type ShadowComparisonRecord = {
  caseId?: string
  domain?: string
  requirementType?: string
  legacyScore?: number
  assessmentScore?: number
  scoreDelta?: number
  legacyCriticalGapsCount?: number
  assessmentCriticalGapsCount?: number
  criticalGapDelta?: number
  legacyLowFitTriggered?: boolean
  assessmentLowFitTriggered?: boolean
  lowFitDelta?: boolean
  legacyUnsupportedCount?: number
  assessmentUnsupportedCount?: number
  unsupportedDelta?: number
  assessmentSupportedCount?: number
  assessmentAdjacentCount?: number
  assessmentForbiddenClaimCount?: number
  event?: string
  name?: string
  runtime?: {
    success?: boolean
    error?: string
  }
  comparison?: {
    scoreDelta?: number
    lowFitDelta?: boolean
    criticalGapDelta?: number
    unsupportedDelta?: number
  }
  legacy?: {
    score?: number
    lowFitTriggered?: boolean
    unsupportedCount?: number
    criticalGaps?: string[]
  }
  assessment?: {
    score?: number
    lowFitTriggered?: boolean
    supportedCount?: number
    adjacentCount?: number
    unsupportedCount?: number
    forbiddenClaimCount?: number
    criticalGaps?: string[]
  }
  validation?: {
    blocked?: boolean
    issueTypes?: string[]
    factualViolation?: boolean
  }
}

export type ShadowDivergenceReport = {
  CUTOVER_READY: boolean
  cutoverReasons: string[]
  totalCases: number
  successfulCases: number
  failedCases: number
  scoreDelta: {
    meanAbsolute: number
    p50: number
    p90: number
    p95: number
  }
  lowFitDivergentCount: number
  criticalGapDivergentCount: number
  possibleFalsePositiveCandidates: number
  possibleFalseNegativeCandidates: number
  factualValidationViolations: number
  confirmedFalsePositiveForbiddenClaims: number
  confirmedFalseNegativeCoreExplicit: number
  top30LargestScoreDivergences: Array<{
    caseId: string
    domain: string
    scoreDelta: number
    absoluteScoreDelta: number
  }>
  topDivergencesByDomain: Array<{ key: string; count: number; meanAbsoluteScoreDelta: number }>
  topDivergencesByRequirementKind: Array<{ key: string; count: number; meanAbsoluteScoreDelta: number }>
}

const EVENT_NAME = 'job_targeting.compatibility.shadow_comparison'

function round(value: number): number {
  return Math.round(value * 100) / 100
}

export function percentile(values: number[], percentileValue: number): number {
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

function readRecordScoreDelta(record: ShadowComparisonRecord): number {
  return record.comparison?.scoreDelta
    ?? record.scoreDelta
    ?? ((record.assessment?.score ?? record.assessmentScore ?? 0) - (record.legacy?.score ?? record.legacyScore ?? 0))
}

function readLowFitDelta(record: ShadowComparisonRecord): boolean {
  return record.comparison?.lowFitDelta
    ?? record.lowFitDelta
    ?? (Boolean(record.legacy?.lowFitTriggered ?? record.legacyLowFitTriggered)
      !== Boolean(record.assessment?.lowFitTriggered ?? record.assessmentLowFitTriggered))
}

function readCriticalGapDelta(record: ShadowComparisonRecord): number {
  const legacyCount = record.legacy?.criticalGaps?.length ?? record.legacyCriticalGapsCount ?? 0
  const assessmentCount = record.assessment?.criticalGaps?.length ?? record.assessmentCriticalGapsCount ?? 0

  return record.comparison?.criticalGapDelta
    ?? record.criticalGapDelta
    ?? (assessmentCount - legacyCount)
}

function readUnsupportedDelta(record: ShadowComparisonRecord): number {
  return record.comparison?.unsupportedDelta
    ?? record.unsupportedDelta
    ?? ((record.assessment?.unsupportedCount ?? record.assessmentUnsupportedCount ?? 0)
      - (record.legacy?.unsupportedCount ?? record.legacyUnsupportedCount ?? 0))
}

function isSuccessful(record: ShadowComparisonRecord): boolean {
  return record.runtime?.success !== false
}

function groupTop(
  records: ShadowComparisonRecord[],
  getKey: (record: ShadowComparisonRecord) => string | undefined,
): Array<{ key: string; count: number; meanAbsoluteScoreDelta: number }> {
  const groups = new Map<string, number[]>()

  records.forEach((record) => {
    const groupKey = getKey(record)?.trim() || 'unknown'
    const delta = Math.abs(readRecordScoreDelta(record))

    groups.set(groupKey, [...(groups.get(groupKey) ?? []), delta])
  })

  return [...groups.entries()]
    .map(([groupKey, values]) => ({
      key: groupKey,
      count: values.length,
      meanAbsoluteScoreDelta: round(average(values)),
    }))
    .sort((left, right) => right.meanAbsoluteScoreDelta - left.meanAbsoluteScoreDelta || right.count - left.count)
    .slice(0, 10)
}

function shouldKeepRecord(record: ShadowComparisonRecord): boolean {
  const eventName = record.event ?? record.name
  return eventName === undefined || eventName === EVENT_NAME
}

export function parseShadowComparisonInput(source: string): ShadowComparisonRecord[] {
  const trimmed = source.trim()
  if (!trimmed) {
    return []
  }

  const rawRecords = trimmed.startsWith('[')
    ? JSON.parse(trimmed) as unknown[]
    : trimmed
        .split(/\r?\n/u)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => JSON.parse(line) as unknown)

  return rawRecords
    .filter((record): record is ShadowComparisonRecord => Boolean(record) && typeof record === 'object')
    .filter(shouldKeepRecord)
}

export function buildShadowDivergenceReport(records: ShadowComparisonRecord[]): ShadowDivergenceReport {
  const successfulRecords = records.filter(isSuccessful)
  const failedCases = records.length - successfulRecords.length
  const deltas = successfulRecords.map((record) => Math.abs(readRecordScoreDelta(record)))
  const factualValidationViolations = successfulRecords.filter((record) => record.validation?.factualViolation).length
  const confirmedFalsePositiveForbiddenClaims = successfulRecords.filter((record) => (
    record.validation?.issueTypes?.some((issueType) => /forbidden|unsupported|unsafe_direct_claim/u.test(issueType))
  )).length
  const confirmedFalseNegativeCoreExplicit = successfulRecords.filter((record) => (
    record.validation?.issueTypes?.some((issueType) => /false_negative_core_explicit/u.test(issueType))
  )).length
  const meanAbsolute = round(average(deltas))
  const p95 = percentile(deltas, 95)
  const cutoverReasons: string[] = []

  if (successfulRecords.length < 500) {
    cutoverReasons.push('successful_cases_below_500')
  }
  if (meanAbsolute > 15) {
    cutoverReasons.push('mean_absolute_score_delta_above_15')
  }
  if (p95 > 30) {
    cutoverReasons.push('p95_score_delta_above_30')
  }
  if (factualValidationViolations > 0) {
    cutoverReasons.push('factual_validation_violations_present')
  }
  if (confirmedFalsePositiveForbiddenClaims > 0) {
    cutoverReasons.push('confirmed_false_positive_forbidden_claims_present')
  }
  if (confirmedFalseNegativeCoreExplicit > 0) {
    cutoverReasons.push('confirmed_false_negative_core_explicit_present')
  }
  if (failedCases > 0) {
    cutoverReasons.push('failed_cases_present')
  }

  return {
    CUTOVER_READY: cutoverReasons.length === 0,
    cutoverReasons,
    totalCases: records.length,
    successfulCases: successfulRecords.length,
    failedCases,
    scoreDelta: {
      meanAbsolute,
      p50: percentile(deltas, 50),
      p90: percentile(deltas, 90),
      p95,
    },
    lowFitDivergentCount: successfulRecords.filter(readLowFitDelta).length,
    criticalGapDivergentCount: successfulRecords.filter((record) => readCriticalGapDelta(record) !== 0).length,
    possibleFalsePositiveCandidates: successfulRecords.filter((record) => (
      readRecordScoreDelta(record) > 0 && readUnsupportedDelta(record) < 0
    )).length,
    possibleFalseNegativeCandidates: successfulRecords.filter((record) => (
      readRecordScoreDelta(record) < 0 && readUnsupportedDelta(record) > 0
    )).length,
    factualValidationViolations,
    confirmedFalsePositiveForbiddenClaims,
    confirmedFalseNegativeCoreExplicit,
    top30LargestScoreDivergences: successfulRecords
      .map((record) => ({
        caseId: record.caseId ?? 'unknown',
        domain: record.domain ?? 'unknown',
        scoreDelta: readRecordScoreDelta(record),
        absoluteScoreDelta: Math.abs(readRecordScoreDelta(record)),
      }))
      .sort((left, right) => right.absoluteScoreDelta - left.absoluteScoreDelta)
      .slice(0, 30),
    topDivergencesByDomain: groupTop(successfulRecords, (record) => record.domain),
    topDivergencesByRequirementKind: groupTop(successfulRecords, (record) => record.requirementType),
  }
}

export function renderShadowDivergenceMarkdown(report: ShadowDivergenceReport): string {
  return [
    '# Job Targeting Shadow Divergence Report',
    '',
    `CUTOVER_READY=${report.CUTOVER_READY ? 'true' : 'false'}`,
    '',
    `- Total cases: ${report.totalCases}`,
    `- Successful cases: ${report.successfulCases}`,
    `- Failed cases: ${report.failedCases}`,
    `- Mean absolute score delta: ${report.scoreDelta.meanAbsolute}`,
    `- P50/P90/P95 score delta: ${report.scoreDelta.p50}/${report.scoreDelta.p90}/${report.scoreDelta.p95}`,
    `- Low-fit divergent count: ${report.lowFitDivergentCount}`,
    `- Critical gap divergent count: ${report.criticalGapDivergentCount}`,
    `- Factual validation violations: ${report.factualValidationViolations}`,
    '',
    '## Cutover Reasons',
    '',
    ...(report.cutoverReasons.length > 0
      ? report.cutoverReasons.map((reason) => `- ${reason}`)
      : ['- none']),
    '',
    '## Largest Score Divergences',
    '',
    ...report.top30LargestScoreDivergences.map((item) => (
      `- ${item.caseId} (${item.domain}): delta=${item.scoreDelta}, abs=${item.absoluteScoreDelta}`
    )),
    '',
  ].join('\n')
}

export function writeShadowDivergenceReport(params: {
  records: ShadowComparisonRecord[]
  outputDir: string
}): ShadowDivergenceReport {
  const report = buildShadowDivergenceReport(params.records)
  mkdirSync(params.outputDir, { recursive: true })
  writeFileSync(path.join(params.outputDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  writeFileSync(path.join(params.outputDir, 'report.md'), renderShadowDivergenceMarkdown(report), 'utf8')
  return report
}

function parseCliArgs(args: string[]): { inputPaths: string[]; outputDir?: string } {
  const inputPaths: string[] = []
  let outputDir: string | undefined

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '--output-dir') {
      outputDir = args[index + 1]
      index += 1
      continue
    }
    if (arg) {
      inputPaths.push(arg)
    }
  }

  return { inputPaths, outputDir }
}

function main() {
  const { inputPaths, outputDir } = parseCliArgs(process.argv.slice(2))
  if (inputPaths.length === 0) {
    console.error('Usage: tsx scripts/job-targeting/analyze-shadow-divergence.ts <jsonl-file...> [--output-dir .local/job-targeting-shadow-results]')
    process.exitCode = 1
    return
  }

  const records = inputPaths.flatMap((inputPath) => parseShadowComparisonInput(readFileSync(inputPath, 'utf8')))
  const report = outputDir
    ? writeShadowDivergenceReport({ records, outputDir })
    : buildShadowDivergenceReport(records)

  console.log(JSON.stringify(report, null, 2))
}

if (require.main === module) {
  main()
}
