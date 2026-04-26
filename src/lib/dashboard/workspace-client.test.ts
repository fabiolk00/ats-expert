import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getDownloadUrls, isRetryableDownloadLookupError } from './workspace-client'

function createJsonResponse(body: unknown, status = 200) {
  return {
    ok: status < 400,
    status,
    json: async () => body,
  }
}

describe('workspace-client download recovery', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('retries once with the suggested session id when the backend flags a stale reference', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(createJsonResponse({
        error: 'Download session reference is stale.',
        code: 'DOWNLOAD_SESSION_STALE_REFERENCE',
        retryable: true,
        suggestedSessionId: 'sess_fresh_456',
      }, 404))
      .mockResolvedValueOnce(createJsonResponse({
        available: true,
        docxUrl: null,
        pdfUrl: 'https://files.curria.test/cv.pdf',
        pdfFileName: 'Curriculo_Ana.pdf',
        generationStatus: 'ready',
      }))
    const onSessionIdRecovered = vi.fn()

    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

    await expect(
      getDownloadUrls('sess_stale_123', undefined, {
        trigger: 'profile_last_generated',
        onSessionIdRecovered,
      }),
    ).resolves.toMatchObject({
      pdfUrl: 'https://files.curria.test/cv.pdf',
      pdfFileName: 'Curriculo_Ana.pdf',
      generationStatus: 'ready',
    })

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/file/sess_stale_123?trigger=profile_last_generated',
      undefined,
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/file/sess_fresh_456?trigger=profile_last_generated',
      undefined,
    )
    expect(onSessionIdRecovered).toHaveBeenCalledWith('sess_fresh_456')
  })

  it('still surfaces stale-reference errors as retryable when target recovery is not allowed', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(createJsonResponse({
        error: 'Download session reference is stale.',
        code: 'DOWNLOAD_SESSION_STALE_REFERENCE',
        retryable: true,
        suggestedSessionId: 'sess_fresh_456',
      }, 404))

    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

    let thrownError: unknown

    try {
      await getDownloadUrls('sess_stale_123', 'target_123', {
        trigger: 'preview_panel',
      })
    } catch (error) {
      thrownError = error
    }

    expect(isRetryableDownloadLookupError(thrownError)).toBe(true)
  })
})
