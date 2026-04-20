import { writeFile } from 'node:fs/promises'

type FetchLike = typeof fetch
type StressFormat = 'json' | 'markdown'
type ExportScope = 'base' | 'target'
type JobTerminalStatus = 'completed' | 'failed' | 'cancelled' | 'timeout'

type RawCliOptions = {
  url: string
  cookie?: string
  e2eSecret?: string
  e2eAppUser: string
  e2eCredits: number
  e2eDisplayName?: string
  e2eEmail?: string
  sessionIds: string[]
  scope: ExportScope
  targetId?: string
  concurrency: number
  requests: number
  timeoutMs: number
  settleTimeoutMs: number
  pollMs: number
  captureLimit: number
  format: StressFormat
  outputPath?: string
}

type CliOptions = RawCliOptions & {
  cookie: string
}

type BootstrapCookieOptions = Pick<
  RawCliOptions,
  'e2eSecret' | 'e2eAppUser' | 'e2eCredits' | 'e2eDisplayName' | 'e2eEmail'
> & {
  url: string
}

export type ExportStressRequestResult = {
  index: number
  request: {
    sessionId: string
    scope: ExportScope
  }
  response: {
    status: number
    latencyMs: number
    billingStage?: string
    success: boolean
    inProgress: boolean
    jobId?: string
    code?: string
    error?: string
    rawBodyPreview: string
  }
}

export type ExportStressJobResult = {
  jobId: string
  status: JobTerminalStatus
  finalStage?: string
  stageHistory: string[]
}

export type ExportStressSummary = {
  totalRequests: number
  acceptedResponses: number
  unexpectedResponses: number
  reconciliationPendingResponses: number
  requestStatusCounts: Record<string, number>
  distinctJobCount: number
  completedJobs: number
  anomalousJobs: number
  timedOutJobs: number
  jobStatusCounts: Record<string, number>
  jobStageCounts: Record<string, number>
  latencyMs: {
    min: number
    max: number
    avg: number
    p50: number
    p95: number
  }
}

export type ExportStressResult = {
  ok: boolean
  requestOrigin: string
  capturedAt: string
  durationMs: number
  config: {
    concurrency: number
    requests: number
    sessionIdCount: number
    scope: ExportScope
    targetId?: string
  }
  summary: ExportStressSummary
  warnings: string[]
  sampleRequests: ExportStressRequestResult[]
  sampleFailures: ExportStressRequestResult[]
  jobs: ExportStressJobResult[]
}

type GenerateRouteResponse = {
  success?: boolean
  inProgress?: boolean
  jobId?: string
  billingStage?: string
  code?: string
  error?: string
}

type JobSnapshotResponse = {
  jobId?: string
  status?: string
  stage?: string
}

const HELP_TEXT = `Usage:
  npx tsx scripts/stress-export-generation.ts --url <app-url> --session-id <id> --cookie "<cookie-header>" [options]
  npx tsx scripts/stress-export-generation.ts --url <local-app-url> --session-id <id> --e2e-secret <secret> [options]

Required flags:
  --url                       Base app URL
  --session-id                Session id to reuse (repeatable)
  --session-ids               Comma-separated session ids to reuse
  --cookie                    Authenticated Cookie header value
  --e2e-secret                Local E2E auth secret used to bootstrap a cookie automatically

Optional flags:
  --scope                     base or target (default: base)
  --target-id                 Target id required for --scope target
  --e2e-app-user             Local E2E auth app user id (default: usr_e2e_stress)
  --e2e-credits              Local E2E auth creditsRemaining value (default: 60)
  --e2e-display-name         Local E2E auth display name
  --e2e-email                Local E2E auth email
  --concurrency              Number of in-flight generate requests (default: 4)
  --requests                 Total generate requests to send (default: 12)
  --timeout-ms               Per-request timeout in milliseconds (default: 30000)
  --settle-timeout-ms        Time budget for polling durable jobs (default: 30000)
  --poll-ms                  Delay between job polls in milliseconds (default: 500)
  --capture-limit            Number of sample request records to include (default: 12)
  --format                   json or markdown (default: json)
  --output                   Optional file path for the final artifact
  --help                     Show this help output

Expected safe outcomes:
  - 202 in-progress responses that reuse one durable job
  - 200 completed responses when the artifact already exists
  - 409 BILLING_RECONCILIATION_PENDING when a prior failed export is still reconciling
`

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function isFlag(value: string): boolean {
  return value.startsWith('--')
}

function readFlagValue(argv: string[], index: number, flag: string): string {
  const value = argv[index + 1]

  if (!value || isFlag(value)) {
    throw new Error(`Missing value for ${flag}.`)
  }

  return value
}

function appendSessionIds(existing: string[], value: string): string[] {
  return [
    ...existing,
    ...value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean),
  ]
}

function ensurePositiveInteger(value: number, flag: string): number {
  if (!Number.isFinite(value) || value <= 0 || !Number.isInteger(value)) {
    throw new Error(`${flag} must be a positive integer.`)
  }

  return value
}

function normalizeAppBaseUrl(input: string): string {
  const url = new URL(input)
  url.pathname = '/'
  url.search = ''
  url.hash = ''
  return url.toString().replace(/\/$/, '')
}

function buildRawBodyPreview(payload: string): string {
  const collapsed = payload.replace(/\s+/g, ' ').trim()
  return collapsed.length > 220 ? `${collapsed.slice(0, 217)}...` : collapsed
}

function roundMetric(value: number): number {
  return Number(value.toFixed(1))
}

function percentile(values: number[], target: number): number {
  if (values.length === 0) {
    return 0
  }

  const index = Math.min(
    values.length - 1,
    Math.max(0, Math.ceil((target / 100) * values.length) - 1),
  )

  return values[index] ?? 0
}

function isAcceptedResponse(result: ExportStressRequestResult): boolean {
  if (result.response.status === 200 || result.response.status === 202) {
    return result.response.success === true
  }

  return (
    result.response.status === 409
    && result.response.code === 'BILLING_RECONCILIATION_PENDING'
  )
}

function isFailureResponse(result: ExportStressRequestResult): boolean {
  return !isAcceptedResponse(result)
}

function parseGenerateRoutePayload(rawBody: string): GenerateRouteResponse {
  const parsed = JSON.parse(rawBody) as unknown

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {}
  }

  return parsed as GenerateRouteResponse
}

async function bootstrapE2EAuthCookie(
  options: BootstrapCookieOptions,
  dependencies: { fetchImpl?: FetchLike } = {},
): Promise<string> {
  if (!options.e2eSecret) {
    throw new Error('Missing E2E auth secret.')
  }

  const fetchImpl = dependencies.fetchImpl ?? fetch
  const authUrl = new URL('/api/e2e/auth', options.url)
  const origin = new URL(options.url).origin

  const response = await fetchImpl(authUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin,
      'x-e2e-auth-secret': options.e2eSecret,
    },
    body: JSON.stringify({
      appUserId: options.e2eAppUser,
      creditsRemaining: options.e2eCredits,
      displayName: options.e2eDisplayName,
      email: options.e2eEmail,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Failed to bootstrap E2E auth cookie (${response.status}): ${body}`)
  }

  const setCookieHeader = response.headers.get('set-cookie')
  if (!setCookieHeader) {
    throw new Error('E2E auth bootstrap did not return a set-cookie header.')
  }

  return setCookieHeader.split(';')[0] ?? setCookieHeader
}

async function resolveCookie(
  options: RawCliOptions,
  dependencies: { fetchImpl?: FetchLike } = {},
): Promise<string> {
  if (options.cookie) {
    return options.cookie
  }

  return bootstrapE2EAuthCookie({
    url: options.url,
    e2eSecret: options.e2eSecret,
    e2eAppUser: options.e2eAppUser,
    e2eCredits: options.e2eCredits,
    e2eDisplayName: options.e2eDisplayName,
    e2eEmail: options.e2eEmail,
  }, dependencies)
}

async function sendGenerateRequest(
  input: {
    index: number
    url: string
    cookie: string
    sessionId: string
    scope: ExportScope
    targetId?: string
    timeoutMs: number
  },
  dependencies: { fetchImpl?: FetchLike } = {},
): Promise<ExportStressRequestResult> {
  const fetchImpl = dependencies.fetchImpl ?? fetch
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs)
  const startedAt = Date.now()
  const origin = new URL(input.url).origin

  try {
    const response = await fetchImpl(new URL(`/api/session/${input.sessionId}/generate`, input.url), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: input.cookie,
        origin,
        referer: `${origin}/`,
      },
      body: JSON.stringify({
        scope: input.scope,
        targetId: input.targetId,
      }),
      signal: controller.signal,
    })

    const rawBody = await response.text()
    const payload = parseGenerateRoutePayload(rawBody)

    return {
      index: input.index,
      request: {
        sessionId: input.sessionId,
        scope: input.scope,
      },
      response: {
        status: response.status,
        latencyMs: Date.now() - startedAt,
        billingStage: payload.billingStage,
        success: payload.success === true,
        inProgress: payload.inProgress === true,
        jobId: payload.jobId,
        code: payload.code,
        error: payload.error,
        rawBodyPreview: buildRawBodyPreview(rawBody),
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    return {
      index: input.index,
      request: {
        sessionId: input.sessionId,
        scope: input.scope,
      },
      response: {
        status: 0,
        latencyMs: Date.now() - startedAt,
        success: false,
        inProgress: false,
        code: error instanceof Error && error.name === 'AbortError' ? 'REQUEST_TIMEOUT' : 'REQUEST_FAILED',
        error: message,
        rawBodyPreview: buildRawBodyPreview(message),
      },
    }
  } finally {
    clearTimeout(timeout)
  }
}

async function pollJobToTerminal(
  input: {
    url: string
    cookie: string
    jobId: string
    settleTimeoutMs: number
    pollMs: number
  },
  dependencies: { fetchImpl?: FetchLike } = {},
): Promise<ExportStressJobResult> {
  const fetchImpl = dependencies.fetchImpl ?? fetch
  const deadline = Date.now() + input.settleTimeoutMs
  const stageHistory = new Set<string>()

  while (Date.now() <= deadline) {
    const response = await fetchImpl(new URL(`/api/jobs/${input.jobId}`, input.url), {
      headers: {
        cookie: input.cookie,
      },
    })

    if (!response.ok) {
      return {
        jobId: input.jobId,
        status: 'failed',
        finalStage: `status_${response.status}`,
        stageHistory: Array.from(stageHistory),
      }
    }

    const payload = await response.json() as JobSnapshotResponse
    if (payload.stage) {
      stageHistory.add(payload.stage)
    }

    if (payload.status === 'completed' || payload.status === 'failed' || payload.status === 'cancelled') {
      return {
        jobId: input.jobId,
        status: payload.status,
        finalStage: payload.stage,
        stageHistory: Array.from(stageHistory),
      }
    }

    await sleep(input.pollMs)
  }

  return {
    jobId: input.jobId,
    status: 'timeout',
    stageHistory: Array.from(stageHistory),
  }
}

export function parseStressArgs(argv: string[]): RawCliOptions | { help: true } {
  const values: RawCliOptions = {
    url: '',
    e2eAppUser: 'usr_e2e_stress',
    e2eCredits: 60,
    sessionIds: [],
    scope: 'base',
    concurrency: 4,
    requests: 12,
    timeoutMs: 30_000,
    settleTimeoutMs: 30_000,
    pollMs: 500,
    captureLimit: 12,
    format: 'json',
  }

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]

    switch (token) {
      case '--help':
        return { help: true }
      case '--url':
        values.url = normalizeAppBaseUrl(readFlagValue(argv, index, token))
        index += 1
        break
      case '--cookie':
        values.cookie = readFlagValue(argv, index, token)
        index += 1
        break
      case '--e2e-secret':
        values.e2eSecret = readFlagValue(argv, index, token)
        index += 1
        break
      case '--e2e-app-user':
        values.e2eAppUser = readFlagValue(argv, index, token)
        index += 1
        break
      case '--e2e-credits':
        values.e2eCredits = ensurePositiveInteger(Number.parseInt(readFlagValue(argv, index, token), 10), token)
        index += 1
        break
      case '--e2e-display-name':
        values.e2eDisplayName = readFlagValue(argv, index, token)
        index += 1
        break
      case '--e2e-email':
        values.e2eEmail = readFlagValue(argv, index, token)
        index += 1
        break
      case '--session-id':
        values.sessionIds = appendSessionIds(values.sessionIds, readFlagValue(argv, index, token))
        index += 1
        break
      case '--session-ids':
        values.sessionIds = appendSessionIds(values.sessionIds, readFlagValue(argv, index, token))
        index += 1
        break
      case '--scope': {
        const scope = readFlagValue(argv, index, token)
        if (scope !== 'base' && scope !== 'target') {
          throw new Error('--scope must be either base or target.')
        }
        values.scope = scope
        index += 1
        break
      }
      case '--target-id':
        values.targetId = readFlagValue(argv, index, token)
        index += 1
        break
      case '--concurrency':
        values.concurrency = ensurePositiveInteger(Number.parseInt(readFlagValue(argv, index, token), 10), token)
        index += 1
        break
      case '--requests':
        values.requests = ensurePositiveInteger(Number.parseInt(readFlagValue(argv, index, token), 10), token)
        index += 1
        break
      case '--timeout-ms':
        values.timeoutMs = ensurePositiveInteger(Number.parseInt(readFlagValue(argv, index, token), 10), token)
        index += 1
        break
      case '--settle-timeout-ms':
        values.settleTimeoutMs = ensurePositiveInteger(Number.parseInt(readFlagValue(argv, index, token), 10), token)
        index += 1
        break
      case '--poll-ms':
        values.pollMs = ensurePositiveInteger(Number.parseInt(readFlagValue(argv, index, token), 10), token)
        index += 1
        break
      case '--capture-limit':
        values.captureLimit = ensurePositiveInteger(Number.parseInt(readFlagValue(argv, index, token), 10), token)
        index += 1
        break
      case '--format': {
        const format = readFlagValue(argv, index, token)
        if (format !== 'json' && format !== 'markdown') {
          throw new Error('--format must be either json or markdown.')
        }
        values.format = format
        index += 1
        break
      }
      case '--output':
        values.outputPath = readFlagValue(argv, index, token)
        index += 1
        break
      default:
        throw new Error(`Unknown flag: ${token}`)
    }
  }

  if (!values.url) {
    throw new Error('Missing required flag: --url')
  }

  if (values.sessionIds.length === 0) {
    throw new Error('Provide at least one --session-id or --session-ids value.')
  }

  if (!values.cookie && !values.e2eSecret) {
    throw new Error('Provide either --cookie or --e2e-secret.')
  }

  if (values.scope === 'target' && !values.targetId) {
    throw new Error('--target-id is required when --scope target is used.')
  }

  return values
}

export function summarizeStressResults(
  requests: ExportStressRequestResult[],
  jobs: ExportStressJobResult[],
): ExportStressSummary {
  const latencies = requests
    .map((request) => request.response.latencyMs)
    .sort((left, right) => left - right)
  const requestStatusCounts = requests.reduce<Record<string, number>>((counts, request) => {
    const key = String(request.response.status)
    counts[key] = (counts[key] ?? 0) + 1
    return counts
  }, {})
  const jobStatusCounts = jobs.reduce<Record<string, number>>((counts, job) => {
    counts[job.status] = (counts[job.status] ?? 0) + 1
    return counts
  }, {})
  const jobStageCounts = jobs.reduce<Record<string, number>>((counts, job) => {
    if (job.finalStage) {
      counts[job.finalStage] = (counts[job.finalStage] ?? 0) + 1
    }
    return counts
  }, {})

  return {
    totalRequests: requests.length,
    acceptedResponses: requests.filter(isAcceptedResponse).length,
    unexpectedResponses: requests.filter(isFailureResponse).length,
    reconciliationPendingResponses: requests.filter((request) => (
      request.response.status === 409 && request.response.code === 'BILLING_RECONCILIATION_PENDING'
    )).length,
    requestStatusCounts,
    distinctJobCount: jobs.length,
    completedJobs: jobs.filter((job) => job.status === 'completed').length,
    anomalousJobs: jobs.filter((job) => job.status === 'failed' || job.status === 'cancelled').length,
    timedOutJobs: jobs.filter((job) => job.status === 'timeout').length,
    jobStatusCounts,
    jobStageCounts,
    latencyMs: {
      min: roundMetric(latencies[0] ?? 0),
      max: roundMetric(latencies[latencies.length - 1] ?? 0),
      avg: roundMetric(latencies.length > 0 ? latencies.reduce((sum, value) => sum + value, 0) / latencies.length : 0),
      p50: roundMetric(percentile(latencies, 50)),
      p95: roundMetric(percentile(latencies, 95)),
    },
  }
}

export async function stressExportGeneration(
  options: CliOptions,
  dependencies: { fetchImpl?: FetchLike } = {},
): Promise<ExportStressResult> {
  const warnings: string[] = []
  const requests: ExportStressRequestResult[] = []
  const startedAt = Date.now()
  let nextIndex = 0

  const getNextIndex = (): number | null => {
    if (nextIndex >= options.requests) {
      return null
    }

    const current = nextIndex
    nextIndex += 1
    return current
  }

  const worker = async (): Promise<void> => {
    while (true) {
      const index = getNextIndex()
      if (index === null) {
        return
      }

      const sessionId = options.sessionIds[index % options.sessionIds.length]!
      const result = await sendGenerateRequest({
        index,
        url: options.url,
        cookie: options.cookie,
        sessionId,
        scope: options.scope,
        targetId: options.targetId,
        timeoutMs: options.timeoutMs,
      }, dependencies)

      requests.push(result)
    }
  }

  await Promise.all(Array.from({ length: options.concurrency }, () => worker()))
  requests.sort((left, right) => left.index - right.index)

  const uniqueJobIds = Array.from(new Set(
    requests
      .map((request) => request.response.jobId)
      .filter((jobId): jobId is string => Boolean(jobId)),
  ))
  if (uniqueJobIds.length === 0) {
    warnings.push('No durable job ids were returned by the generate route.')
  }

  const jobs = await Promise.all(uniqueJobIds.map((jobId) => pollJobToTerminal({
    url: options.url,
    cookie: options.cookie,
    jobId,
    settleTimeoutMs: options.settleTimeoutMs,
    pollMs: options.pollMs,
  }, dependencies)))

  const durationMs = Date.now() - startedAt
  const summary = summarizeStressResults(requests, jobs)

  if (summary.reconciliationPendingResponses > 0) {
    warnings.push('At least one retry was blocked by BILLING_RECONCILIATION_PENDING.')
  }
  if (summary.timedOutJobs > 0) {
    warnings.push('At least one durable job did not reach a terminal state before the settle timeout.')
  }

  return {
    ok: summary.unexpectedResponses === 0
      && summary.anomalousJobs === 0
      && summary.timedOutJobs === 0,
    requestOrigin: options.url,
    capturedAt: new Date().toISOString(),
    durationMs,
    config: {
      concurrency: options.concurrency,
      requests: options.requests,
      sessionIdCount: options.sessionIds.length,
      scope: options.scope,
      targetId: options.targetId,
    },
    summary,
    warnings,
    sampleRequests: requests.slice(0, options.captureLimit),
    sampleFailures: requests.filter(isFailureResponse).slice(0, options.captureLimit),
    jobs,
  }
}

function formatMetricList(values: string[]): string {
  return values.length > 0 ? values.join(', ') : '<none>'
}

export function formatStressResult(result: ExportStressResult, format: StressFormat): string {
  if (format === 'json') {
    return JSON.stringify(result, null, 2)
  }

  const lines = [
    '# Export Generation Stress',
    '',
    `- Status: ${result.ok ? 'PASS' : 'FAIL'}`,
    `- URL: ${result.requestOrigin}`,
    `- Captured At: ${result.capturedAt}`,
    `- Duration Ms: ${result.durationMs}`,
    `- Scope: ${result.config.scope}`,
    `- Target Id: ${result.config.targetId ?? '<base>'}`,
    `- Concurrency: ${result.config.concurrency}`,
    `- Requests: ${result.config.requests}`,
    `- Session Id Count: ${result.config.sessionIdCount}`,
    `- Accepted Responses: ${result.summary.acceptedResponses}/${result.summary.totalRequests}`,
    `- Reconciliation Pending Responses: ${result.summary.reconciliationPendingResponses}`,
    `- Unexpected Responses: ${result.summary.unexpectedResponses}`,
    `- Distinct Jobs: ${result.summary.distinctJobCount}`,
    `- Completed Jobs: ${result.summary.completedJobs}`,
    `- Anomalous Jobs: ${result.summary.anomalousJobs}`,
    `- Timed Out Jobs: ${result.summary.timedOutJobs}`,
    `- Latency Avg/P50/P95: ${result.summary.latencyMs.avg}/${result.summary.latencyMs.p50}/${result.summary.latencyMs.p95}`,
    `- Request Status Counts: ${JSON.stringify(result.summary.requestStatusCounts)}`,
    `- Job Status Counts: ${JSON.stringify(result.summary.jobStatusCounts)}`,
    `- Job Stage Counts: ${JSON.stringify(result.summary.jobStageCounts)}`,
  ]

  if (result.warnings.length > 0) {
    lines.push(`- Warnings: ${result.warnings.join(' | ')}`)
  }

  lines.push('')
  lines.push('## Job Outcomes')
  for (const job of result.jobs) {
    lines.push(`- ${job.jobId}: status=${job.status} finalStage=${job.finalStage ?? '<none>'} stages=${formatMetricList(job.stageHistory)}`)
  }

  if (result.sampleFailures.length > 0) {
    lines.push('')
    lines.push('## Sample Failures')
    for (const failure of result.sampleFailures) {
      lines.push(`- #${failure.index} session=${failure.request.sessionId} status=${failure.response.status} code=${failure.response.code ?? '<none>'} stage=${failure.response.billingStage ?? '<none>'} error=${failure.response.error ?? '<none>'} body=${failure.response.rawBodyPreview}`)
    }
  }

  return lines.join('\n')
}

export async function runCli(
  argv: string[],
  dependencies: {
    fetchImpl?: FetchLike
    writeFileImpl?: typeof writeFile
    stdout?: NodeJS.WritableStream
    stderr?: NodeJS.WritableStream
  } = {},
): Promise<number> {
  const stdout = dependencies.stdout ?? process.stdout
  const stderr = dependencies.stderr ?? process.stderr
  const writeFileImpl = dependencies.writeFileImpl ?? writeFile

  try {
    const parsed = parseStressArgs(argv)

    if ('help' in parsed) {
      stdout.write(`${HELP_TEXT}\n`)
      return 0
    }

    const cookie = await resolveCookie(parsed, {
      fetchImpl: dependencies.fetchImpl,
    })
    const result = await stressExportGeneration({
      ...parsed,
      cookie,
    }, {
      fetchImpl: dependencies.fetchImpl,
    })
    const formatted = `${formatStressResult(result, parsed.format)}\n`

    if (parsed.outputPath) {
      await writeFileImpl(parsed.outputPath, formatted, 'utf8')
      const summary = `${result.ok ? 'PASS' : 'FAIL'}: stress artifact written to ${parsed.outputPath}\n`
      if (result.ok) {
        stdout.write(summary)
        return 0
      }
      stderr.write(summary)
      return 1
    }

    if (result.ok) {
      stdout.write(formatted)
      return 0
    }

    stderr.write(formatted)
    return 1
  } catch (error) {
    stderr.write(`${error instanceof Error ? error.message : String(error)}\n\n${HELP_TEXT}\n`)
    return 1
  }
}

function isDirectExecution(): boolean {
  const entry = process.argv[1]

  if (!entry) {
    return false
  }

  const normalizePath = (value: string): string =>
    value
      .replace(/\\/g, '/')
      .replace(/^\/([A-Za-z]:)/, '$1')
      .toLowerCase()

  return normalizePath(new URL(import.meta.url).pathname).endsWith(normalizePath(entry))
}

void (async () => {
  if (!isDirectExecution()) {
    return
  }

  const exitCode = await runCli(process.argv.slice(2))
  process.exit(exitCode)
})()
