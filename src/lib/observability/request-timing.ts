type TimingSnapshot = {
  totalLatencyMs: number
  firstSseChunkMs?: number
  firstStatusChunkMs?: number
  firstAssistantTextMs?: number
} & Record<string, number | undefined>

function toStageFieldName(stageName: string): string {
  return `stage${stageName
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')}Ms`
}

export function createRequestTimingTracker(startedAt = Date.now()) {
  const stageStarts = new Map<string, number>()
  const stageDurations = new Map<string, number>()
  let firstSseChunkMs: number | undefined
  let firstStatusChunkMs: number | undefined
  let firstAssistantTextMs: number | undefined

  return {
    startStage(stageName: string): void {
      stageStarts.set(stageName, Date.now())
    },
    endStage(stageName: string): number | undefined {
      const stageStartedAt = stageStarts.get(stageName)
      if (stageStartedAt === undefined) {
        return stageDurations.get(stageName)
      }

      const durationMs = Date.now() - stageStartedAt
      stageDurations.set(stageName, durationMs)
      stageStarts.delete(stageName)
      return durationMs
    },
    runStage<T>(stageName: string, work: () => Promise<T>): Promise<T> {
      this.startStage(stageName)
      return work().finally(() => {
        this.endStage(stageName)
      })
    },
    markFirstSseChunk(): void {
      if (firstSseChunkMs === undefined) {
        firstSseChunkMs = Date.now() - startedAt
      }
    },
    markFirstStatusChunk(): void {
      if (firstStatusChunkMs === undefined) {
        firstStatusChunkMs = Date.now() - startedAt
      }
    },
    markFirstAssistantText(): void {
      if (firstAssistantTextMs === undefined) {
        firstAssistantTextMs = Date.now() - startedAt
      }
    },
    snapshot(): TimingSnapshot {
      const stageFields = Object.fromEntries(
        Array.from(stageDurations.entries(), ([stageName, durationMs]) => [toStageFieldName(stageName), durationMs]),
      )

      return {
        totalLatencyMs: Date.now() - startedAt,
        firstSseChunkMs,
        firstStatusChunkMs,
        firstAssistantTextMs,
        ...stageFields,
      }
    },
  }
}
