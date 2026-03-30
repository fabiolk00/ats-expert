"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Download,
  FileStack,
  GitCompare,
  History,
  Layers3,
  Loader2,
  PencilLine,
  Plus,
  Sparkles,
  Target,
} from "lucide-react"

import ATSScoreBadge from "@/components/ats-score-badge"
import PhaseBadge from "@/components/phase-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import {
  applyGapAction,
  compareSnapshots,
  createTarget,
  generateResume,
  getDownloadUrls,
  getSessionWorkspace,
  isGeneratedOutputReady,
  listVersions,
  manualEditBaseSection,
} from "@/lib/dashboard/workspace-client"
import type {
  ManualEditInput,
  ManualEditSection,
  ManualEditSectionData,
} from "@/types/agent"
import type {
  CompareSnapshotRef,
  CompareSnapshotsResponse,
  SerializedTimelineEntry,
  SessionWorkspace,
} from "@/types/dashboard"

import { ChatInterface } from "./chat-interface"
import { CompareDrawer } from "./compare-drawer"
import { ManualEditDialog } from "./manual-edit-dialog"

type MutationKind =
  | "workspace-refresh"
  | "create-target"
  | "manual-edit"
  | "gap-action"
  | "generate"
  | null

type ResumeWorkspaceProps = {
  initialSessionId?: string
  userName?: string
}

const SURFACE_CARD =
  "border-border/70 bg-card/88 shadow-[0_28px_100px_-58px_rgba(15,23,42,0.5)] backdrop-blur-xl"
const SECTION_BOX = "rounded-[24px] border border-border/70 bg-background/75 p-4 shadow-sm"

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return "Nao foi possivel concluir a operacao."
}

function formatDateTime(value?: string): string {
  if (!value) {
    return "-"
  }

  return new Date(value).toLocaleString("pt-BR")
}

function shortenText(value: string, maxLength = 140): string {
  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, maxLength).trimEnd()}...`
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

function buildCompareDefaultsForTarget(targetId: string): {
  left: CompareSnapshotRef
  right: CompareSnapshotRef
} {
  return {
    left: { kind: "base" },
    right: { kind: "target", id: targetId },
  }
}

export function ResumeWorkspace({
  initialSessionId,
  userName,
}: ResumeWorkspaceProps) {
  const [sessionId, setSessionId] = useState<string | undefined>(initialSessionId)
  const [workspace, setWorkspace] = useState<SessionWorkspace | null>(null)
  const [versions, setVersions] = useState<SerializedTimelineEntry[]>([])
  const [activeMutation, setActiveMutation] = useState<MutationKind>("workspace-refresh")
  const [isStreaming, setIsStreaming] = useState(false)
  const [compareBusy, setCompareBusy] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [compareResult, setCompareResult] = useState<CompareSnapshotsResponse | null>(null)
  const [compareDefaults, setCompareDefaults] = useState<{
    left?: CompareSnapshotRef
    right?: CompareSnapshotRef
  }>({})
  const [manualEditOpen, setManualEditOpen] = useState(false)
  const [manualEditSection, setManualEditSection] = useState<ManualEditSection | null>(null)
  const [targetJobDescription, setTargetJobDescription] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const isBusy = activeMutation !== null || isStreaming
  const gapAnalysis = workspace?.session.agentState.gapAnalysis?.result
  const baseOutputReady = isGeneratedOutputReady(workspace?.session.generatedOutput)
  const manualEditValue = getManualEditSectionValue(workspace, manualEditSection)

  const refreshWorkspace = useCallback(async (targetSessionId: string): Promise<void> => {
    setActiveMutation("workspace-refresh")
    setErrorMessage(null)

    try {
      const [nextWorkspace, nextVersions] = await Promise.all([
        getSessionWorkspace(targetSessionId),
        listVersions(targetSessionId),
      ])

      setWorkspace(nextWorkspace)
      setVersions(nextVersions)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setActiveMutation(null)
    }
  }, [])

  useEffect(() => {
    if (!sessionId) {
      setWorkspace(null)
      setVersions([])
      setActiveMutation(null)
      return
    }

    void refreshWorkspace(sessionId)
  }, [refreshWorkspace, sessionId])

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
          ? "Edicao manual aplicada na base canonica."
          : "Nenhuma alteracao detectada nesta secao.",
      )
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
      throw error
    } finally {
      setActiveMutation(null)
    }
  }

  const handleCreateTarget = async (): Promise<void> => {
    if (!sessionId || !targetJobDescription.trim()) {
      return
    }

    setActiveMutation("create-target")
    setErrorMessage(null)
    setStatusMessage(null)

    try {
      await createTarget(sessionId, targetJobDescription.trim())
      await refreshWorkspace(sessionId)
      setTargetJobDescription("")
      setStatusMessage("Nova variante target criada com sucesso.")
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setActiveMutation(null)
    }
  }

  const handleGapAction = async (
    itemType: "missing_skill" | "weak_area" | "suggestion",
    itemValue: string,
  ): Promise<void> => {
    if (!sessionId) {
      return
    }

    setActiveMutation("gap-action")
    setErrorMessage(null)
    setStatusMessage(null)

    try {
      await applyGapAction(sessionId, { itemType, itemValue })
      await refreshWorkspace(sessionId)
      setStatusMessage(`Melhoria aplicada a partir de: ${itemValue}`)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
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
      await generateResume(sessionId, { scope: "base" })
      await refreshWorkspace(sessionId)
      setStatusMessage("Arquivos da base gerados com sucesso.")
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setActiveMutation(null)
    }
  }

  const handleGenerateTarget = async (targetId: string): Promise<void> => {
    if (!sessionId) {
      return
    }

    setActiveMutation("generate")
    setErrorMessage(null)
    setStatusMessage(null)

    try {
      await generateResume(sessionId, { scope: "target", targetId })
      await refreshWorkspace(sessionId)
      setStatusMessage("Arquivos da variante target gerados com sucesso.")
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setActiveMutation(null)
    }
  }

  const handleDownload = async (targetId?: string): Promise<void> => {
    if (!sessionId) {
      return
    }

    setErrorMessage(null)

    try {
      const urls = await getDownloadUrls(sessionId, targetId)
      window.open(urls.pdfUrl, "_blank", "noopener,noreferrer")
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    }
  }

  const handleCompare = async (
    left: CompareSnapshotRef,
    right: CompareSnapshotRef,
  ): Promise<void> => {
    if (!sessionId) {
      return
    }

    setCompareBusy(true)
    setErrorMessage(null)

    try {
      const result = await compareSnapshots(sessionId, left, right)
      setCompareResult(result)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setCompareBusy(false)
    }
  }

  const handleOpenCompareWithTarget = (targetId: string): void => {
    const defaults = buildCompareDefaultsForTarget(targetId)
    setCompareDefaults(defaults)
    setCompareResult(null)
    setCompareOpen(true)
  }

  const timelinePreview = useMemo(() => versions.slice(0, 8), [versions])

  return (
    <>
      <div className="grid min-h-[calc(100vh-4rem)] gap-6 bg-[radial-gradient(circle_at_top_left,oklch(var(--primary)/0.05),transparent_28%),radial-gradient(circle_at_bottom_right,oklch(var(--chart-2)/0.06),transparent_24%)] p-4 lg:grid-cols-[minmax(0,1.28fr)_430px] lg:p-6">
        <div className={`overflow-hidden rounded-[32px] border ${SURFACE_CARD}`}>
          <ChatInterface
            sessionId={sessionId}
            userName={userName}
            disabled={activeMutation !== null}
            onSessionChange={(nextSessionId) => setSessionId(nextSessionId)}
            onStreamingChange={setIsStreaming}
            onAgentTurnCompleted={(payload) => {
              setSessionId(payload.sessionId)
              void refreshWorkspace(payload.sessionId)
            }}
          />
        </div>

        <div className="space-y-6">
          <Card className={SURFACE_CARD}>
            <CardHeader className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge
                    variant="secondary"
                    className="mb-3 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                  >
                    Canonico
                  </Badge>
                  <CardTitle className="text-xl">Base canonica</CardTitle>
                  <CardDescription className="mt-2 max-w-md leading-6">
                    Esta area espelha o estado real salvo no backend. Toda edicao aqui respeita versoes,
                    SSE e persistencia da sessao.
                  </CardDescription>
                </div>
                <div className="grid gap-2 text-right text-xs text-muted-foreground">
                  <span>Workspace</span>
                  <span>{sessionId ? sessionId.slice(0, 8) : "sem sessao"}</span>
                </div>
              </div>
              {workspace ? (
                <div className="flex flex-wrap items-center gap-2">
                  <PhaseBadge phase={workspace.session.phase} />
                  {workspace.session.atsScore && (
                    <ATSScoreBadge score={workspace.session.atsScore.total} />
                  )}
                  <Badge variant="outline" className="rounded-full">
                    Versao {workspace.session.stateVersion}
                  </Badge>
                  {isStreaming && (
                    <Badge variant="outline" className="gap-1 rounded-full">
                      <Spinner className="size-3" />
                      SSE ativo
                    </Badge>
                  )}
                  {activeMutation === "generate" && (
                    <Badge variant="outline" className="gap-1 rounded-full">
                      <Loader2 className="size-3 animate-spin" />
                      Gerando
                    </Badge>
                  )}
                </div>
              ) : null}
            </CardHeader>

            <CardContent className="space-y-4">
              {workspace ? (
                <>
                  <div className={SECTION_BOX}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-lg font-semibold tracking-tight">{workspace.session.cvState.fullName}</p>
                        <p className="text-sm text-muted-foreground">
                          {workspace.session.cvState.email}
                          {workspace.session.cvState.phone ? ` | ${workspace.session.cvState.phone}` : ""}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {workspace.session.cvState.linkedin || "LinkedIn ausente"}
                          {workspace.session.cvState.location ? ` | ${workspace.session.cvState.location}` : ""}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        disabled={isBusy}
                        onClick={() => openManualEdit("contact")}
                      >
                        <PencilLine className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                    </div>
                  </div>

                  <div className={SECTION_BOX}>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Resumo
                        </h3>
                        <p className="mt-1 text-sm text-foreground/80">
                          Narrativa principal usada como base para derivacoes por vaga.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        disabled={isBusy}
                        onClick={() => openManualEdit("summary")}
                      >
                        <PencilLine className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                    </div>
                    <p className="text-sm leading-7 text-muted-foreground">
                      {workspace.session.cvState.summary || "Resumo ainda nao preenchido."}
                    </p>
                  </div>

                  <div className={SECTION_BOX}>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Skills
                        </h3>
                        <p className="mt-1 text-sm text-foreground/80">
                          Stack e repertorio estruturado para matching com vagas.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        disabled={isBusy}
                        onClick={() => openManualEdit("skills")}
                      >
                        <PencilLine className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {workspace.session.cvState.skills.length > 0 ? (
                        workspace.session.cvState.skills.map((skill) => (
                          <Badge
                            key={skill}
                            variant="secondary"
                            className="rounded-full border border-border/60 bg-muted/55 px-3 py-1"
                          >
                            {skill}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">Nenhuma skill estruturada.</p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { key: "experience" as const, label: "Experiencia", value: workspace.session.cvState.experience.length },
                      { key: "education" as const, label: "Educacao", value: workspace.session.cvState.education.length },
                      { key: "certifications" as const, label: "Certificacoes", value: workspace.session.cvState.certifications?.length ?? 0 },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        className="rounded-[24px] border border-border/70 bg-background/75 p-4 text-left shadow-sm transition hover:border-primary/30 hover:bg-primary/5"
                        disabled={isBusy}
                        onClick={() => openManualEdit(item.key)}
                      >
                        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                          {item.label}
                        </p>
                        <p className="mt-2 text-2xl font-semibold tracking-tight">{item.value}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Clique para revisar a base.</p>
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button className="rounded-full" disabled={isBusy} onClick={() => void handleGenerateBase()}>
                      {activeMutation === "generate" ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      Gerar base
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-full"
                      disabled={!baseOutputReady || isBusy}
                      onClick={() => void handleDownload()}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Baixar base
                    </Button>
                  </div>
                </>
              ) : (
                <div className="rounded-[24px] border border-dashed border-border/70 bg-background/55 p-8 text-sm text-muted-foreground">
                  Envie sua primeira mensagem no chat para criar a sessao e carregar o workspace.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={SURFACE_CARD}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <History className="h-5 w-5 text-primary" />
                Timeline de versoes
              </CardTitle>
              <CardDescription className="leading-6">
                Historico imutavel da base e das derivacoes target para auditoria, comparacao e rollback.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  disabled={!sessionId || isBusy}
                  onClick={() => {
                    setCompareDefaults({})
                    setCompareResult(null)
                    setCompareOpen(true)
                  }}
                >
                  <GitCompare className="mr-2 h-4 w-4" />
                  Abrir comparador
                </Button>
              </div>

              {timelinePreview.length > 0 ? (
                <div className="space-y-3">
                  {timelinePreview.map((version) => (
                    <div key={version.id} className="rounded-[24px] border border-border/70 bg-background/75 p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold">{version.label}</p>
                          <p className="text-xs text-muted-foreground">{formatDateTime(version.createdAt)}</p>
                        </div>
                        <Badge variant="outline" className="rounded-full">
                          {version.scope}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[24px] border border-dashed border-border/70 bg-background/55 p-8 text-sm text-muted-foreground">
                  As versoes aparecerao aqui depois da ingestao ou de atualizacoes canonicas.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={SURFACE_CARD}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Layers3 className="h-5 w-5 text-primary" />
                Targets e acoes
              </CardTitle>
              <CardDescription className="leading-6">
                Variantes derivadas ficam separadas da base e podem ser geradas, comparadas e baixadas sem contaminar o canonico.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {gapAnalysis && (
                <div className="rounded-[24px] border border-border/70 bg-background/75 p-4 shadow-sm">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">Gap analysis</p>
                      <p className="text-xs text-muted-foreground">
                        Match score atual: {gapAnalysis.matchScore}
                      </p>
                    </div>
                    <Badge variant="secondary" className="rounded-full px-3 py-1">
                      Prioridades
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {gapAnalysis.missingSkills.slice(0, 3).map((item) => (
                      <div
                        key={`skill-${item}`}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-muted/35 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium">{item}</p>
                          <p className="text-xs text-muted-foreground">Skill ausente detectada no matching.</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          disabled={isBusy}
                          onClick={() => void handleGapAction("missing_skill", item)}
                        >
                          Aplicar
                        </Button>
                      </div>
                    ))}

                    {gapAnalysis.weakAreas.slice(0, 2).map((item) => (
                      <div
                        key={`weak-${item}`}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-muted/35 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium">{item}</p>
                          <p className="text-xs text-muted-foreground">Area com sinal fraco para a vaga alvo.</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          disabled={isBusy}
                          onClick={() => void handleGapAction("weak_area", item)}
                        >
                          Melhorar
                        </Button>
                      </div>
                    ))}

                    {gapAnalysis.improvementSuggestions.slice(0, 2).map((item) => (
                      <div
                        key={`suggestion-${item}`}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-muted/35 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium">{item}</p>
                          <p className="text-xs text-muted-foreground">Sugestao pronta para aplicacao assistida.</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          disabled={isBusy}
                          onClick={() => void handleGapAction("suggestion", item)}
                        >
                          Aplicar
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-[24px] border border-border/70 bg-background/75 p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold">Criar novo target</p>
                </div>
                <p className="mb-3 text-sm leading-6 text-muted-foreground">
                  Cole a descricao da vaga para gerar uma variante derivada sem alterar a base.
                </p>
                <Textarea
                  value={targetJobDescription}
                  disabled={isBusy || !sessionId}
                  rows={6}
                  className="rounded-[22px] border-border/70 bg-background/80"
                  placeholder="Cole a descricao da vaga para criar uma variante derivada."
                  onChange={(event) => setTargetJobDescription(event.target.value)}
                />
                <Button
                  className="mt-3 rounded-full"
                  disabled={!sessionId || !targetJobDescription.trim() || isBusy}
                  onClick={() => void handleCreateTarget()}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Criar target
                </Button>
              </div>

              <Separator />

              <div className="space-y-3">
                {workspace?.targets.length ? (
                  workspace.targets.map((target) => {
                    const targetReady = isGeneratedOutputReady(target.generatedOutput)

                    return (
                      <div key={target.id} className="rounded-[24px] border border-border/70 bg-background/75 p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <FileStack className="h-4 w-4 text-primary" />
                              <p className="text-sm font-semibold">Target {target.id.slice(0, 8)}</p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Atualizado em {formatDateTime(target.updatedAt)}
                            </p>
                          </div>
                          <Badge variant="outline" className="rounded-full">
                            {target.gapAnalysis ? `Match ${target.gapAnalysis.matchScore}` : "Sem gap"}
                          </Badge>
                        </div>

                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                          {shortenText(target.targetJobDescription)}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                            disabled={isBusy}
                            onClick={() => void handleGenerateTarget(target.id)}
                          >
                            <Sparkles className="mr-2 h-4 w-4" />
                            Gerar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                            disabled={!targetReady || isBusy}
                            onClick={() => void handleDownload(target.id)}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Baixar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                            disabled={isBusy}
                            onClick={() => handleOpenCompareWithTarget(target.id)}
                          >
                            <GitCompare className="mr-2 h-4 w-4" />
                            Comparar
                          </Button>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="rounded-[24px] border border-dashed border-border/70 bg-background/55 p-8 text-sm text-muted-foreground">
                    Nenhum target criado ainda para esta sessao.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {(errorMessage || statusMessage) && (
            <Card className={SURFACE_CARD}>
              <CardContent className="pt-6">
                {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
                {!errorMessage && statusMessage && (
                  <p className="text-sm text-muted-foreground">{statusMessage}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

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

      <CompareDrawer
        open={compareOpen}
        busy={compareBusy}
        versions={versions}
        targets={workspace?.targets ?? []}
        initialLeft={compareDefaults.left}
        initialRight={compareDefaults.right}
        result={compareResult}
        onOpenChange={setCompareOpen}
        onCompare={handleCompare}
      />
    </>
  )
}
