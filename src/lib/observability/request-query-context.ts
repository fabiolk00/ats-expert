import { AsyncLocalStorage } from 'node:async_hooks'

import {
  buildQueryFingerprint,
  type QueryPatternStat,
} from '@/lib/observability/query-fingerprint'

export type RequestQueryContext = {
  requestId: string
  requestMethod: string
  requestPath: string
  startedAt: number
  queryCount: number
  queries: string[]
  patternStats: Map<string, QueryPatternStat>
  completed: boolean
}

const MAX_QUERIES_TO_SAMPLE = 20
const MAX_QUERY_LENGTH = 300

const requestQueryStorage = new AsyncLocalStorage<RequestQueryContext>()

export function runWithRequestQueryContext<T>(
  input: {
    requestId: string
    requestMethod: string
    requestPath: string
  },
  run: () => Promise<T>,
): Promise<T> {
  return requestQueryStorage.run(
    {
      requestId: input.requestId,
      requestMethod: input.requestMethod,
      requestPath: input.requestPath,
      startedAt: Date.now(),
      queryCount: 0,
      queries: [],
      patternStats: new Map(),
      completed: false,
    },
    run,
  )
}

export function recordQuery(query: string): void {
  const context = requestQueryStorage.getStore()
  if (!context || context.completed) {
    return
  }

  context.queryCount += 1

  if (context.queries.length < MAX_QUERIES_TO_SAMPLE) {
    context.queries.push(query.slice(0, MAX_QUERY_LENGTH))
  }

  const fingerprint = buildQueryFingerprint(query)
  const existingStat = context.patternStats.get(fingerprint)

  if (existingStat) {
    existingStat.count += 1
    return
  }

  context.patternStats.set(fingerprint, {
    fingerprint,
    sample: query.slice(0, MAX_QUERY_LENGTH),
    count: 1,
  })
}

export function getRequestQueryContext(): RequestQueryContext | null {
  return requestQueryStorage.getStore() ?? null
}
