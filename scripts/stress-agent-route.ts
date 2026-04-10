import { readFile, writeFile } from 'node:fs/promises'

import type { AgentErrorChunk, AgentStreamChunk } from '../src/types/agent'
import { normalizeAgentRouteUrl } from './check-agent-runtime-parity'

const REPRESENTATIVE_VACANCY_TEXT = [
  'O que procuramos?',
  'Buscamos um Analista de BI Senior com foco em Power BI, SQL, ETL e traducao consultiva das necessidades das areas de negocio em indicadores estrategicos.',
  'Responsabilidades:',
  'Levantar requisitos com liderancas, construir dashboards em Power BI, modelar dados, automatizar pipelines, integrar APIs e sustentar metricas de alta confiabilidade.',
  'Requisitos:',
  'Experiencia solida com Power BI, DAX, SQL, ETL, comunicacao com areas nao tecnicas e apresentacao executiva de insights.',
  'Diferenciais:',
  'Python, Microsoft Fabric, integracoes sistemicas, arquitetura de dados, indicadores financeiros, vendas, RH e storytelling para alta gestao.',
].join('\n')

function buildLongVacancyText(targetLength = 7600): string {
  const fillerParagraph =
    'Contexto adicional: a pessoa precisa consolidar dados de multiplas fontes, revisar regras de negocio com profundidade, negociar prioridades com varias areas, padronizar metricas, manter governanca sem travar a operacao, produzir dashboards executivos de facil leitura, registrar definicoes de indicadores, tratar inconsistencias historicas, integrar APIs e orientar stakeholders sobre riscos, limitacoes e melhor uso analitico das informacoes.'

  let text = REPRESENTATIVE_VACANCY_TEXT

  while (text.length < targetLength) {
    text = `${text}\n\n${fillerParagraph}`
  }

  return text.slice(0, targetLength)
}

const MESSAGE_PROFILES = {
  representative: REPRESENTATIVE_VACANCY_TEXT,
  long_vacancy: buildLongVacancyText(),
  follow_up: 'reescreva meu resumo com base na vaga que acabei de enviar',
} as const

const HELP_TEXT = `Usage:
  npm run agent:stress-route -- --url <app-url> --cookie "<cookie-header>" [options]
  npm run agent:stress-route -- --url <local-app-url> --e2e-secret <secret> [options]

Required flags:
  --url                       Base app URL or full /api/agent URL
  --cookie                    Authenticated Cookie header value for deployed or existing local sessions
  --e2e-secret                Local E2E auth secret used to bootstrap a cookie automatically

Optional flags:
  --e2e-app-user             Local E2E auth app user id (default: usr_e2e_stress)
  --e2e-credits              Local E2E auth creditsRemaining value (default: 60)
  --e2e-display-name         Local E2E auth display name
  --e2e-email                Local E2E auth email
  --session-id               Reuse a specific existing session id (repeatable)
  --session-ids              Comma-separated existing session ids to reuse
  --message-profile          representative | long_vacancy | follow_up (default: representative)
  --message                  Inline message override
  --message-file             Path to a UTF-8 text file used as the request message
  --concurrency              Number of in-flight requests (default: 4)
  --requests                 Total requests to send (default: 12)
  --duration-ms              Soak mode duration in milliseconds (mutually exclusive with --requests)
  --timeout-ms               Per-request timeout in milliseconds (default: 45000)
  --capture-limit            Number of sample request records to include in the artifact (default: 12)
  --format                   json or markdown (default: json)
  --output                   Optional file path for the final artifact
  --help                     Show this help output

Safety:
  If you do not pass --session-id or --session-ids, the harness sends requests without sessionId.
  That creates new sessions and may consume credits on the target environment.
`

type FetchLike = typeof fetch
type StressFormat = 'json' | 'markdown'
type MessageProfileName = keyof typeof MESSAGE_PROFILES

type StressRawCliOptions = {
  url: string
  cookie?: string
  e2eSecret?: string
  e2eAppUser: string
  e2eCredits: number
  e2eDisplayName?: string
  e2eEmail?: string
  sessionIds: string[]
  messageProfile: MessageProfileName
  messageText?: string
  messageFilePath?: string
  concurrency: number
  requests?: number
  durationMs?: number
  timeoutMs: number
  captureLimit: number
  format: StressFormat
  outputPath?: string
}

type StressCliOptions = Omit<StressRawCliOptions, 'messageText' | 'messageFilePath' | 'cookie'> & {
  cookie: string
  message: string
}

type ReleaseHeaderSnapshot = {
  release?: string
  releaseSource?: string
  agentModel?: string
  dialogModel?: string
  commitShortSha?: string
  sessionHeader?: string
}

export type StressRequestResult = {
  index: number
  request: {
    sessionId?: string
    messageLength: number
  }
  response: {
    status: number
    latencyMs: number
    contentType?: string
    headers: ReleaseHeaderSnapshot
    sessionId?: string
    newSessionCreated: boolean
    done: boolean
    toolStartCount: number
    finalAssistantTextChars: number
    finalAssistantTextPreview: string
    errorCode?: string
    errorMessage?: string
    rawBodyPreview: string
  }
}

export type StressSummary = {
  totalRequests: number
  completedRequests: number
  successRequests: number
  failedRequests: number
  statusCounts: Record<string, number>
  newSessionCount: number
  streamCompletedCount: number
  streamErrorCount: number
  emptyAssistantTextCount: number
  latencyMs: {
    min: number
    max: number
    avg: number
    p50: number
    p95: number
  }
  releaseHeadersSeen: string[]
  releaseSourcesSeen: string[]
  agentModelsSeen: string[]
  dialogModelsSeen: string[]
  sessionIdsSeen: string[]
}

export type StressResult = {
  ok: boolean
  requestUrl: string
  capturedAt: string
  durationMs: number
  config: {
    concurrency: number
    requests?: number
    durationMs?: number
    sessionIdCount: number
    messageLength: number
    requestMode: 'reuse_sessions' | 'create_sessions'
  }
  summary: StressSummary
  warnings: string[]
  sampleRequests: StressRequestResult[]
  sampleFailures: StressRequestResult[]
}

type RequestFailurePayload = {
  error?: string
  code?: string
}

type BootstrapCookieOptions = Pick<
  StressRawCliOptions,
  'e2eSecret' | 'e2eAppUser' | 'e2eCredits' | 'e2eDisplayName' | 'e2eEmail'
> & {
  url: string
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

export function parseStressArgs(argv: string[]): StressRawCliOptions | { help: true } {
  const values: StressRawCliOptions = {
    url: '',
    e2eAppUser: 'usr_e2e_stress',
    e2eCredits: 60,
    sessionIds: [],
    messageProfile: 'representative',
    concurrency: 4,
    requests: 12,
    timeoutMs: 45_000,
    captureLimit: 12,
    format: 'json',
  }

  let durationExplicit = false
  let requestsExplicit = false

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]

    switch (token) {
      case '--help':
        return { help: true }
      case '--url':
        values.url = normalizeAgentRouteUrl(readFlagValue(argv, index, token))
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
      case '--message-profile': {
        const profile = readFlagValue(argv, index, token) as MessageProfileName
        if (!(profile in MESSAGE_PROFILES)) {
          throw new Error('--message-profile must be representative, long_vacancy, or follow_up.')
        }
        values.messageProfile = profile
        index += 1
        break
      }
      case '--message':
        values.messageText = readFlagValue(argv, index, token)
        index += 1
        break
      case '--message-file':
        values.messageFilePath = readFlagValue(argv, index, token)
        index += 1
        break
      case '--concurrency':
        values.concurrency = ensurePositiveInteger(Number.parseInt(readFlagValue(argv, index, token), 10), token)
        index += 1
        break
      case '--requests':
        values.requests = ensurePositiveInteger(Number.parseInt(readFlagValue(argv, index, token), 10), token)
        requestsExplicit = true
        index += 1
        break
      case '--duration-ms':
        values.durationMs = ensurePositiveInteger(Number.parseInt(readFlagValue(argv, index, token), 10), token)
        durationExplicit = true
        index += 1
        break
      case '--timeout-ms':
        values.timeoutMs = ensurePositiveInteger(Number.parseInt(readFlagValue(argv, index, token), 10), token)
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

  if (!values.cookie && !values.e2eSecret) {
    throw new Error('Provide either --cookie or --e2e-secret.')
  }

  if (values.messageText && values.messageFilePath) {
    throw new Error('--message and --message-file are mutually exclusive.')
  }

  if (durationExplicit && requestsExplicit) {
    throw new Error('--requests and --duration-ms are mutually exclusive.')
  }

  if (!durationExplicit && !requestsExplicit) {
    values.requests = 12
  }

  if (durationExplicit) {
    delete values.requests
  }

  return values
}

async function resolveMessageText(
  options: StressRawCliOptions,
  dependencies: { readFileImpl?: typeof readFile } = {},
): Promise<string> {
  if (options.messageText) {
    return options.messageText
  }

  if (options.messageFilePath) {
    const content = await (dependencies.readFileImpl ?? readFile)(options.messageFilePath, 'utf8')
    if (!content.trim()) {
      throw new Error(`Message file ${options.messageFilePath} is empty.`)
    }
    return content
  }

  return MESSAGE_PROFILES[options.messageProfile]
}

function buildRawBodyPreview(payload: string): string {
  const collapsed = payload.replace(/\s+/g, ' ').trim()
  return collapsed.length > 280 ? `${collapsed.slice(0, 277)}...` : collapsed
}

function buildTextPreview(payload: string): string {
  const collapsed = payload.replace(/\s+/g, ' ').trim()
  return collapsed.length > 160 ? `${collapsed.slice(0, 157)}...` : collapsed
}

function parseSseEvents(payload: string): AgentStreamChunk[] {
  return payload
    .split('\n\n')
    .map((entry) => entry.trim())
    .filter((entry) => entry.startsWith('data: '))
    .map((entry) => JSON.parse(entry.slice(6)) as AgentStreamChunk)
}

function readReleaseHeaders(headers: Headers): ReleaseHeaderSnapshot {
  return {
    release: headers.get('X-Agent-Release') ?? undefined,
    releaseSource: headers.get('X-Agent-Release-Source') ?? undefined,
    agentModel: headers.get('X-Agent-Resolved-Agent-Model') ?? undefined,
    dialogModel: headers.get('X-Agent-Resolved-Dialog-Model') ?? undefined,
    commitShortSha: headers.get('X-Agent-Commit-Short-Sha') ?? undefined,
    sessionHeader: headers.get('X-Session-Id') ?? undefined,
  }
}

function parseJsonFailure(rawBody: string, contentType: string | undefined): RequestFailurePayload | null {
  if (!contentType?.includes('application/json')) {
    return null
  }

  try {
    const parsed = JSON.parse(rawBody) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null
    }

    const record = parsed as Record<string, unknown>

    return {
      error: typeof record.error === 'string' ? record.error : undefined,
      code: typeof record.code === 'string' ? record.code : undefined,
    }
  } catch {
    return null
  }
}

function extractSessionId(headers: Headers, events: AgentStreamChunk[]): string | undefined {
  const headerValue = headers.get('X-Session-Id') ?? undefined
  if (headerValue) {
    return headerValue
  }

  const sessionEvent = events.find(
    (event): event is Extract<AgentStreamChunk, { type: 'sessionCreated' | 'done' }> =>
      event.type === 'sessionCreated' || event.type === 'done',
  )

  return sessionEvent?.sessionId
}

function isSuccessfulResult(result: StressRequestResult): boolean {
  return result.response.status === 200
    && result.response.done
    && !result.response.errorCode
    && result.response.finalAssistantTextChars > 0
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

export function summarizeStressResults(results: StressRequestResult[]): StressSummary {
  const latencies = results
    .map((result) => result.response.latencyMs)
    .sort((left, right) => left - right)

  const statusCounts = results.reduce<Record<string, number>>((counts, result) => {
    const key = String(result.response.status)
    counts[key] = (counts[key] ?? 0) + 1
    return counts
  }, {})

  const releaseHeadersSeen = Array.from(new Set(results.map((result) => result.response.headers.release).filter(Boolean))) as string[]
  const releaseSourcesSeen = Array.from(new Set(results.map((result) => result.response.headers.releaseSource).filter(Boolean))) as string[]
  const agentModelsSeen = Array.from(new Set(results.map((result) => result.response.headers.agentModel).filter(Boolean))) as string[]
  const dialogModelsSeen = Array.from(new Set(results.map((result) => result.response.headers.dialogModel).filter(Boolean))) as string[]
  const sessionIdsSeen = Array.from(new Set(results.map((result) => result.response.sessionId).filter(Boolean))) as string[]

  const completedRequests = results.length
  const successRequests = results.filter(isSuccessfulResult).length
  const failedRequests = completedRequests - successRequests

  return {
    totalRequests: results.length,
    completedRequests,
    successRequests,
    failedRequests,
    statusCounts,
    newSessionCount: results.filter((result) => result.response.newSessionCreated).length,
    streamCompletedCount: results.filter((result) => result.response.done).length,
    streamErrorCount: results.filter((result) => Boolean(result.response.errorCode || result.response.errorMessage)).length,
    emptyAssistantTextCount: results.filter((result) => result.response.finalAssistantTextChars === 0).length,
    latencyMs: {
      min: roundMetric(latencies[0] ?? 0),
      max: roundMetric(latencies[latencies.length - 1] ?? 0),
      avg: roundMetric(latencies.length > 0 ? latencies.reduce((sum, value) => sum + value, 0) / latencies.length : 0),
      p50: roundMetric(percentile(latencies, 50)),
      p95: roundMetric(percentile(latencies, 95)),
    },
    releaseHeadersSeen,
    releaseSourcesSeen,
    agentModelsSeen,
    dialogModelsSeen,
    sessionIdsSeen,
  }
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
  options: StressRawCliOptions,
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

async function sendStressRequest(
  params: {
    index: number
    url: string
    cookie: string
    message: string
    sessionId?: string
    timeoutMs: number
  },
  dependencies: { fetchImpl?: FetchLike } = {},
): Promise<StressRequestResult> {
  const fetchImpl = dependencies.fetchImpl ?? fetch
  const controller = new AbortController()
  const startedAt = Date.now()
  const timeout = setTimeout(() => controller.abort(), params.timeoutMs)

  try {
    const response = await fetchImpl(params.url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: params.cookie,
      },
      body: JSON.stringify({
        sessionId: params.sessionId,
        message: params.message,
      }),
      signal: controller.signal,
    })

    const rawBody = await response.text()
    const latencyMs = Date.now() - startedAt
    const contentType = response.headers.get('content-type') ?? undefined
    const events = contentType?.includes('text/event-stream') ? parseSseEvents(rawBody) : []
    const errorEvent = events.find((event): event is AgentErrorChunk => event.type === 'error')
    const done = events.some((event) => event.type === 'done')
    const toolStartCount = events.filter((event) => event.type === 'toolStart').length
    const finalAssistantText = events
      .filter((event): event is Extract<AgentStreamChunk, { type: 'text' }> => event.type === 'text')
      .map((event) => event.content)
      .join('')
      .trim()
    const jsonFailure = parseJsonFailure(rawBody, contentType)
    const sessionId = extractSessionId(response.headers, events)

    return {
      index: params.index,
      request: {
        sessionId: params.sessionId,
        messageLength: params.message.length,
      },
      response: {
        status: response.status,
        latencyMs,
        contentType,
        headers: readReleaseHeaders(response.headers),
        sessionId,
        newSessionCreated: events.some((event) => event.type === 'sessionCreated') || Boolean(response.headers.get('X-Session-Id')),
        done,
        toolStartCount,
        finalAssistantTextChars: finalAssistantText.length,
        finalAssistantTextPreview: buildTextPreview(finalAssistantText),
        errorCode: errorEvent?.code ?? jsonFailure?.code,
        errorMessage: errorEvent?.error ?? jsonFailure?.error,
        rawBodyPreview: buildRawBodyPreview(rawBody),
      },
    }
  } catch (error) {
    const latencyMs = Date.now() - startedAt
    const errorMessage = error instanceof Error ? error.message : String(error)

    return {
      index: params.index,
      request: {
        sessionId: params.sessionId,
        messageLength: params.message.length,
      },
      response: {
        status: 0,
        latencyMs,
        headers: {},
        newSessionCreated: false,
        done: false,
        toolStartCount: 0,
        finalAssistantTextChars: 0,
        finalAssistantTextPreview: '',
        errorCode: error instanceof Error && error.name === 'AbortError' ? 'REQUEST_TIMEOUT' : 'REQUEST_FAILED',
        errorMessage,
        rawBodyPreview: buildRawBodyPreview(errorMessage),
      },
    }
  } finally {
    clearTimeout(timeout)
  }
}

export async function stressAgentRoute(
  options: StressCliOptions,
  dependencies: { fetchImpl?: FetchLike } = {},
): Promise<StressResult> {
  const warnings: string[] = []
  if (options.sessionIds.length === 0) {
    warnings.push('No session ids were supplied; each request may create a new session and consume credits.')
  }

  const results: StressRequestResult[] = []
  const startedAt = Date.now()
  const deadline = options.durationMs ? startedAt + options.durationMs : Number.POSITIVE_INFINITY
  let nextIndex = 0

  const getNextIndex = (): number | null => {
    if (options.requests !== undefined) {
      if (nextIndex >= options.requests) {
        return null
      }
      const current = nextIndex
      nextIndex += 1
      return current
    }

    if (Date.now() >= deadline) {
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

      const sessionId = options.sessionIds.length > 0
        ? options.sessionIds[index % options.sessionIds.length]
        : undefined

      const result = await sendStressRequest({
        index,
        url: options.url,
        cookie: options.cookie,
        message: options.message,
        sessionId,
        timeoutMs: options.timeoutMs,
      }, dependencies)

      results.push(result)
    }
  }

  await Promise.all(Array.from({ length: options.concurrency }, () => worker()))

  results.sort((left, right) => left.index - right.index)
  const durationMs = Date.now() - startedAt
  const summary = summarizeStressResults(results)
  const sampleRequests = results.slice(0, options.captureLimit)
  const sampleFailures = results.filter((result) => !isSuccessfulResult(result)).slice(0, options.captureLimit)

  return {
    ok: summary.failedRequests === 0
      && summary.emptyAssistantTextCount === 0
      && summary.streamErrorCount === 0,
    requestUrl: options.url,
    capturedAt: new Date().toISOString(),
    durationMs,
    config: {
      concurrency: options.concurrency,
      requests: options.requests,
      durationMs: options.durationMs,
      sessionIdCount: options.sessionIds.length,
      messageLength: options.message.length,
      requestMode: options.sessionIds.length > 0 ? 'reuse_sessions' : 'create_sessions',
    },
    summary,
    warnings,
    sampleRequests,
    sampleFailures,
  }
}

function formatMetricList(values: string[]): string {
  return values.length > 0 ? values.join(', ') : '<none>'
}

export function formatStressResult(result: StressResult, format: StressFormat): string {
  if (format === 'json') {
    return JSON.stringify(result, null, 2)
  }

  const lines = [
    '# Agent Route Stress',
    '',
    `- Status: ${result.ok ? 'PASS' : 'FAIL'}`,
    `- URL: ${result.requestUrl}`,
    `- Captured At: ${result.capturedAt}`,
    `- Duration Ms: ${result.durationMs}`,
    `- Request Mode: ${result.config.requestMode}`,
    `- Concurrency: ${result.config.concurrency}`,
    `- Configured Requests: ${result.config.requests ?? '<duration_mode>'}`,
    `- Configured Duration Ms: ${result.config.durationMs ?? '<request_mode>'}`,
    `- Message Length: ${result.config.messageLength}`,
    `- Total Requests: ${result.summary.totalRequests}`,
    `- Success Requests: ${result.summary.successRequests}`,
    `- Failed Requests: ${result.summary.failedRequests}`,
    `- Empty Assistant Text Count: ${result.summary.emptyAssistantTextCount}`,
    `- Stream Error Count: ${result.summary.streamErrorCount}`,
    `- New Session Count: ${result.summary.newSessionCount}`,
    `- Latency Avg/P50/P95: ${result.summary.latencyMs.avg}/${result.summary.latencyMs.p50}/${result.summary.latencyMs.p95}`,
    `- Status Counts: ${JSON.stringify(result.summary.statusCounts)}`,
    `- Releases Seen: ${formatMetricList(result.summary.releaseHeadersSeen)}`,
    `- Agent Models Seen: ${formatMetricList(result.summary.agentModelsSeen)}`,
    `- Dialog Models Seen: ${formatMetricList(result.summary.dialogModelsSeen)}`,
  ]

  if (result.warnings.length > 0) {
    lines.push(`- Warnings: ${result.warnings.join(' | ')}`)
  }

  if (result.sampleFailures.length > 0) {
    lines.push('')
    lines.push('## Sample Failures')
    for (const failure of result.sampleFailures) {
      lines.push(
        `- #${failure.index} status=${failure.response.status} latencyMs=${failure.response.latencyMs} session=${failure.response.sessionId ?? '<none>'} error=${failure.response.errorCode ?? '<none>'} textChars=${failure.response.finalAssistantTextChars} body=${failure.response.rawBodyPreview}`,
      )
    }
  }

  return lines.join('\n')
}

export async function runCli(
  argv: string[],
  dependencies: {
    fetchImpl?: FetchLike
    readFileImpl?: typeof readFile
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

    const [cookie, message] = await Promise.all([
      resolveCookie(parsed, { fetchImpl: dependencies.fetchImpl }),
      resolveMessageText(parsed, { readFileImpl: dependencies.readFileImpl }),
    ])

    const result = await stressAgentRoute({
      ...parsed,
      cookie,
      message,
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
