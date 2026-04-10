type ExpectedParity = {
  release: string
  releaseSource: string
  agentModel: string
  dialogModel: string
}

type ParityOptions = {
  url: string
  expected: ExpectedParity
  timeoutMs: number
}

type HeaderSnapshot = {
  release?: string
  releaseSource?: string
  agentModel?: string
  dialogModel?: string
}

type ParityMismatch = {
  field: keyof ExpectedParity | 'status'
  expected: string
  actual?: string
}

export type ParityCheckResult = {
  ok: boolean
  requestUrl: string
  status: number
  safeRequestStatus: number
  headers: HeaderSnapshot
  mismatches: ParityMismatch[]
  missingHeaders: string[]
}

type FetchLike = typeof fetch

const HELP_TEXT = `Usage:
  npm run agent:parity -- --url <app-url> --expected-release <value> --expected-release-source <value> --expected-agent-model <value> --expected-dialog-model <value>

Required flags:
  --url                       Base app URL or full /api/agent URL
  --expected-release          Expected X-Agent-Release value
  --expected-release-source   Expected X-Agent-Release-Source value
  --expected-agent-model      Expected X-Agent-Resolved-Agent-Model value
  --expected-dialog-model     Expected X-Agent-Resolved-Dialog-Model value

Optional flags:
  --timeout-ms                Request timeout in milliseconds (default: 10000)
  --help                      Show this help output

Safety:
  This check sends an unauthenticated POST to /api/agent with an empty JSON body.
  The route should return 401 before session creation, credit consumption, or SSE execution.
`

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

export function normalizeAgentRouteUrl(input: string): string {
  const url = new URL(input)

  if (!url.pathname || url.pathname === '/') {
    url.pathname = '/api/agent'
  }

  return url.toString()
}

export function parseParityArgs(argv: string[]): ParityOptions | { help: true } {
  const values: {
    url?: string
    timeoutMs?: number
    expected: Partial<ExpectedParity>
  } = { expected: {} }

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]

    switch (token) {
      case '--help':
        return { help: true }
      case '--url':
        values.url = normalizeAgentRouteUrl(readFlagValue(argv, index, token))
        index += 1
        break
      case '--expected-release':
        values.expected.release = readFlagValue(argv, index, token)
        index += 1
        break
      case '--expected-release-source':
        values.expected.releaseSource = readFlagValue(argv, index, token)
        index += 1
        break
      case '--expected-agent-model':
        values.expected.agentModel = readFlagValue(argv, index, token)
        index += 1
        break
      case '--expected-dialog-model':
        values.expected.dialogModel = readFlagValue(argv, index, token)
        index += 1
        break
      case '--timeout-ms':
        values.timeoutMs = Number.parseInt(readFlagValue(argv, index, token), 10)
        index += 1
        break
      default:
        throw new Error(`Unknown flag: ${token}`)
    }
  }

  const missingFlags = [
    !values.url ? '--url' : undefined,
    !values.expected.release ? '--expected-release' : undefined,
    !values.expected.releaseSource ? '--expected-release-source' : undefined,
    !values.expected.agentModel ? '--expected-agent-model' : undefined,
    !values.expected.dialogModel ? '--expected-dialog-model' : undefined,
  ].filter(Boolean)

  if (missingFlags.length > 0) {
    throw new Error(`Missing required flags: ${missingFlags.join(', ')}`)
  }

  if (values.timeoutMs !== undefined && (!Number.isFinite(values.timeoutMs) || values.timeoutMs <= 0)) {
    throw new Error('--timeout-ms must be a positive integer.')
  }

  return {
    url: values.url!,
    expected: {
      release: values.expected!.release!,
      releaseSource: values.expected.releaseSource!,
      agentModel: values.expected.agentModel!,
      dialogModel: values.expected.dialogModel!,
    },
    timeoutMs: values.timeoutMs ?? 10_000,
  }
}

function readParityHeaders(headers: Headers): HeaderSnapshot {
  return {
    release: headers.get('X-Agent-Release') ?? undefined,
    releaseSource: headers.get('X-Agent-Release-Source') ?? undefined,
    agentModel: headers.get('X-Agent-Resolved-Agent-Model') ?? undefined,
    dialogModel: headers.get('X-Agent-Resolved-Dialog-Model') ?? undefined,
  }
}

export async function checkAgentRuntimeParity(
  options: ParityOptions,
  dependencies: { fetchImpl?: FetchLike } = {},
): Promise<ParityCheckResult> {
  const fetchImpl = dependencies.fetchImpl ?? fetch
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs)

  try {
    const response = await fetchImpl(options.url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: '{}',
      redirect: 'manual',
      signal: controller.signal,
    })

    const headers = readParityHeaders(response.headers)
    const missingHeaders = [
      !headers.release ? 'X-Agent-Release' : undefined,
      !headers.releaseSource ? 'X-Agent-Release-Source' : undefined,
      !headers.agentModel ? 'X-Agent-Resolved-Agent-Model' : undefined,
      !headers.dialogModel ? 'X-Agent-Resolved-Dialog-Model' : undefined,
    ].filter((value): value is string => Boolean(value))

    const mismatches: ParityMismatch[] = []

    if (response.status !== 401) {
      mismatches.push({
        field: 'status',
        expected: '401',
        actual: String(response.status),
      })
    }

    const expectedPairs: Array<[keyof ExpectedParity, string | undefined, string]> = [
      ['release', headers.release, options.expected.release],
      ['releaseSource', headers.releaseSource, options.expected.releaseSource],
      ['agentModel', headers.agentModel, options.expected.agentModel],
      ['dialogModel', headers.dialogModel, options.expected.dialogModel],
    ]

    for (const [field, actual, expected] of expectedPairs) {
      if (actual !== expected) {
        mismatches.push({
          field,
          expected,
          actual,
        })
      }
    }

    return {
      ok: missingHeaders.length === 0 && mismatches.length === 0,
      requestUrl: options.url,
      status: response.status,
      safeRequestStatus: 401,
      headers,
      mismatches,
      missingHeaders,
    }
  } finally {
    clearTimeout(timeout)
  }
}

function formatResult(result: ParityCheckResult): string {
  const lines = [
    result.ok ? 'PASS: deployed /api/agent matches the expected runtime provenance.' : 'FAIL: deployed /api/agent parity mismatch detected.',
    `URL: ${result.requestUrl}`,
    `Safe request status: expected ${result.safeRequestStatus}, received ${result.status}`,
    `X-Agent-Release: ${result.headers.release ?? '<missing>'}`,
    `X-Agent-Release-Source: ${result.headers.releaseSource ?? '<missing>'}`,
    `X-Agent-Resolved-Agent-Model: ${result.headers.agentModel ?? '<missing>'}`,
    `X-Agent-Resolved-Dialog-Model: ${result.headers.dialogModel ?? '<missing>'}`,
  ]

  if (result.missingHeaders.length > 0) {
    lines.push(`Missing headers: ${result.missingHeaders.join(', ')}`)
  }

  if (result.mismatches.length > 0) {
    lines.push('Mismatches:')
    for (const mismatch of result.mismatches) {
      lines.push(`- ${mismatch.field}: expected ${mismatch.expected}, received ${mismatch.actual ?? '<missing>'}`)
    }
  }

  return lines.join('\n')
}

export async function runCli(
  argv: string[],
  dependencies: { fetchImpl?: FetchLike; stdout?: NodeJS.WritableStream; stderr?: NodeJS.WritableStream } = {},
): Promise<number> {
  const stdout = dependencies.stdout ?? process.stdout
  const stderr = dependencies.stderr ?? process.stderr

  try {
    const parsed = parseParityArgs(argv)

    if ('help' in parsed) {
      stdout.write(`${HELP_TEXT}\n`)
      return 0
    }

    const result = await checkAgentRuntimeParity(parsed, {
      fetchImpl: dependencies.fetchImpl,
    })

    const output = `${formatResult(result)}\n`

    if (result.ok) {
      stdout.write(output)
      return 0
    }

    stderr.write(output)
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
