"use client"

import { useCallback, useEffect, useState } from "react"
import { useDefaultLayout } from "react-resizable-panels"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { usePreviewPanel } from "@/context/preview-panel-context"
import { usePreviewPanelOverlay } from "@/hooks/use-preview-panel-overlay"
import {
  generateResume,
  getSessionWorkspace,
  isGeneratedOutputReady,
  manualEditBaseSection,
} from "@/lib/dashboard/workspace-client"
import {
  AI_CHAT_PRO_REQUIRED_MESSAGE,
  AI_CHAT_PRO_REQUIRED_TITLE,
} from "@/lib/billing/ai-chat-access"
import type { PlanSlug } from "@/lib/plans"
import { getDisplayableTargetRole, isSuspiciousTargetRole } from "@/lib/target-role"
import type {
  JobStatusSnapshot,
  ManualEditInput,
  ManualEditSection,
  ManualEditSectionData,
} from "@/types/agent"
import type { SessionWorkspace } from "@/types/dashboard"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

import { ChatInterface } from "./chat-interface"
import { AiChatAccessCard } from "./ai-chat-access-card"
import { ManualEditDialog } from "./manual-edit-dialog"
import { PlanUpdateDialog } from "./plan-update-dialog"
import { PreviewPanel } from "./preview-panel"
import { NEW_CONVERSATION_EVENT, SESSION_SYNC_EVENT } from "./events"
import { WorkspaceSidePanel } from "./workspace-side-panel"
const NOOP_LAYOUT_STORAGE = {
  getItem: (_key: string) => null,
  setItem: (_key: string, _value: string) => {},
}

type MutationKind =
  | "workspace-refresh"
  | "manual-edit"
  | "generate"
  | null

type ResumeWorkspaceProps = {
  canAccessAiChat?: boolean
  aiChatAccessTitle?: string
  aiChatAccessMessage?: string
  aiChatUpgradeUrl?: string
  initialSessionId?: string
  userName?: string
  missingContactInfo?: {
    missingEmail: boolean
    missingPhone: boolean
  }
  activeRecurringPlan?: PlanSlug | null
  currentCredits?: number
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return "N\u00E3o foi poss\u00EDvel concluir a opera\u00E7\u00E3o."
}

function createClientRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const GENERATION_IN_PROGRESS_COPY = "Geracao em andamento. Atualizaremos os arquivos quando estiver pronto."
const GENERATION_SUCCESS_COPY = "Arquivos da base gerados com sucesso."

function resolveGenerationFailureMessage(job: JobStatusSnapshot | null): string {
  const terminalErrorRef = job?.terminalErrorRef

  if (terminalErrorRef?.kind === "resume_generation_failure" && terminalErrorRef.failureReason) {
    return terminalErrorRef.failureReason
  }

  if (terminalErrorRef?.kind === "job_error") {
    return terminalErrorRef.message
  }

  if (job?.status === "cancelled") {
    return "A geracao dos arquivos foi cancelada antes da conclusao."
  }

    return "Não foi possível concluir a geração dos arquivos."
}

function formatValidationSectionLabel(section?: string): string {
  switch (section) {
    case "summary":
      return "Resumo"
    case "experience":
      return "Experiência"
    case "skills":
      return "Skills"
    case "education":
      return "Educação"
    case "certifications":
      return "Certificações"
    default:
      return "Validação"
  }
}

function getRewriteFailureCopy(workspace: SessionWorkspace | null): {
  title: string
  description: string
  explanationTitle: string
  explanationBody: string
} {
  const mode = workspace?.session.agentState.workflowMode

  if (mode === "job_targeting") {
    return {
      title: "Não concluímos essa adaptação automaticamente",
      description: "Identificamos um bloqueio na validação final e interrompemos a adaptação para a vaga, para não gerar um currículo com informações inconsistentes.",
      explanationTitle: "Como interpretar esse aviso",
      explanationBody: "Quando mostramos esse modal, o sistema parou por segurança. Isso normalmente significa um impeditivo factual na adaptação para a vaga, não que o currículo foi gerado com sucesso. Se a justificativa parecer incoerente com a vaga enviada, aí sim pode ser bug.",
    }
  }

  return {
    title: "Não concluímos essa melhoria ATS automaticamente",
    description: "Identificamos um bloqueio na validação final e interrompemos a melhoria ATS, para não gerar um currículo com informações inconsistentes.",
    explanationTitle: "Como interpretar esse aviso",
    explanationBody: "Quando mostramos esse modal, o sistema parou por segurança. Isso normalmente significa um impeditivo factual na reescrita ATS, não que o currículo foi gerado com sucesso. Se a justificativa parecer incoerente com o seu perfil real, aí sim pode ser bug.",
  }
}

function buildRewriteFailureKey(workspace: SessionWorkspace | null): string | null {
  const session = workspace?.session
  const issues = session?.agentState.rewriteValidation?.issues

  if (session?.agentState.rewriteStatus !== "failed" || !issues || issues.length === 0) {
    return null
  }

  return JSON.stringify({
    sessionId: session.id,
    updatedAt: session.updatedAt,
    workflowMode: session.agentState.workflowMode,
    targetRole: session.agentState.targetingPlan?.targetRole,
    issues: issues.map((issue) => ({
      severity: issue.severity,
      section: issue.section,
      message: issue.message,
    })),
  })
}

function getManualEditSectionValue(
  workspace: SessionWorkspace | null,
  section: ManualEditSection | null,
): ManualEditSectionData | null {
  if (!workspace || section === null) {
    return null
  }

  const { cvState } = workspace.session

  switch (section) {
    case "contact":
      return {
        fullName: cvState.fullName,
        email: cvState.email,
        phone: cvState.phone,
        linkedin: cvState.linkedin,
        location: cvState.location,
      }
    case "summary":
      return cvState.summary
    case "skills":
      return cvState.skills
    case "experience":
      return cvState.experience
    case "education":
      return cvState.education
    case "certifications":
      return cvState.certifications ?? []
    default:
      return null
  }
}

export function ResumeWorkspace({
  canAccessAiChat = true,
  aiChatAccessTitle,
  aiChatAccessMessage,
  aiChatUpgradeUrl,
  initialSessionId,
  userName,
  missingContactInfo,
  activeRecurringPlan = null,
  currentCredits = 0,
}: ResumeWorkspaceProps) {
  const [hasMounted, setHasMounted] = useState(false)
  const [sessionId, setSessionId] = useState<string | undefined>(initialSessionId)
  const [availableCredits, setAvailableCredits] = useState(currentCredits)
  const [workspace, setWorkspace] = useState<SessionWorkspace | null>(null)
  const [activeMutation, setActiveMutation] = useState<MutationKind>("workspace-refresh")
  const [isStreaming, setIsStreaming] = useState(false)
  const [manualEditOpen, setManualEditOpen] = useState(false)
  const [manualEditSection, setManualEditSection] = useState<ManualEditSection | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [activeGenerationJobId, setActiveGenerationJobId] = useState<string | null>(null)
  const [planUpdateOpen, setPlanUpdateOpen] = useState(false)
  const [rewriteFailureDialogOpen, setRewriteFailureDialogOpen] = useState(false)
  const [lastSeenRewriteFailureKey, setLastSeenRewriteFailureKey] = useState<string | null>(null)
  const { isOpen: isPreviewOpen, file: previewFile, close: closePreview } = usePreviewPanel()
  const isPreviewOverlay = usePreviewPanelOverlay()
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: "resume-workspace-split-view",
    panelIds: ["workspace-chat-panel", "workspace-preview-panel"],
    storage: hasMounted ? window.localStorage : NOOP_LAYOUT_STORAGE,
  })

  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    setAvailableCredits(currentCredits)
  }, [currentCredits])

  useEffect(() => {
    if (!canAccessAiChat) {
      setSessionId(undefined)
      setWorkspace(null)
      setActiveMutation(null)
      setErrorMessage(null)
      setStatusMessage(null)
      setActiveGenerationJobId(null)
      closePreview()
      return
    }

    setSessionId(initialSessionId)
  }, [canAccessAiChat, closePreview, initialSessionId])

  useEffect(() => {
    const handleNewConversation = (): void => {
      setSessionId(undefined)
      setWorkspace(null)
      setActiveMutation(null)
      setErrorMessage(null)
      setStatusMessage(null)
      setActiveGenerationJobId(null)
      closePreview()
    }

    window.addEventListener(NEW_CONVERSATION_EVENT, handleNewConversation)

    return () => {
      window.removeEventListener(NEW_CONVERSATION_EVENT, handleNewConversation)
    }
  }, [closePreview])

  useEffect(() => {
    window.dispatchEvent(new CustomEvent(SESSION_SYNC_EVENT, {
      detail: { sessionId: sessionId ?? null },
    }))
  }, [sessionId])

  useEffect(() => {
    if (!sessionId) {
      return
    }

    const url = new URL(window.location.href)
    if (url.searchParams.get("session") === sessionId) {
      return
    }

    url.searchParams.set("session", sessionId)
    window.history.replaceState(window.history.state, "", url.toString())
  }, [sessionId])

  const isBusy = activeMutation !== null || isStreaming
  const baseOutputReady = isGeneratedOutputReady(workspace?.session.generatedOutput)
  const manualEditValue = getManualEditSectionValue(workspace, manualEditSection)
  const targetCount = workspace?.targets.length ?? 0
  const rewriteFailureKey = buildRewriteFailureKey(workspace)
  const rewriteValidationIssues = workspace?.session.agentState.rewriteValidation?.issues ?? []
  const suspiciousTargetRole = workspace?.session.agentState.targetingPlan?.targetRoleConfidence === "low"
    || isSuspiciousTargetRole(workspace?.session.agentState.targetingPlan?.targetRole)
  const displayTargetRole = getDisplayableTargetRole(workspace?.session.agentState.targetingPlan?.targetRole)
  const rewriteFailureCopy = getRewriteFailureCopy(workspace)
  const activeGenerationJob = activeGenerationJobId
    ? workspace?.jobs.find((job) => job.jobId === activeGenerationJobId) ?? null
    : null

  useEffect(() => {
    if (!rewriteFailureKey) {
      return
    }

    if (rewriteFailureKey === lastSeenRewriteFailureKey) {
      return
    }

    setRewriteFailureDialogOpen(true)
    setLastSeenRewriteFailureKey(rewriteFailureKey)
  }, [lastSeenRewriteFailureKey, rewriteFailureKey])

  const refreshWorkspace = useCallback(async (targetSessionId: string): Promise<void> => {
    setActiveMutation("workspace-refresh")
    setErrorMessage(null)

    try {
      const nextWorkspace = await getSessionWorkspace(targetSessionId)
      setWorkspace(nextWorkspace)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setActiveMutation(null)
    }
  }, [])

  useEffect(() => {
    if (!canAccessAiChat) {
      setWorkspace(null)
      setActiveMutation(null)
      setActiveGenerationJobId(null)
      return
    }

    if (!sessionId) {
      setWorkspace(null)
      setActiveMutation(null)
      setActiveGenerationJobId(null)
      return
    }

    void refreshWorkspace(sessionId)
  }, [canAccessAiChat, refreshWorkspace, sessionId])

  useEffect(() => {
    if (!sessionId || !activeGenerationJobId) {
      return
    }

    if (activeGenerationJob?.status === "completed") {
      setActiveGenerationJobId(null)
      setErrorMessage(null)
      setStatusMessage(GENERATION_SUCCESS_COPY)
      return
    }

    if (activeGenerationJob?.status === "failed" || activeGenerationJob?.status === "cancelled") {
      setActiveGenerationJobId(null)
      setStatusMessage(null)
      setErrorMessage(resolveGenerationFailureMessage(activeGenerationJob))
      return
    }

    setStatusMessage(GENERATION_IN_PROGRESS_COPY)

    const timeoutId = window.setTimeout(() => {
      void getSessionWorkspace(sessionId)
        .then((nextWorkspace) => {
          setWorkspace(nextWorkspace)
        })
        .catch((error) => {
          setActiveGenerationJobId(null)
          setStatusMessage(null)
          setErrorMessage(getErrorMessage(error))
        })
    }, 2500)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [activeGenerationJob, activeGenerationJobId, sessionId])

  useEffect(() => {
    if (!isPreviewOpen) {
      return
    }

    if (!sessionId || previewFile?.sessionId !== sessionId) {
      closePreview()
    }
  }, [closePreview, isPreviewOpen, previewFile?.sessionId, sessionId])

  const openManualEdit = (section: ManualEditSection): void => {
    setManualEditSection(section)
    setManualEditOpen(true)
  }

  const handleManualEdit = async (input: ManualEditInput): Promise<void> => {
    if (!sessionId) {
      return
    }

    setActiveMutation("manual-edit")
    setErrorMessage(null)
    setStatusMessage(null)

    try {
      const result = await manualEditBaseSection(sessionId, input)
      await refreshWorkspace(sessionId)
      setManualEditOpen(false)
      setStatusMessage(
        result.changed
          ? "Edi\u00E7\u00E3o manual aplicada na base can\u00F4nica."
          : "Nenhuma altera\u00E7\u00E3o detectada nesta se\u00E7\u00E3o.",
      )
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
      throw error
    } finally {
      setActiveMutation(null)
    }
  }

  const handleGenerateBase = async (): Promise<void> => {
    if (!sessionId) {
      return
    }

    setActiveMutation("generate")
    setErrorMessage(null)
    setStatusMessage(null)

    try {
      const result = await generateResume(
        sessionId,
        { scope: "base" },
        createClientRequestId(),
      )
      setAvailableCredits((previous) => Math.max(previous - result.creditsUsed, 0))

      if (result.inProgress) {
        setActiveGenerationJobId(result.jobId)
        setStatusMessage(GENERATION_IN_PROGRESS_COPY)

        try {
          const nextWorkspace = await getSessionWorkspace(sessionId)
          setWorkspace(nextWorkspace)
        } catch {
          // Keep the durable acknowledgement visible and let polling retry.
        }

        return
      }

      setActiveGenerationJobId(null)
      await refreshWorkspace(sessionId)
      setStatusMessage(GENERATION_SUCCESS_COPY)
    } catch (error) {
      setActiveGenerationJobId(null)
      setErrorMessage(getErrorMessage(error))
    } finally {
      setActiveMutation(null)
    }
  }

  const chatPane = (
    <div className="flex h-full min-h-[72svh] min-w-0 flex-col overflow-hidden bg-[#faf9f5] lg:min-h-0">
      <ChatInterface
        sessionId={sessionId}
        userName={userName}
        weakFitCheckpoint={workspace?.session.agentState.careerFitCheckpoint ?? undefined}
        missingContactInfo={missingContactInfo}
        disabled={activeMutation !== null}
        currentCredits={availableCredits}
        onSessionChange={(nextSessionId) => setSessionId(nextSessionId)}
        onStreamingChange={setIsStreaming}
        onAgentTurnCompleted={(payload) => {
          setSessionId(payload.sessionId)
          void refreshWorkspace(payload.sessionId)
        }}
        onCreditsExhausted={() => setPlanUpdateOpen(true)}
      />
    </div>
  )

  const viewerPane = (
    <WorkspaceSidePanel
      sessionId={sessionId}
      showInlinePreview={!isPreviewOverlay}
      previewFile={!isPreviewOverlay ? previewFile : null}
      baseOutputReady={baseOutputReady}
      onGenerateBase={sessionId ? () => void handleGenerateBase() : undefined}
      generationBusy={activeMutation === "generate" || activeGenerationJobId !== null}
      generationInProgress={activeGenerationJobId !== null}
    />
  )

  const statusBanner = errorMessage || statusMessage ? (
    <div className="border-b border-border/60 bg-card px-4 py-3 text-sm shadow-sm">
      {errorMessage ? (
        <p className="text-destructive">{errorMessage}</p>
      ) : (
        <p className="text-muted-foreground">{statusMessage}</p>
      )}
    </div>
  ) : null

  if (!canAccessAiChat) {
    return (
      <div
        data-testid="resume-workspace"
        data-active-generation-job-id=""
        data-active-generation-status=""
        data-base-output-ready="false"
        data-busy="false"
        data-session-id=""
        data-target-count="0"
        className="flex h-[calc(107svh-4rem)] items-center justify-center bg-[#faf9f5] px-4 py-8"
      >
        <AiChatAccessCard
          title={aiChatAccessTitle ?? AI_CHAT_PRO_REQUIRED_TITLE}
          message={aiChatAccessMessage ?? AI_CHAT_PRO_REQUIRED_MESSAGE}
          ctaHref={aiChatUpgradeUrl}
        />
      </div>
    )
  }

  return (
    <>
      {isPreviewOverlay ? (
        <div
          data-testid="resume-workspace"
          data-active-generation-job-id={activeGenerationJobId ?? ""}
          data-active-generation-status={activeGenerationJob?.status ?? ""}
          data-base-output-ready={String(baseOutputReady)}
          data-busy={String(isBusy)}
          data-session-id={sessionId ?? ""}
          data-target-count={String(targetCount)}
          className="space-y-0 p-0"
        >
          {statusBanner}
          {chatPane}
          {viewerPane}
        </div>
      ) : (
        <div
          data-testid="resume-workspace"
          data-active-generation-job-id={activeGenerationJobId ?? ""}
          data-active-generation-status={activeGenerationJob?.status ?? ""}
          data-base-output-ready={String(baseOutputReady)}
          data-busy={String(isBusy)}
          data-session-id={sessionId ?? ""}
          data-target-count={String(targetCount)}
          className="h-[calc(107svh-4rem)] px-0 py-0"
        >
          {statusBanner}
          <ResizablePanelGroup
            id="resume-workspace-split-view"
            orientation="horizontal"
            defaultLayout={defaultLayout}
            onLayoutChanged={onLayoutChanged}
            className="items-stretch bg-[#faf9f5]"
          >
            <ResizablePanel id="workspace-chat-panel" defaultSize="68%" minSize="44%">
              <div className="h-full min-w-0">
                {chatPane}
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel
              id="workspace-preview-panel"
              defaultSize="32%"
              minSize="24%"
              maxSize="56%"
            >
              <div className="h-full min-w-0">
                {viewerPane}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      )}

      {isPreviewOpen && previewFile && isPreviewOverlay ? <PreviewPanel /> : null}

      <ManualEditDialog
        open={manualEditOpen}
        section={manualEditSection}
        value={manualEditValue}
        busy={activeMutation === "manual-edit"}
        onOpenChange={(open) => {
          setManualEditOpen(open)
          if (!open) {
            setManualEditSection(null)
          }
        }}
        onSubmit={handleManualEdit}
      />

      <PlanUpdateDialog
        isOpen={planUpdateOpen}
        onOpenChange={setPlanUpdateOpen}
        activeRecurringPlan={activeRecurringPlan}
        currentCredits={availableCredits}
      />

      <Dialog open={rewriteFailureDialogOpen} onOpenChange={setRewriteFailureDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{rewriteFailureCopy.title}</DialogTitle>
            <DialogDescription>
              {rewriteFailureCopy.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm text-slate-700">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="font-medium text-amber-900">O que bloqueou automaticamente</p>
              <ul className="mt-2 space-y-2">
                {rewriteValidationIssues.map((issue, index) => (
                  <li key={`${issue.section ?? "unknown"}-${index}`} className="list-none">
                    <span className="font-medium">{formatValidationSectionLabel(issue.section)}:</span>{" "}
                    {issue.message}
                  </li>
                ))}
              </ul>
            </div>

            {suspiciousTargetRole ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                <p className="font-medium text-rose-900">Possível bug de leitura da vaga</p>
                <p className="mt-2">
                  {displayTargetRole ? (
                    <>
                      Detectamos um cargo-alvo suspeito na vaga analisada:
                      {" "}
                      <span className="font-medium">{displayTargetRole}</span>.
                      Isso parece mais um título de seção da vaga do que o cargo real. Se isso não fizer sentido para você, trate como erro do sistema e tente reenviar a vaga.
                    </>
                  ) : (
                    <>
                      Não conseguimos identificar com confiança o cargo-alvo da vaga analisada.
                      Isso sugere erro de leitura da vaga ou uso de um placeholder interno, não do cargo real. Se isso não fizer sentido para você, trate como erro do sistema e tente reenviar a vaga.
                    </>
                  )}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-medium text-slate-900">{rewriteFailureCopy.explanationTitle}</p>
                <p className="mt-2">
                  {rewriteFailureCopy.explanationBody}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" onClick={() => setRewriteFailureDialogOpen(false)}>
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
