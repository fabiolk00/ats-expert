import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { parseArgs } from 'node:util'

type ScenarioName =
  | 'one_time_settlement'
  | 'inactive_subscription_snapshot'
  | 'initial_recurring_activation'
  | 'renewal_replace_balance'
  | 'cancellation_metadata_only'
  | 'duplicate_delivery'
  | 'partial_success_reconcile'

type ScenarioBuildContext = {
  dryRun: boolean
  paymentId?: string
  subscriptionId?: string
  checkoutReference?: string
  checkoutSession?: string
  appUserId?: string
  valueOverride?: number
  eventOverride?: string
  dueDate?: string
}

type ScenarioDefinition = {
  name: ScenarioName
  summary: string
  requires: string[]
  recommendedPrep: string
  buildPayload: (context: ScenarioBuildContext) => unknown
}

type ReplayArtifact = {
  generatedAt: string
  scenario: ScenarioName
  dryRun: boolean
  endpoint: string
  headerSummary: {
    'asaas-access-token': string
    'content-type': 'application/json'
  }
  payload: unknown
  response?: {
    status: number
    body: unknown
    rawBody?: string
  }
}

function normalizeEnvValue(value: string): string {
  const trimmed = value.trim()

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
    || (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }

  return trimmed
}

async function loadEnvFile(envFile: string): Promise<void> {
  const envPath = path.join(process.cwd(), envFile)
  const fileContents = await readFile(envPath, 'utf8')

  for (const rawLine of fileContents.split(/\r?\n/)) {
    const line = rawLine.trim()

    if (!line || line.startsWith('#')) {
      continue
    }

    const separatorIndex = line.indexOf('=')
    if (separatorIndex === -1) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    const value = normalizeEnvValue(line.slice(separatorIndex + 1))

    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

function redactSecret(secret: string): string {
  if (secret.length <= 8) {
    return `${secret.slice(0, 2)}***`
  }

  return `${secret.slice(0, 4)}...${secret.slice(-4)}`
}

function sanitizeExternalReference(checkoutReference: string, appUserId?: string): string {
  if (appUserId) {
    return `curria:v1:u:${appUserId}:c:${checkoutReference}`
  }

  return `curria:v1:c:${checkoutReference}`
}

function resolveRequiredString(
  label: string,
  value: string | undefined,
  fallback: string,
  dryRun: boolean,
): string {
  if (value && value.trim().length > 0) {
    return value.trim()
  }

  if (dryRun) {
    return fallback
  }

  throw new Error(`Missing required option for live replay: ${label}`)
}

function resolveRequiredNumber(
  label: string,
  value: number | undefined,
  fallback: number,
  dryRun: boolean,
): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (dryRun) {
    return fallback
  }

  throw new Error(`Missing required numeric option for live replay: ${label}`)
}

function printHelp(): void {
  console.log([
    'Usage:',
    '  npx tsx scripts/replay-staging-asaas.ts --list-scenarios',
    '  npx tsx scripts/replay-staging-asaas.ts --scenario <name> [options]',
    '',
    'Core options:',
    '  --list-scenarios           List committed Phase 3 scenarios',
    '  --scenario <name>          Scenario to replay',
    '  --dry-run                  Print the request without sending it',
    '  --output <file>            Write request/response artifact JSON to a file',
    '  --env-file <path>          Load a specific env file instead of .env.staging',
    '  --api-url <url>            Override STAGING_API_URL',
    '',
    'Identifier options:',
    '  --payment <id>             Payment id used in payment scenarios',
    '  --subscription <id>        Subscription id used in recurring scenarios',
    '  --checkout <ref>           Checkout reference (for externalReference)',
    '  --checkout-session <id>    Hosted checkoutSession id',
    '  --app-user <id>            App user id to emit the current checkout-created reference shape',
    '',
    'Value overrides:',
    '  --value <decimal>          Override payment/subscription value in BRL',
    '  --event <type>             Override the default event type for the selected scenario',
    '  --due-date <YYYY-MM-DD>    Override payment dueDate',
    '',
    'Notes:',
    '  - If --app-user is provided, externalReference becomes curria:v1:u:<user>:c:<checkout>.',
    '  - If --app-user is omitted, externalReference becomes curria:v1:c:<checkout>.',
    '  - This is intentional because Phase 3 still needs to validate which shape is canonical in staging.',
  ].join('\n'))
}

const scenarios: Record<ScenarioName, ScenarioDefinition> = {
  one_time_settlement: {
    name: 'one_time_settlement',
    summary: 'Settled one-time payment should grant credits once and mark checkout paid.',
    requires: ['--payment', '--checkout'],
    recommendedPrep: 'Use a freshly created unit checkout that is still in created status.',
    buildPayload(context) {
      const paymentId = resolveRequiredString('--payment', context.paymentId, 'pay_demo_one_time', context.dryRun)
      const checkoutReference = resolveRequiredString('--checkout', context.checkoutReference, 'chk_demo_unit_001', context.dryRun)
      const value = resolveRequiredNumber('--value', context.valueOverride, 19.9, context.dryRun)

      return {
        event: context.eventOverride ?? 'PAYMENT_RECEIVED',
        payment: {
          id: paymentId,
          externalReference: sanitizeExternalReference(checkoutReference, context.appUserId),
          subscription: null,
          value,
        },
      }
    },
  },
  inactive_subscription_snapshot: {
    name: 'inactive_subscription_snapshot',
    summary: 'Inactive or deleted subscription snapshots must be ignored and may cancel a pending checkout.',
    requires: ['--subscription', '--checkout'],
    recommendedPrep: 'Point at a pending monthly or pro checkout whose activation should not proceed.',
    buildPayload(context) {
      const subscriptionId = resolveRequiredString('--subscription', context.subscriptionId, 'sub_demo_inactive', context.dryRun)
      const checkoutReference = resolveRequiredString('--checkout', context.checkoutReference, 'chk_demo_monthly_inactive', context.dryRun)
      const value = resolveRequiredNumber('--value', context.valueOverride, 39, context.dryRun)

      return {
        event: context.eventOverride ?? 'SUBSCRIPTION_CREATED',
        subscription: {
          id: subscriptionId,
          externalReference: sanitizeExternalReference(checkoutReference, context.appUserId),
          status: 'INACTIVE',
          deleted: true,
          value,
        },
      }
    },
  },
  initial_recurring_activation: {
    name: 'initial_recurring_activation',
    summary: 'First settled recurring payment should activate the subscription and grant monthly credits.',
    requires: ['--payment', '--subscription', '--checkout'],
    recommendedPrep: 'Use a freshly created recurring checkout before any settlement event has been processed.',
    buildPayload(context) {
      const paymentId = resolveRequiredString('--payment', context.paymentId, 'pay_demo_recurring_start', context.dryRun)
      const subscriptionId = resolveRequiredString('--subscription', context.subscriptionId, 'sub_demo_start', context.dryRun)
      const checkoutReference = resolveRequiredString('--checkout', context.checkoutReference, 'chk_demo_monthly_start', context.dryRun)
      const value = resolveRequiredNumber('--value', context.valueOverride, 39.9, context.dryRun)

      return {
        event: context.eventOverride ?? 'PAYMENT_CONFIRMED',
        payment: {
          id: paymentId,
          externalReference: sanitizeExternalReference(checkoutReference, context.appUserId),
          subscription: subscriptionId,
          value,
          dueDate: context.dueDate ?? '2099-12-29',
        },
      }
    },
  },
  renewal_replace_balance: {
    name: 'renewal_replace_balance',
    summary: 'Recurring renewal should replace balance once for an already active subscription.',
    requires: ['--payment', '--subscription', '--checkout'],
    recommendedPrep: 'Start from an active recurring subscription that already has persisted metadata.',
    buildPayload(context) {
      const paymentId = resolveRequiredString('--payment', context.paymentId, 'pay_demo_renewal', context.dryRun)
      const subscriptionId = resolveRequiredString('--subscription', context.subscriptionId, 'sub_demo_renewal', context.dryRun)
      const checkoutReference = resolveRequiredString('--checkout', context.checkoutReference, 'chk_demo_monthly_active', context.dryRun)
      const value = resolveRequiredNumber('--value', context.valueOverride, 39.9, context.dryRun)

      return {
        event: context.eventOverride ?? 'PAYMENT_RECEIVED',
        payment: {
          id: paymentId,
          externalReference: sanitizeExternalReference(checkoutReference, context.appUserId),
          subscription: subscriptionId,
          value,
          dueDate: context.dueDate ?? '2099-12-29',
        },
      }
    },
  },
  cancellation_metadata_only: {
    name: 'cancellation_metadata_only',
    summary: 'Cancellation or inactivation should update subscription metadata without revoking credits.',
    requires: ['--subscription'],
    recommendedPrep: 'Use an active recurring subscription whose metadata is already persisted in user_quotas.',
    buildPayload(context) {
      const subscriptionId = resolveRequiredString('--subscription', context.subscriptionId, 'sub_demo_cancel', context.dryRun)

      return {
        event: context.eventOverride ?? 'SUBSCRIPTION_INACTIVATED',
        subscription: {
          id: subscriptionId,
          externalReference: context.checkoutReference
            ? sanitizeExternalReference(context.checkoutReference, context.appUserId)
            : null,
        },
      }
    },
  },
  duplicate_delivery: {
    name: 'duplicate_delivery',
    summary: 'Replay the same settled economic event twice and confirm the second delivery is cached or duplicate.',
    requires: ['--payment', '--checkout'],
    recommendedPrep: 'Use the same identifiers as a previously processed settlement event.',
    buildPayload(context) {
      const paymentId = resolveRequiredString('--payment', context.paymentId, 'pay_demo_duplicate', context.dryRun)
      const checkoutReference = resolveRequiredString('--checkout', context.checkoutReference, 'chk_demo_duplicate', context.dryRun)
      const value = resolveRequiredNumber('--value', context.valueOverride, 19.9, context.dryRun)

      return {
        event: context.eventOverride ?? 'PAYMENT_RECEIVED',
        payment: {
          id: paymentId,
          externalReference: sanitizeExternalReference(checkoutReference, context.appUserId),
          subscription: context.subscriptionId ?? null,
          value,
          dueDate: context.dueDate,
        },
      }
    },
  },
  partial_success_reconcile: {
    name: 'partial_success_reconcile',
    summary: 'Replay a previously processed payment to reconcile stale checkout state without a second credit mutation.',
    requires: ['--payment', '--checkout'],
    recommendedPrep: 'Use a processed settlement after confirming the economic mutation already exists but checkout state is stale.',
    buildPayload(context) {
      const paymentId = resolveRequiredString('--payment', context.paymentId, 'pay_demo_partial_reconcile', context.dryRun)
      const checkoutReference = resolveRequiredString('--checkout', context.checkoutReference, 'chk_demo_partial_reconcile', context.dryRun)
      const value = resolveRequiredNumber('--value', context.valueOverride, 19.9, context.dryRun)

      return {
        event: context.eventOverride ?? 'PAYMENT_RECEIVED',
        payment: {
          id: paymentId,
          externalReference: sanitizeExternalReference(checkoutReference, context.appUserId),
          checkoutSession: context.checkoutSession ?? null,
          subscription: context.subscriptionId ?? null,
          value,
          dueDate: context.dueDate,
        },
      }
    },
  },
}

function listScenarios(): void {
  console.log('Phase 3 staging replay scenarios:\n')

  for (const scenario of Object.values(scenarios)) {
    console.log(`- ${scenario.name}`)
    console.log(`  ${scenario.summary}`)
    console.log(`  Requires: ${scenario.requires.join(', ') || 'none'}`)
    console.log(`  Prep: ${scenario.recommendedPrep}`)
    console.log('')
  }
}

async function writeArtifact(filePath: string, artifact: ReplayArtifact): Promise<void> {
  const resolvedPath = path.resolve(process.cwd(), filePath)
  await mkdir(path.dirname(resolvedPath), { recursive: true })
  await writeFile(resolvedPath, `${JSON.stringify(artifact, null, 2)}\n`)
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      help: { type: 'boolean' },
      'list-scenarios': { type: 'boolean' },
      scenario: { type: 'string' },
      'dry-run': { type: 'boolean' },
      output: { type: 'string' },
      'env-file': { type: 'string' },
      'api-url': { type: 'string' },
      payment: { type: 'string' },
      subscription: { type: 'string' },
      checkout: { type: 'string' },
      'checkout-session': { type: 'string' },
      'app-user': { type: 'string' },
      value: { type: 'string' },
      event: { type: 'string' },
      'due-date': { type: 'string' },
    },
    allowPositionals: false,
  })

  if (values.help) {
    printHelp()
    return
  }

  if (values['list-scenarios']) {
    listScenarios()
    return
  }

  const scenarioName = values.scenario as ScenarioName | undefined
  if (!scenarioName || !(scenarioName in scenarios)) {
    printHelp()
    throw new Error('A valid --scenario is required unless --list-scenarios is used.')
  }

  const envFile = values['env-file'] ?? '.env.staging'
  await loadEnvFile(envFile)

  const endpointBase = values['api-url'] ?? process.env.STAGING_API_URL
  const token = process.env.STAGING_ASAAS_WEBHOOK_TOKEN

  if (!endpointBase) {
    throw new Error(`Missing STAGING_API_URL. Populate ${envFile} or pass --api-url.`)
  }

  if (!token) {
    throw new Error(`Missing STAGING_ASAAS_WEBHOOK_TOKEN. Populate ${envFile} before replaying staging events.`)
  }

  const endpoint = `${endpointBase.replace(/\/+$/, '')}/api/webhook/asaas`
  const dryRun = values['dry-run'] ?? false
  const valueOverride = values.value ? Number(values.value) : undefined

  if (values.value && !Number.isFinite(valueOverride)) {
    throw new Error(`Invalid --value: ${values.value}`)
  }

  const payload = scenarios[scenarioName].buildPayload({
    dryRun,
    paymentId: values.payment,
    subscriptionId: values.subscription,
    checkoutReference: values.checkout,
    checkoutSession: values['checkout-session'],
    appUserId: values['app-user'],
    valueOverride,
    eventOverride: values.event,
    dueDate: values['due-date'],
  })

  const artifact: ReplayArtifact = {
    generatedAt: new Date().toISOString(),
    scenario: scenarioName,
    dryRun,
    endpoint,
    headerSummary: {
      'asaas-access-token': redactSecret(token),
      'content-type': 'application/json',
    },
    payload,
  }

  if (dryRun) {
    console.log(`Dry run for ${scenarioName}`)
    console.log(`Endpoint: ${endpoint}`)
    console.log(`Token: ${artifact.headerSummary['asaas-access-token']}`)
    console.log(JSON.stringify(payload, null, 2))

    if (values.output) {
      await writeArtifact(values.output, artifact)
      console.log(`Artifact written to ${path.resolve(process.cwd(), values.output)}`)
    }
    return
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'asaas-access-token': token,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const rawBody = await response.text()
  let body: unknown = rawBody

  try {
    body = JSON.parse(rawBody)
  } catch {
    // Keep raw response body when it is not JSON.
  }

  artifact.response = {
    status: response.status,
    body,
    rawBody: typeof body === 'string' ? rawBody : undefined,
  }

  console.log(`Scenario ${scenarioName} -> HTTP ${response.status}`)
  console.log(typeof body === 'string' ? body : JSON.stringify(body, null, 2))

  if (values.output) {
    await writeArtifact(values.output, artifact)
    console.log(`Artifact written to ${path.resolve(process.cwd(), values.output)}`)
  }
}

main().catch((error) => {
  console.error('[replay-staging-asaas] Failed:', error instanceof Error ? error.message : error)
  process.exitCode = 1
})
