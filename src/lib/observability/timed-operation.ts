import { logInfo, logWarn, serializeError } from '@/lib/observability/structured-log'

export async function withTimedOperation<T>(input: {
  operation: string
  generationIntentKey?: string
  appUserId: string
  run: () => Promise<T>
  onFailure?: (error: unknown) => Record<string, unknown>
}): Promise<T> {
  const startedAt = Date.now()

  try {
    const result = await input.run()

    logInfo('export.operation_timing', {
      operation: input.operation,
      success: true,
      durationMs: Date.now() - startedAt,
      generationIntentKey: input.generationIntentKey,
      appUserId: input.appUserId,
    })

    return result
  } catch (error) {
    const failureFields = input.onFailure ? input.onFailure(error) : {}

    logWarn('export.operation_timing', {
      operation: input.operation,
      success: false,
      durationMs: Date.now() - startedAt,
      generationIntentKey: input.generationIntentKey,
      appUserId: input.appUserId,
      ...failureFields,
      ...serializeError(error),
    })

    throw error
  }
}

