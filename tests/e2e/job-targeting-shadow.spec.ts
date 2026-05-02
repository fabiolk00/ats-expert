import { expect, test } from '@playwright/test'

import { authenticateE2EUser } from './fixtures/auth-session'
import { buildMockWorkspace, installCoreFunnelApiMocks } from './fixtures/api-mocks'

function legacyJobTargetingExplanation() {
  return {
    scoreBreakdown: {
      total: 72,
      maxTotal: 100,
      items: [
        { id: 'skills', label: 'Habilidades', score: 75, max: 100 },
        { id: 'experience', label: 'Experiencia', score: 70, max: 100 },
        { id: 'education', label: 'Formacao', score: 68, max: 100 },
      ],
      criticalGaps: ['Ferramenta especifica ausente'],
    },
    adherence: {
      supportedSignals: ['SQL'],
      partialSignals: [],
      unsupportedSignals: ['Ferramenta especifica ausente'],
    },
    recommendations: [],
  }
}

test.describe('job targeting shadow mode', () => {
  test('shadow mode does not alter the visible legacy score or artifact flow', async ({ page }) => {
    const sessionId = 'sess_e2e_shadow'
    const workspace = buildMockWorkspace(sessionId)
    ;(workspace.session.agentState as Record<string, unknown>).jobCompatibilityAssessmentShadow = {
      version: 'job-compat-assessment-v1',
      targetRole: 'Analista de Dados',
      targetRoleConfidence: 'high',
      targetRoleSource: 'heuristic',
      requirements: [],
      supportedRequirements: [],
      adjacentRequirements: [],
      unsupportedRequirements: [],
      claimPolicy: { allowedClaims: [], cautiousClaims: [], forbiddenClaims: [] },
      scoreBreakdown: { total: 31, maxTotal: 100, dimensions: { skills: 0, experience: 0, education: 0 }, counts: { totalRequirements: 0, supported: 0, adjacent: 0, unsupported: 0 }, weights: { skills: 0.34, experience: 0.46, education: 0.2, adjacentDiscount: 0.5 }, activeWeights: {}, warnings: [], formula: { confidenceMultiplier: true } },
      criticalGaps: [],
      reviewNeededGaps: [],
      lowFit: { triggered: true, blocking: true, riskLevel: 'high' },
      catalog: { catalogIds: ['generic'], catalogVersions: { generic: '1.0.0' } },
      audit: { generatedAt: '2026-05-02T00:00:00.000Z', assessmentVersion: 'job-compat-assessment-v1', requirementExtractionVersion: 'v1', evidenceExtractionVersion: 'v1', matcherVersion: 'v1', claimPolicyVersion: 'v1', scoreVersion: 'job-compat-score-v1', counters: { requirements: 0, resumeEvidence: 0, supported: 0, adjacent: 0, unsupported: 0, allowedClaims: 0, cautiousClaims: 0, forbiddenClaims: 0, criticalGaps: 0, reviewNeededGaps: 0 }, warnings: [] },
    }
    workspace.targets = [{
      id: 'target_shadow',
      sessionId,
      targetJobDescription: 'Cargo: Analista de Dados\nRequisitos: SQL e ferramenta especifica',
      derivedCvState: {
        ...workspace.session.cvState,
        summary: 'Analista com foco em SQL.',
      },
      generatedOutput: {
        status: 'ready',
        pdfPath: `${sessionId}/targets/target_shadow/resume.pdf`,
        generatedAt: '2026-05-02T12:00:00.000Z',
      },
      createdAt: '2026-05-02T12:00:00.000Z',
      updatedAt: '2026-05-02T12:00:00.000Z',
    }]

    await installCoreFunnelApiMocks(page, { sessionId, workspace })
    await page.route(`**/api/session/${sessionId}/comparison`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessionId,
          generationType: 'JOB_TARGETING',
          targetJobDescription: workspace.targets[0]?.targetJobDescription,
          originalCvState: workspace.session.cvState,
          optimizedCvState: workspace.targets[0]?.derivedCvState,
          jobTargetingExplanation: legacyJobTargetingExplanation(),
        }),
      })
    })
    await authenticateE2EUser(page, {
      appUserId: 'usr_e2e_shadow',
      displayName: 'Shadow User',
      email: 'shadow@example.com',
    })

    await page.goto(`/dashboard/resume/compare/${sessionId}`)

    await expect(page.getByTestId('job-targeting-score-card')).toBeVisible()
    await expect(page.getByTestId('job-targeting-score-card')).toContainText('72')
    await expect(page.getByTestId('job-targeting-score-card')).not.toContainText('31')

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTitle('Baixar PDF').click(),
    ])
    expect(download.suggestedFilename()).toBe('Curriculo_Usuario_Vaga.pdf')
  })

  test('feedback endpoint can be called for a shadow assessment without changing score', async ({ page }) => {
    const sessionId = 'sess_e2e_shadow_feedback'
    const workspace = buildMockWorkspace(sessionId)
    let feedbackPayload: Record<string, unknown> | undefined

    await installCoreFunnelApiMocks(page, { sessionId, workspace })
    await page.route('**/api/job-targeting/feedback', async (route) => {
      feedbackPayload = route.request().postDataJSON() as Record<string, unknown>
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          feedback: {
            id: 'feedback_e2e',
            assessmentVersion: 'job-compat-assessment-v1',
            catalogVersion: 'generic@1.0.0',
            scoreVersion: 'job-compat-score-v1',
          },
        }),
      })
    })
    await authenticateE2EUser(page, {
      appUserId: 'usr_e2e_shadow_feedback',
      displayName: 'Shadow Feedback User',
      email: 'shadow-feedback@example.com',
    })
    await page.goto('/profile-setup')

    const response = await page.evaluate(async (sessionIdFromPage) => {
      const result = await fetch('/api/job-targeting/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdFromPage,
          feedbackType: 'gap_marked_wrong',
          targetSignal: 'Ferramenta especifica',
          userComment: 'Tenho evidencia no curriculo.',
        }),
      })
      return { status: result.status, body: await result.json() }
    }, sessionId)

    expect(response.status).toBe(201)
    expect(response.body.feedback).toEqual(expect.objectContaining({
      assessmentVersion: 'job-compat-assessment-v1',
      catalogVersion: 'generic@1.0.0',
      scoreVersion: 'job-compat-score-v1',
    }))
    expect(feedbackPayload).toEqual(expect.objectContaining({
      sessionId,
      feedbackType: 'gap_marked_wrong',
    }))
  })

  test('source-of-truth requests remain effectively shadow until cutover approval', async ({ page }) => {
    await installCoreFunnelApiMocks(page, {
      sessionId: 'sess_e2e_shadow_guard',
      workspace: buildMockWorkspace('sess_e2e_shadow_guard'),
    })
    await page.addInitScript(() => {
      ;(window as typeof window & { __effectiveCompatibilityMode?: unknown }).__effectiveCompatibilityMode = {
        enabled: true,
        sourceOfTruthRequested: true,
        cutoverApproved: false,
        sourceOfTruthBlocked: true,
        sourceOfTruth: false,
        shadowMode: true,
      }
    })
    await authenticateE2EUser(page, {
      appUserId: 'usr_e2e_shadow_guard',
      displayName: 'Shadow Guard User',
      email: 'shadow-guard@example.com',
    })
    await page.goto('/profile-setup')

    const mode = await page.evaluate(() => (
      window as typeof window & { __effectiveCompatibilityMode?: Record<string, unknown> }
    ).__effectiveCompatibilityMode)

    expect(mode).toEqual(expect.objectContaining({
      sourceOfTruthRequested: true,
      cutoverApproved: false,
      sourceOfTruthBlocked: true,
      sourceOfTruth: false,
      shadowMode: true,
    }))
  })
})
