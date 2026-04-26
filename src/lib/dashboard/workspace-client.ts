import type {
  GeneratedOutput,
  ManualEditInput,
  ResumeEditorSaveInput,
  ResumeEditorSaveOutput,
} from '@/types/agent'
import type {
  BillingHistoryResponse,
  DownloadUrlsResponse,
  GenerateResumeResponse,
  ResumeComparisonResponse,
  ResumeGenerationHistoryResponse,
  SessionWorkspace,
} from '@/types/dashboard'

class DashboardApiError extends Error {
  status: number
  code?: string
  payload?: unknown
  retryable?: boolean
  retryAfterMs?: number

  constructor(
    message: string,
    status: number,
    options?: {
      code?: string
      payload?: unknown
      retryable?: boolean
      retryAfterMs?: number
    },
  ) {
    super(message)
    this.name = 'DashboardApiError'
    this.status = status
    this.code = options?.code
    this.payload = options?.payload
    this.retryable = options?.retryable
    this.retryAfterMs = options?.retryAfterMs
  }
}

async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init)
  const payload = await response.json() as unknown

  if (!response.ok) {
    const message = typeof payload === 'object' && payload !== null && 'error' in payload
      ? String((payload as { error: unknown }).error)
      : 'Request failed.'
    const code = typeof payload === 'object' && payload !== null && 'code' in payload
      ? String((payload as { code: unknown }).code)
      : undefined
    const retryable = typeof payload === 'object' && payload !== null && 'retryable' in payload
      ? (payload as { retryable: unknown }).retryable === true
      : undefined
    const retryAfterMs = typeof payload === 'object' && payload !== null && 'retryAfterMs' in payload
      ? Number((payload as { retryAfterMs: unknown }).retryAfterMs)
      : undefined
    throw new DashboardApiError(message, response.status, {
      code,
      payload,
      retryable,
      retryAfterMs: Number.isFinite(retryAfterMs) ? retryAfterMs : undefined,
    })
  }

  return payload as T
}

export function isExportAlreadyProcessingError(error: unknown): error is DashboardApiError {
  return error instanceof DashboardApiError && error.code === 'EXPORT_ALREADY_PROCESSING'
}

export type DownloadLookupTrigger =
  | 'post_generation'
  | 'preview_panel'
  | 'profile_last_generated'

export function isRetryableDownloadLookupError(error: unknown): error is DashboardApiError {
  return error instanceof DashboardApiError
    && error.retryable === true
    && (error.code === 'DOWNLOAD_SESSION_LOOKUP_FAILED' || error.code === 'DOWNLOAD_SESSION_NOT_READY')
}

export async function getSessionWorkspace(sessionId: string): Promise<SessionWorkspace> {
  return requestJson<SessionWorkspace>(`/api/session/${sessionId}`)
}

export async function getResumeComparison(sessionId: string): Promise<ResumeComparisonResponse> {
  return requestJson<ResumeComparisonResponse>(`/api/session/${sessionId}/comparison`)
}

export async function manualEditBaseSection(
  sessionId: string,
  input: ManualEditInput,
): Promise<{ changed: boolean }> {
  const response = await requestJson<{
    success: true
    section: string
    section_data: unknown
    changed: boolean
  }>(`/api/session/${sessionId}/manual-edit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  return {
    changed: response.changed,
  }
}

export async function saveEditedResume(
  sessionId: string,
  input: ResumeEditorSaveInput,
): Promise<{ changed: boolean }> {
  const response = await requestJson<Extract<ResumeEditorSaveOutput, { success: true }>>(
    `/api/session/${sessionId}/manual-edit`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    },
  )

  return {
    changed: response.changed,
  }
}

export async function generateResume(
  sessionId: string,
  input: { scope: 'base' } | { scope: 'target'; targetId: string },
  clientRequestId?: string,
): Promise<GenerateResumeResponse> {
  return requestJson<GenerateResumeResponse>(
    `/api/session/${sessionId}/generate`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...input,
        clientRequestId,
      }),
    },
  )
}

export async function getDownloadUrls(
  sessionId: string,
  targetId?: string,
  options?: { trigger?: DownloadLookupTrigger },
): Promise<DownloadUrlsResponse> {
  const searchParams = new URLSearchParams()

  if (targetId) {
    searchParams.set('targetId', targetId)
  }

  if (options?.trigger) {
    searchParams.set('trigger', options.trigger)
  }

  const suffix = searchParams.size > 0 ? `?${searchParams.toString()}` : ''
  return requestJson<DownloadUrlsResponse>(
    `/api/file/${sessionId}${suffix}`,
  )
}

export async function getBillingHistory(limit = 10): Promise<BillingHistoryResponse> {
  const searchParams = new URLSearchParams({
    limit: String(limit),
  })

  return requestJson<BillingHistoryResponse>(`/api/billing/history?${searchParams.toString()}`)
}

export async function getResumeGenerationHistory(
  page = 1,
  limit = 4,
): Promise<ResumeGenerationHistoryResponse> {
  const searchParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  })

  return requestJson<ResumeGenerationHistoryResponse>(
    `/api/profile/resume-generations?${searchParams.toString()}`,
  )
}

export function isGeneratedOutputReady(generatedOutput?: GeneratedOutput): boolean {
  return generatedOutput?.status === 'ready'
    && (Boolean(generatedOutput.pdfPath) || generatedOutput.previewAccess?.locked === true)
}
