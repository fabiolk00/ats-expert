import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { usePreviewPanel } from '@/context/preview-panel-context'
import {
  getDownloadUrls,
  getSessionWorkspace,
  isRetryableDownloadLookupError,
} from '@/lib/dashboard/workspace-client'

import { PreviewPanel } from './preview-panel'

vi.mock('@/context/preview-panel-context', () => ({
  usePreviewPanel: vi.fn(),
}))

vi.mock('@/hooks/use-preview-panel-overlay', () => ({
  usePreviewPanelOverlay: () => false,
}))

vi.mock('@/lib/dashboard/workspace-client', () => ({
  getDownloadUrls: vi.fn(),
  getSessionWorkspace: vi.fn(),
  isRetryableDownloadLookupError: vi.fn(() => false),
}))

vi.mock('./resume-editor-modal', () => ({
  ResumeEditorModal: ({
    open,
    scope,
    onOpenChange,
    onSaved,
  }: {
    open: boolean
    scope?: string
    onOpenChange: (open: boolean) => void
    onSaved: () => void
  }) => (
      <div>
        <div data-testid="resume-editor-state">{open ? 'open' : 'closed'}</div>
        <div data-testid="resume-editor-scope">{scope ?? 'base'}</div>
      <button type="button" onClick={() => onOpenChange(true)}>simulate modal open</button>
      <button type="button" onClick={onSaved}>trigger saved</button>
    </div>
  ),
}))

describe('PreviewPanel', () => {
  const close = vi.fn()
  const getCachedUrl = vi.fn()
  const setCachedUrl = vi.fn()
  const invalidateCache = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(isRetryableDownloadLookupError).mockReturnValue(false)
    vi.mocked(usePreviewPanel).mockReturnValue({
      isOpen: false,
      file: null,
      open: vi.fn(),
      close,
      getCachedUrl,
      setCachedUrl,
      invalidateCache,
    })
    getCachedUrl.mockReturnValue(null)
    vi.mocked(getDownloadUrls).mockResolvedValue({
      available: true,
      docxUrl: 'https://example.com/resume.docx',
      pdfUrl: 'https://example.com/resume.pdf',
      generationStatus: 'ready',
      previewLock: undefined,
    })
    vi.mocked(getSessionWorkspace).mockResolvedValue({
      session: {
        id: 'sess_123',
        phase: 'generation',
        stateVersion: 1,
        cvState: {} as never,
        agentState: {
          parseStatus: 'parsed',
          optimizedCvState: { summary: 'optimized' } as never,
        },
        generatedOutput: { status: 'ready' },
        messageCount: 0,
        creditConsumed: true,
        createdAt: '2026-04-21T00:00:00.000Z',
        updatedAt: '2026-04-21T00:00:00.000Z',
      },
      jobs: [],
      targets: [],
    })
  })

  it('opens the editor from the toolbar and refreshes URLs after save', async () => {
    render(
      <PreviewPanel
        inline
        showCloseButton={false}
        fileOverride={{
          sessionId: 'sess_123',
          targetId: 'target_123',
          type: 'pdf',
          label: 'Resume',
        }}
      />,
    )

    await waitFor(() => {
      expect(getDownloadUrls).toHaveBeenCalledTimes(1)
    })

    expect(screen.getByTestId('preview-panel')).toHaveAttribute('data-session-id', 'sess_123')
    expect(screen.getByTestId('preview-panel')).toHaveAttribute('data-state', 'ready')
    expect(screen.getByTestId('preview-panel')).toHaveAttribute('data-preview-url', 'https://example.com/resume.pdf')
    expect(screen.getByTestId('preview-panel-frame')).toHaveAttribute('src', 'https://example.com/resume.pdf')
    expect(screen.getByTestId('preview-download-pdf')).toBeInTheDocument()
    expect(screen.getByTestId('preview-open-external')).toHaveAttribute('href', 'https://example.com/resume.pdf')
    expect(setCachedUrl).toHaveBeenCalledWith('sess_123:target_123', 'https://example.com/resume.pdf')

    await userEvent.click(screen.getByTitle('Editar currículo'))

    await waitFor(() => {
      expect(screen.getByTestId('resume-editor-state')).toHaveTextContent('open')
    })
    expect(screen.getByTestId('resume-editor-scope')).toHaveTextContent('base')

    await userEvent.click(screen.getByRole('button', { name: 'trigger saved' }))

    await waitFor(() => {
      expect(invalidateCache).toHaveBeenCalledWith('sess_123:target_123')
      expect(getDownloadUrls).toHaveBeenCalledTimes(2)
    })
  })

  it('opens the preview editor in optimized scope when the session has an optimized cvState', async () => {
    render(
      <PreviewPanel
        inline
        showCloseButton={false}
        fileOverride={{
          sessionId: 'sess_123',
          targetId: null,
          type: 'pdf',
          label: 'Resume',
        }}
      />,
    )

    await waitFor(() => {
      expect(getSessionWorkspace).toHaveBeenCalledWith('sess_123')
    })

    await waitFor(() => {
      expect(screen.getByTestId('resume-editor-scope')).toHaveTextContent('optimized')
    })
  })

  it('shows actionable feedback when preview download fails', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network failed'))
    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <PreviewPanel
        inline
        showCloseButton={false}
        fileOverride={{
          sessionId: 'sess_123',
          targetId: 'target_123',
          type: 'pdf',
          label: 'Resume',
        }}
      />,
    )

    await waitFor(() => {
      expect(getDownloadUrls).toHaveBeenCalledTimes(1)
    })

    const button = screen.getByTestId('preview-download-pdf')

    await userEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Falha ao baixar o PDF. Tente novamente.')).toBeInTheDocument()
    })

    expect(button).not.toBeDisabled()

    await userEvent.click(button)

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('renders a locked overlay and removes real actions for free trial previews', async () => {
    vi.mocked(getDownloadUrls).mockResolvedValue({
      available: true,
      docxUrl: null,
      pdfUrl: '/api/file/sess_123/locked-preview',
      generationStatus: 'ready',
      previewLock: {
        locked: true,
        blurred: true,
        reason: 'free_trial_locked',
        requiresUpgrade: true,
        requiresPaidRegeneration: true,
        message: 'Seu preview gratuito está bloqueado. Faça upgrade e gere novamente para liberar o currículo real.',
      },
    })

    render(
      <PreviewPanel
        inline
        showCloseButton={false}
        fileOverride={{
          sessionId: 'sess_123',
          targetId: null,
          type: 'pdf',
          label: 'Resume',
        }}
      />,
    )

    await waitFor(() => {
      expect(screen.getByTestId('preview-panel')).toHaveAttribute('data-preview-locked', 'true')
    })

    expect(screen.getByTestId('preview-panel-lock-overlay')).toBeInTheDocument()
    expect(screen.queryByTestId('preview-edit-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('preview-download-pdf')).not.toBeInTheDocument()
    expect(screen.queryByTestId('preview-open-external')).not.toBeInTheDocument()
    expect(screen.queryByTestId('resume-editor-state')).not.toBeInTheDocument()
  })

  it('shows an explicit warning when the available pdf is stale after a saved manual edit', async () => {
    vi.mocked(getDownloadUrls).mockResolvedValue({
      available: true,
      docxUrl: null,
      pdfUrl: 'https://example.com/resume-stale.pdf',
      generationStatus: 'generating',
      artifactStale: {
        reason: 'manual_edit_saved_while_export_active',
        message: 'O PDF disponível ainda corresponde à versão anterior. Gere um novo arquivo após a exportação atual terminar para refletir a edição salva.',
        staleSince: '2026-04-21T13:05:00.000Z',
        pendingJobId: 'job_running_123',
      },
      previewLock: undefined,
    })

    render(
      <PreviewPanel
        inline
        showCloseButton={false}
        fileOverride={{
          sessionId: 'sess_123',
          targetId: null,
          type: 'pdf',
          label: 'Resume',
        }}
      />,
    )

    await waitFor(() => {
    expect(screen.getByText('O PDF disponível ainda corresponde à versão anterior. Gere um novo arquivo após a exportação atual terminar para refletir a edição salva.')).toBeInTheDocument()
    })

    expect(screen.getByTestId('preview-download-pdf')).toBeInTheDocument()
    expect(screen.getByTestId('preview-panel-frame')).toHaveAttribute('src', 'https://example.com/resume-stale.pdf')
  })

  it('falls back to a syncing state when file lookup fails transiently', async () => {
    vi.mocked(getDownloadUrls).mockRejectedValueOnce(new Error('lookup failed'))
    vi.mocked(isRetryableDownloadLookupError).mockReturnValue(true)
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <PreviewPanel
        inline
        showCloseButton={false}
        fileOverride={{
          sessionId: 'sess_123',
          targetId: null,
          type: 'pdf',
          label: 'Resume',
        }}
      />,
    )

    await waitFor(() => {
      expect(screen.getByTestId('preview-panel')).toHaveAttribute('data-state', 'generating')
    })

    expect(screen.getByText('Estamos sincronizando o PDF desta sessão.')).toBeInTheDocument()
  })
})
