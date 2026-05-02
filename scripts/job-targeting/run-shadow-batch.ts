import { readFileSync } from 'node:fs'
import path from 'node:path'

import { runShadowBatch } from '../../src/lib/agent/job-targeting/shadow-batch-runner'
import {
  parseShadowComparisonInput,
  writeShadowDivergenceReport,
} from './analyze-shadow-divergence'

type CliOptions = {
  input?: string
  output?: string
  limit?: number
  concurrency?: number
  persist?: boolean
  disableLlm?: boolean
  report?: boolean
}

function readNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    concurrency: 3,
    disableLlm: true,
    report: true,
  }

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === '--input') {
      options.input = args[index + 1]
      index += 1
      continue
    }

    if (arg === '--output') {
      options.output = args[index + 1]
      index += 1
      continue
    }

    if (arg === '--limit') {
      options.limit = readNumber(args[index + 1], 500)
      index += 1
      continue
    }

    if (arg === '--concurrency') {
      options.concurrency = readNumber(args[index + 1], 3)
      index += 1
      continue
    }

    if (arg === '--persist') {
      options.persist = true
      continue
    }

    if (arg === '--allow-llm') {
      options.disableLlm = false
      continue
    }

    if (arg === '--no-report') {
      options.report = false
    }
  }

  return options
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (!options.input || !options.output) {
    console.error([
      'Usage:',
      'tsx scripts/job-targeting/run-shadow-batch.ts \\',
      '  --input .local/job-targeting-shadow-cases/cases.jsonl \\',
      '  --output .local/job-targeting-shadow-results/results.jsonl \\',
      '  --limit 500 \\',
      '  --concurrency 3',
    ].join('\n'))
    process.exitCode = 1
    return
  }

  const summary = await runShadowBatch({
    inputPath: options.input,
    outputPath: options.output,
    limit: options.limit ?? 500,
    concurrency: options.concurrency ?? 3,
    persist: options.persist ?? false,
    disableLlm: options.disableLlm ?? true,
  })

  let cutoverReady: boolean | undefined
  if (options.report !== false) {
    const records = parseShadowComparisonInput(readFileSync(options.output, 'utf8'))
    const report = writeShadowDivergenceReport({
      records,
      outputDir: path.dirname(options.output),
    })
    cutoverReady = report.CUTOVER_READY
  }

  console.log(JSON.stringify({
    ...summary,
    ...(cutoverReady === undefined ? {} : { CUTOVER_READY: cutoverReady }),
  }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
