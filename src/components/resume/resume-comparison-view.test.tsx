import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getDownloadUrls } from '@/lib/dashboard/workspace-client'
import type { CVState } from '@/types/cv'

import { ResumeComparisonView } from './resume-comparison-view'

const editedOptimizedCvState: CVState = {
  fullName: 'Ana Silva',
  email: 'ana@example.com',
  phone: '555-0100',
  linkedin: 'linkedin.com/in/anasilva',
  location: 'Sao Paulo',
  summary: 'Edited optimized summary',
  experience: [],
  skills: ['TypeScript', 'SQL'],
  education: [],
  certifications: [],
}

vi.mock('@/components/logo', () => ({
  default: () => <div>Logo</div>,
}))

vi.mock('@/lib/dashboard/workspace-client', () => ({
  getDownloadUrls: vi.fn(),
}))

vi.mock('@/components/dashboard/resume-editor-modal', () => ({
  ResumeEditorModal: ({
    open,
    scope,
    onSaved,
  }: {
    open: boolean
    scope?: string
    onSaved: (cvState: CVState) => void
  }) => open ? (
    <div data-testid="resume-editor-modal" data-scope={scope ?? 'base'}>
      <button type="button" onClick={() => onSaved(editedOptimizedCvState)}>
        Mock Save
      </button>
    </div>
  ) : null,
}))

function buildCvState(summary: string): CVState {
  return {
    fullName: 'Ana Silva',
    email: 'ana@example.com',
    phone: '555-0100',
    linkedin: 'linkedin.com/in/anasilva',
    location: 'Sao Paulo',
    summary,
    experience: [],
    skills: ['TypeScript'],
    education: [],
    certifications: [],
  }
}

describe('ResumeComparisonView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getDownloadUrls).mockResolvedValue({
      available: true,
      docxUrl: null,
      pdfUrl: 'https://example.com/resume.pdf',
      generationStatus: 'ready',
      previewLock: undefined,
    })
  })

  it('opens the editor in optimized mode and updates the optimized document after save', async () => {
    render(
      <ResumeComparisonView
        originalCvState={buildCvState('Original summary')}
        optimizedCvState={buildCvState('Optimized summary')}
        generationType="ATS_ENHANCEMENT"
        sessionId="sess_123"
        onContinue={vi.fn()}
      />,
    )

    await userEvent.click(screen.getByTitle('Editar currículo'))

    expect(screen.getByTestId('resume-editor-modal')).toHaveAttribute('data-scope', 'optimized')

    await userEvent.click(screen.getByRole('button', { name: 'Mock Save' }))

    expect(screen.getByText('Edited optimized summary')).toBeInTheDocument()
  })

  it('shows a locked overlay and hides edit/download actions for blocked previews', () => {
    render(
      <ResumeComparisonView
        originalCvState={buildCvState('Original summary')}
        optimizedCvState={buildCvState('Preview bloqueado')}
        generationType="ATS_ENHANCEMENT"
        sessionId="sess_123"
        previewLock={{
          locked: true,
          blurred: true,
          reason: 'free_trial_locked',
          requiresUpgrade: true,
          requiresPaidRegeneration: true,
          message: 'Seu preview gratuito está bloqueado. Faça upgrade e gere novamente para liberar o currículo real.',
        }}
        onContinue={vi.fn()}
      />,
    )

    expect(screen.getByTestId('resume-comparison-lock-overlay')).toBeInTheDocument()
    expect(screen.queryByTitle('Editar currículo')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Baixar PDF')).not.toBeInTheDocument()
    expect(screen.queryByTestId('resume-editor-modal')).not.toBeInTheDocument()
  })

  it('renders estimated ATS Readiness ranges in pt-BR without showing pending copy', () => {
    render(
      <ResumeComparisonView
        originalCvState={buildCvState('Original summary')}
        optimizedCvState={buildCvState('Optimized summary')}
        generationType="ATS_ENHANCEMENT"
        sessionId="sess_123"
        originalScore={84}
        optimizedScore={89}
        atsReadiness={{
          contractVersion: 2,
          workflowMode: 'ats_enhancement',
          evaluationStage: 'post_enhancement',
          productLabel: 'ATS Readiness Score',
          rawInternalScoreSource: 'scoreATS.total',
          rawInternalScoreBefore: 84,
          rawInternalScoreAfter: 61,
          rawInternalConfidence: 'low',
          displayedReadinessScoreBefore: 89,
          displayedReadinessScoreAfter: 89,
          displayedReadinessBandBefore: 'excellent',
          displayedReadinessBandAfter: 'excellent',
          displayedReadinessScoreCurrent: 89,
          displayedReadinessBandCurrent: 'excellent',
          scoreStatus: 'estimated_range',
          display: {
            mode: 'estimated_range',
            scoreStatus: 'estimated_range',
            exactScore: null,
            estimatedRangeMin: 89,
            estimatedRangeMax: 91,
            confidence: 'low',
            labelPtBr: 'ATS Readiness Score',
            badgeTextPtBr: 'Estimado',
            helperTextPtBr: 'Faixa estimada com base na otimização concluída.',
            formattedScorePtBr: '89–91',
          },
          qualityGates: {
            improvedSummaryClarity: false,
            improvedKeywordVisibility: false,
            noFactualDrift: true,
            noLossOfRequiredSections: true,
            noReadabilityRegression: false,
            noUnsupportedClaimsIntroduced: true,
          },
          withholdReasons: ['Low scoring confidence combined with contradictory internal ATS signals.'],
          rawScoreBefore: {
            total: 84,
            breakdown: { format: 16, structure: 16, contact: 8, keywords: 22, impact: 22 },
            issues: [],
            suggestions: [],
          },
          rawScoreAfter: {
            total: 61,
            breakdown: { format: 13, structure: 12, contact: 8, keywords: 14, impact: 14 },
            issues: [],
            suggestions: [],
          },
        }}
        onContinue={vi.fn()}
      />,
    )

    expect(screen.getByText('89–91')).toBeInTheDocument()
    expect(screen.getByText('Estimado')).toBeInTheDocument()
    expect(screen.queryByText('Faixa estimada com base na otimização concluída.')).not.toBeInTheDocument()
    expect(screen.queryByText('Pendente')).not.toBeInTheDocument()
  })

  it('does not render the optimization note banner in the comparison UI', () => {
    render(
      <ResumeComparisonView
        originalCvState={buildCvState('Original summary')}
        optimizedCvState={buildCvState('Optimized summary')}
        generationType="ATS_ENHANCEMENT"
        sessionId="sess_123"
        optimizationNotes={['Ajustei o resumo para 5 linhas, dentro do limite solicitado.']}
        onContinue={vi.fn()}
      />,
    )

    expect(
      screen.queryByText('Ajustei o resumo para 5 linhas, dentro do limite solicitado.'),
    ).not.toBeInTheDocument()
  })
})
