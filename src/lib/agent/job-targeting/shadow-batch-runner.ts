import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { evaluateJobCompatibility } from '@/lib/agent/job-targeting/compatibility/assessment'
import {
  buildShadowBatchResult,
  snapshotAssessment,
} from '@/lib/agent/job-targeting/shadow-comparison'
import type {
  JobTargetingShadowCase,
  ShadowBatchResult,
  ShadowLegacySnapshot,
} from '@/lib/agent/job-targeting/shadow-case-types'
import { buildJobTargetingScoreBreakdownFromPlan } from '@/lib/agent/job-targeting/score-breakdown'
import { buildTargetedRewritePlan } from '@/lib/agent/tools/build-targeting-plan'
import { createJobCompatibilityShadowComparison } from '@/lib/db/job-compatibility-shadow-comparison'
import type { GapAnalysisResult } from '@/types/cv'

export type RunShadowBatchOptions = {
  inputPath: string
  outputPath: string
  limit?: number
  concurrency?: number
  persist?: boolean
  disableLlm?: boolean
}

export type RunShadowBatchSummary = {
  total: number
  successful: number
  failed: number
  outputPath: string
}

function parseJsonLines(source: string): unknown[] {
  const trimmed = source.trim()
  if (!trimmed) {
    return []
  }

  if (trimmed.startsWith('[')) {
    const parsed = JSON.parse(trimmed) as unknown
    return Array.isArray(parsed) ? parsed : []
  }

  return trimmed
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as unknown)
}

function assertShadowCase(value: unknown): JobTargetingShadowCase {
  if (!value || typeof value !== 'object') {
    throw new Error('Shadow case must be an object.')
  }

  const candidate = value as Partial<JobTargetingShadowCase>
  const allowedSources: JobTargetingShadowCase['source'][] = [
    'real_anonymized',
    'synthetic',
    'golden',
    'manual_review',
  ]
  if (!candidate.id || typeof candidate.id !== 'string') {
    throw new Error('Shadow case requires string id.')
  }

  if (!candidate.source || !allowedSources.includes(candidate.source)) {
    throw new Error(`Shadow case ${candidate.id} requires a valid source.`)
  }

  if (!candidate.cvState || typeof candidate.cvState !== 'object') {
    throw new Error(`Shadow case ${candidate.id} requires cvState.`)
  }

  if (!candidate.targetJobDescription || typeof candidate.targetJobDescription !== 'string') {
    throw new Error(`Shadow case ${candidate.id} requires targetJobDescription.`)
  }

  if (
    candidate.source === 'real_anonymized'
    && candidate.metadata?.anonymized !== true
  ) {
    throw new Error(`Real shadow case ${candidate.id} must be anonymized before batch execution.`)
  }

  return candidate as JobTargetingShadowCase
}

export async function loadShadowCases(inputPath: string): Promise<JobTargetingShadowCase[]> {
  const source = await readFile(inputPath, 'utf8')
  return parseJsonLines(source).map(assertShadowCase)
}

function buildBatchGapAnalysis(testCase: JobTargetingShadowCase): GapAnalysisResult {
  return {
    matchScore: 50,
    missingSkills: testCase.expected?.knownGaps ?? [],
    weakAreas: [],
    improvementSuggestions: [],
  }
}

async function runLegacyCompatibilityPath(params: {
  testCase: JobTargetingShadowCase
  gapAnalysis: GapAnalysisResult
  disableLlm: boolean
}): Promise<ShadowLegacySnapshot> {
  const targetingPlan = await buildTargetedRewritePlan({
    cvState: params.testCase.cvState,
    targetJobDescription: params.testCase.targetJobDescription,
    gapAnalysis: params.gapAnalysis,
    mode: 'job_targeting',
    rewriteIntent: 'targeted_rewrite',
    sessionId: `shadow_case_${params.testCase.id}`,
    disableLlm: params.disableLlm,
  })
  const scoreBreakdown = buildJobTargetingScoreBreakdownFromPlan({
    cvState: params.testCase.cvState,
    targetingPlan,
  })

  return {
    score: scoreBreakdown.total,
    lowFitTriggered: targetingPlan.lowFitWarningGate?.triggered ?? false,
    unsupportedCount: targetingPlan.targetEvidence?.filter((item) => item.evidenceLevel === 'unsupported_gap').length ?? 0,
    criticalGaps: scoreBreakdown.criticalGaps,
  }
}

function errorResult(params: {
  testCase: JobTargetingShadowCase
  startedAt: string
  error: unknown
}): ShadowBatchResult {
  const completedAt = new Date().toISOString()
  const message = params.error instanceof Error ? params.error.message : String(params.error)

  return {
    caseId: params.testCase.id,
    ...(params.testCase.domain === undefined ? {} : { domain: params.testCase.domain }),
    source: params.testCase.source,
    legacy: {},
    assessment: {
      score: 0,
      lowFitTriggered: true,
      supportedCount: 0,
      adjacentCount: 0,
      unsupportedCount: 0,
      forbiddenClaimCount: 0,
      criticalGaps: [],
      reviewNeededGaps: [],
      assessmentVersion: 'unavailable',
      scoreVersion: 'unavailable',
      catalogVersion: 'unavailable',
    },
    comparison: {
      scoreDelta: 0,
      lowFitDelta: false,
      criticalGapDelta: 0,
      unsupportedDelta: 0,
    },
    runtime: {
      startedAt: params.startedAt,
      completedAt,
      latencyMs: Math.max(0, Date.parse(completedAt) - Date.parse(params.startedAt)),
      success: false,
      error: message,
    },
  }
}

export async function processShadowCase(params: {
  testCase: JobTargetingShadowCase
  persist?: boolean
  disableLlm?: boolean
}): Promise<ShadowBatchResult> {
  const startedAt = new Date().toISOString()

  try {
    const gapAnalysis = buildBatchGapAnalysis(params.testCase)
    const legacy = await runLegacyCompatibilityPath({
      testCase: params.testCase,
      gapAnalysis,
      disableLlm: params.disableLlm ?? true,
    })
    const assessment = await evaluateJobCompatibility({
      cvState: params.testCase.cvState,
      targetJobDescription: params.testCase.targetJobDescription,
      gapAnalysis,
      sessionId: `shadow_case_${params.testCase.id}`,
    })

    if (params.persist) {
      await createJobCompatibilityShadowComparison({
        caseId: params.testCase.id,
        source: 'batch',
        legacy,
        assessment,
      })
    }

    return buildShadowBatchResult({
      caseId: params.testCase.id,
      domain: params.testCase.domain,
      source: params.testCase.source,
      legacy,
      assessment: snapshotAssessment(assessment),
      startedAt,
      completedAt: new Date().toISOString(),
    })
  } catch (error) {
    return errorResult({
      testCase: params.testCase,
      startedAt,
      error,
    })
  }
}

async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = []
  let nextIndex = 0

  async function runWorker(): Promise<void> {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex
      nextIndex += 1
      const item = items[currentIndex]
      if (item === undefined) {
        continue
      }
      results[currentIndex] = await worker(item)
    }
  }

  const workerCount = Math.max(1, Math.min(concurrency, items.length))
  await Promise.all(Array.from({ length: workerCount }, runWorker))
  return results
}

export async function writeShadowBatchResults(
  outputPath: string,
  results: ShadowBatchResult[],
): Promise<void> {
  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(
    outputPath,
    `${results.map((result) => JSON.stringify(result)).join('\n')}\n`,
    'utf8',
  )
}

export async function runShadowBatch(options: RunShadowBatchOptions): Promise<RunShadowBatchSummary> {
  const cases = await loadShadowCases(options.inputPath)
  const selectedCases = cases.slice(0, options.limit ?? cases.length)
  const results = await runWithConcurrency(
    selectedCases,
    options.concurrency ?? 3,
    (testCase) => processShadowCase({
      testCase,
      persist: options.persist ?? false,
      disableLlm: options.disableLlm ?? true,
    }),
  )

  await writeShadowBatchResults(options.outputPath, results)

  return {
    total: results.length,
    successful: results.filter((result) => result.runtime.success).length,
    failed: results.filter((result) => !result.runtime.success).length,
    outputPath: options.outputPath,
  }
}
