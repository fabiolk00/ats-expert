import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { parseArgs } from 'node:util'

type JsonRow = Record<string, unknown>

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

function printHelp(): void {
  console.log([
    'Usage:',
    '  npx tsx scripts/check-staging-billing-state.ts --user <id>',
    '  npx tsx scripts/check-staging-billing-state.ts --checkout <ref>',
    '  npx tsx scripts/check-staging-billing-state.ts --subscription <id>',
    '',
    'Options:',
    '  --user <id>            Filter rows by user id',
    '  --checkout <ref>       Filter rows by checkout reference',
    '  --subscription <id>    Filter rows by Asaas subscription id',
    '  --env-file <path>      Load a specific env file instead of .env.staging',
    '  --help                 Show this help text',
    '',
    'The snapshot includes:',
    '  - billing_checkouts',
    '  - credit_accounts',
    '  - user_quotas',
    '  - processed_events',
    '',
    'Requirements:',
    '  - psql must be installed and available on PATH',
    '  - STAGING_DB_URL must be set in the chosen env file',
  ].join('\n'))
}

function escapeSqlLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`
}

function runPsqlJsonQuery(databaseUrl: string, sql: string): JsonRow[] {
  const query = `SELECT COALESCE(json_agg(row_to_json(result_row)), '[]'::json)
FROM (
${sql}
) AS result_row;`

  const result = spawnSync('psql', ['-X', '-t', '-A', '-d', databaseUrl, '-c', query], {
    encoding: 'utf8',
  })

  if (result.error) {
    if (result.error.message.includes('ENOENT')) {
      throw new Error('psql is required for staging billing snapshots but was not found on PATH.')
    }

    throw result.error
  }

  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || 'psql query failed')
  }

  const stdout = result.stdout.trim()
  if (!stdout) {
    return []
  }

  return JSON.parse(stdout) as JsonRow[]
}

function unique(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value && value.trim().length > 0))))
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      help: { type: 'boolean' },
      user: { type: 'string' },
      checkout: { type: 'string' },
      subscription: { type: 'string' },
      'env-file': { type: 'string' },
    },
    allowPositionals: false,
  })

  if (values.help) {
    printHelp()
    return
  }

  if (!values.user && !values.checkout && !values.subscription) {
    printHelp()
    throw new Error('At least one filter is required: --user, --checkout, or --subscription.')
  }

  const envFile = values['env-file'] ?? '.env.staging'
  await loadEnvFile(envFile)

  const databaseUrl = process.env.STAGING_DB_URL
  if (!databaseUrl) {
    throw new Error(`Missing STAGING_DB_URL. Populate ${envFile} before requesting staging billing snapshots.`)
  }

  const checkoutClauses = [
    values.user ? `user_id = ${escapeSqlLiteral(values.user)}` : null,
    values.checkout ? `checkout_reference = ${escapeSqlLiteral(values.checkout)}` : null,
    values.subscription ? `asaas_subscription_id = ${escapeSqlLiteral(values.subscription)}` : null,
  ].filter((clause): clause is string => Boolean(clause))

  const billingCheckouts = runPsqlJsonQuery(
    databaseUrl,
    `SELECT id, user_id, checkout_reference, plan, amount_minor, currency, status, asaas_link, asaas_payment_id, asaas_subscription_id, created_at, updated_at
     FROM billing_checkouts
     WHERE ${checkoutClauses.join(' OR ')}
     ORDER BY created_at DESC`,
  )

  const discoveredUserIds = unique([
    values.user,
    ...billingCheckouts.map((row) => (typeof row.user_id === 'string' ? row.user_id : null)),
  ])
  const discoveredCheckoutRefs = unique([
    values.checkout,
    ...billingCheckouts.map((row) => (typeof row.checkout_reference === 'string' ? row.checkout_reference : null)),
  ])
  const discoveredSubscriptionIds = unique([
    values.subscription,
    ...billingCheckouts.map((row) => (typeof row.asaas_subscription_id === 'string' ? row.asaas_subscription_id : null)),
  ])

  const creditAccounts = discoveredUserIds.length > 0
    ? runPsqlJsonQuery(
      databaseUrl,
      `SELECT id, user_id, credits_remaining, created_at, updated_at
       FROM credit_accounts
       WHERE user_id IN (${discoveredUserIds.map(escapeSqlLiteral).join(', ')})
       ORDER BY updated_at DESC`,
    )
    : []

  const userQuotas = (() => {
    const quotaClauses = [
      discoveredUserIds.length > 0
        ? `user_id IN (${discoveredUserIds.map(escapeSqlLiteral).join(', ')})`
        : null,
      discoveredSubscriptionIds.length > 0
        ? `asaas_subscription_id IN (${discoveredSubscriptionIds.map(escapeSqlLiteral).join(', ')})`
        : null,
    ].filter((clause): clause is string => Boolean(clause))

    if (quotaClauses.length === 0) {
      return [] as JsonRow[]
    }

    return runPsqlJsonQuery(
      databaseUrl,
      `SELECT id, user_id, plan, credits_remaining, asaas_customer_id, asaas_subscription_id, renews_at, status, created_at, updated_at
       FROM user_quotas
       WHERE ${quotaClauses.join(' OR ')}
       ORDER BY updated_at DESC`,
    )
  })()

  const processedEventClauses: string[] = []

  if (discoveredSubscriptionIds.length > 0) {
    const sqlValues = discoveredSubscriptionIds.map(escapeSqlLiteral).join(', ')
    processedEventClauses.push(`COALESCE(event_payload->'payment'->>'subscription', event_payload->'subscription'->>'id') IN (${sqlValues})`)
  }

  if (discoveredCheckoutRefs.length > 0) {
    for (const checkoutReference of discoveredCheckoutRefs) {
      const shortRef = escapeSqlLiteral(`curria:v1:c:${checkoutReference}`)
      processedEventClauses.push(`COALESCE(event_payload->'payment'->>'externalReference', event_payload->'subscription'->>'externalReference') = ${shortRef}`)
    }
  }

  if (discoveredCheckoutRefs.length > 0 && discoveredUserIds.length > 0) {
    for (const checkoutReference of discoveredCheckoutRefs) {
      for (const userId of discoveredUserIds) {
        const legacyV1Ref = escapeSqlLiteral(`curria:v1:u:${userId}:c:${checkoutReference}`)
        processedEventClauses.push(`COALESCE(event_payload->'payment'->>'externalReference', event_payload->'subscription'->>'externalReference') = ${legacyV1Ref}`)
      }
    }
  }

  const processedEvents = processedEventClauses.length > 0
    ? runPsqlJsonQuery(
      databaseUrl,
      `SELECT id, event_id, event_type, event_fingerprint, processed_at, created_at, event_payload
       FROM processed_events
       WHERE ${processedEventClauses.join(' OR ')}
       ORDER BY processed_at DESC`,
    )
    : []

  const snapshot = {
    generatedAt: new Date().toISOString(),
    filters: {
      userId: values.user ?? null,
      checkoutReference: values.checkout ?? null,
      subscriptionId: values.subscription ?? null,
    },
    discovered: {
      userIds: discoveredUserIds,
      checkoutReferences: discoveredCheckoutRefs,
      subscriptionIds: unique([
        ...discoveredSubscriptionIds,
        ...userQuotas.map((row) => (typeof row.asaas_subscription_id === 'string' ? row.asaas_subscription_id : null)),
      ]),
    },
    billing_checkouts: billingCheckouts,
    credit_accounts: creditAccounts,
    user_quotas: userQuotas,
    processed_events: processedEvents,
  }

  console.log(JSON.stringify(snapshot, null, 2))
}

main().catch((error) => {
  console.error('[check-staging-billing-state] Failed:', error instanceof Error ? error.message : error)
  process.exitCode = 1
})
