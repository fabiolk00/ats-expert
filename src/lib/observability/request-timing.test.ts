import { describe, expect, it, vi } from 'vitest'

import { createRequestTimingTracker } from './request-timing'

describe('request-timing', () => {
  it('tracks named stage durations and first-response markers', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-14T12:00:00.000Z'))

    const timing = createRequestTimingTracker(Date.now())

    timing.startStage('auth')
    vi.advanceTimersByTime(15)
    expect(timing.endStage('auth')).toBe(15)

    const resultPromise = timing.runStage('body_parse', async () => {
      vi.advanceTimersByTime(9)
      return 'ok'
    })

    await expect(resultPromise).resolves.toBe('ok')

    vi.advanceTimersByTime(11)
    timing.markFirstSseChunk()
    vi.advanceTimersByTime(7)
    timing.markFirstStatusChunk()
    vi.advanceTimersByTime(5)
    timing.markFirstAssistantText()

    expect(timing.snapshot()).toMatchObject({
      totalLatencyMs: 47,
      firstSseChunkMs: 35,
      firstStatusChunkMs: 42,
      firstAssistantTextMs: 47,
      stageAuthMs: 15,
      stageBodyParseMs: 9,
    })

    vi.useRealTimers()
  })

  it('keeps first markers idempotent when called multiple times', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-14T12:00:00.000Z'))

    const timing = createRequestTimingTracker(Date.now())

    vi.advanceTimersByTime(20)
    timing.markFirstSseChunk()
    timing.markFirstStatusChunk()
    timing.markFirstAssistantText()

    vi.advanceTimersByTime(50)
    timing.markFirstSseChunk()
    timing.markFirstStatusChunk()
    timing.markFirstAssistantText()

    expect(timing.snapshot()).toMatchObject({
      firstSseChunkMs: 20,
      firstStatusChunkMs: 20,
      firstAssistantTextMs: 20,
    })

    vi.useRealTimers()
  })
})
