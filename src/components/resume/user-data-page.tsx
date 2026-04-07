"use client"

import { useEffect, useMemo, useState } from "react"
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Layers3,
  Linkedin,
  Loader2,
  Moon,
  Sparkles,
  Sun,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { toast } from "sonner"

import Logo from "@/components/logo"
import { Button } from "@/components/ui/button"
import type { CVState } from "@/types/cv"

import { ImportResumeModal, type ResumeData } from "./resume-builder"
import { VisualResumeEditor, normalizeResumeData } from "./visual-resume-editor"

type ProfileResponse = {
  profile: {
    id: string
    source: string
    cvState: ResumeData
    linkedinUrl: string | null
    extractedAt: string
    createdAt: string
    updatedAt: string
  } | null
}

function trimOptional(value?: string): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function sanitizeResumeData(value: CVState): CVState {
  const experience = value.experience
    .map((entry) => ({
      title: entry.title.trim(),
      company: entry.company.trim(),
      location: trimOptional(entry.location),
      startDate: entry.startDate.trim(),
      endDate: entry.endDate.trim(),
      bullets: entry.bullets.map((bullet) => bullet.trim()).filter(Boolean),
    }))
    .filter(
      (entry) =>
        entry.title.length > 0 ||
        entry.company.length > 0 ||
        Boolean(entry.location) ||
        entry.startDate.length > 0 ||
        entry.endDate.length > 0 ||
        entry.bullets.length > 0,
    )

  const education = value.education
    .map((entry) => ({
      degree: entry.degree.trim(),
      institution: entry.institution.trim(),
      year: entry.year.trim(),
      gpa: trimOptional(entry.gpa),
    }))
    .filter(
      (entry) =>
        entry.degree.length > 0 ||
        entry.institution.length > 0 ||
        entry.year.length > 0 ||
        Boolean(entry.gpa),
    )

  const certifications = (value.certifications ?? [])
    .map((entry) => ({
      name: entry.name.trim(),
      issuer: entry.issuer.trim(),
      year: trimOptional(entry.year),
    }))
    .filter((entry) => entry.name.length > 0 || entry.issuer.length > 0 || Boolean(entry.year))

  return {
    fullName: value.fullName.trim(),
    email: value.email.trim(),
    phone: value.phone.trim(),
    linkedin: trimOptional(value.linkedin),
    location: trimOptional(value.location),
    summary: value.summary.trim(),
    experience,
    skills: value.skills.map((skill) => skill.trim()).filter(Boolean),
    education,
    certifications: certifications.length > 0 ? certifications : undefined,
  }
}

export default function UserDataPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [resumeData, setResumeData] = useState<CVState>(() => normalizeResumeData())
  const [profileSource, setProfileSource] = useState<string | null>(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let isMounted = true

    const loadProfile = async (): Promise<void> => {
      try {
        const response = await fetch("/api/profile", {
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Nao foi possivel carregar seu perfil.")
        }

        const data = (await response.json()) as ProfileResponse
        if (!isMounted) {
          return
        }

        if (data.profile) {
          setResumeData(normalizeResumeData(data.profile.cvState))
          setProfileSource(data.profile.source)
          setLastUpdatedAt(data.profile.updatedAt)
          return
        }

        setResumeData(normalizeResumeData())
        setProfileSource(null)
        setLastUpdatedAt(null)
      } catch (error) {
        if (isMounted) {
          toast.error(error instanceof Error ? error.message : "Erro ao carregar o perfil salvo.")
        }
      } finally {
        if (isMounted) {
          setIsLoadingProfile(false)
        }
      }
    }

    void loadProfile()

    return () => {
      isMounted = false
    }
  }, [])

  const handleImportSuccess = (data: ResumeData) => {
    setIsImportOpen(false)
    setResumeData(normalizeResumeData(data))
    setProfileSource("linkedin")
    setLastUpdatedAt(new Date().toISOString())
  }

  const handleImportClose = () => {
    setIsImportOpen(false)
  }

  const handleSave = async (): Promise<void> => {
    setIsSaving(true)

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sanitizeResumeData(resumeData)),
      })

      const data = (await response.json()) as ProfileResponse & { error?: string }
      if (!response.ok || !data.profile) {
        throw new Error(data.error ?? "Nao foi possivel salvar seu perfil.")
      }

      setResumeData(normalizeResumeData(data.profile.cvState))
      setProfileSource(data.profile.source)
      setLastUpdatedAt(data.profile.updatedAt)
      toast.success("Perfil salvo com sucesso.")
      router.push("/dashboard/resumes")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar o perfil.")
    } finally {
      setIsSaving(false)
    }
  }

  const profileBadgeText = useMemo(() => {
    if (!profileSource) {
      return "Perfil ainda nao salvo"
    }

    if (profileSource === "linkedin") {
      return "Base salva a partir do LinkedIn"
    }

    if (profileSource === "manual") {
      return "Base salva manualmente"
    }

    return `Base salva via ${profileSource}`
  }, [profileSource])

  const filledSections = useMemo(() => {
    const hasContact = Boolean(
      resumeData.fullName || resumeData.email || resumeData.phone || resumeData.linkedin || resumeData.location,
    )
    const hasSummary = Boolean(resumeData.summary.trim())
    const hasExperience = resumeData.experience.some((entry) =>
      Boolean(entry.title.trim() || entry.company.trim() || entry.bullets.length > 0),
    )
    const hasSkills = resumeData.skills.length > 0
    const hasEducation = resumeData.education.some((entry) =>
      Boolean(entry.degree.trim() || entry.institution.trim() || entry.year.trim()),
    )
    const hasCertifications = Boolean(resumeData.certifications?.length)

    return [hasContact, hasSummary, hasExperience, hasSkills, hasEducation, hasCertifications].filter(Boolean).length
  }, [resumeData])

  const stats = [
    { label: "Seções preenchidas", value: `${filledSections}/6`, icon: Layers3 },
    { label: "Experiências", value: `${resumeData.experience.length}`, icon: BadgeCheck },
    { label: "Skills", value: `${resumeData.skills.length}`, icon: Sparkles },
  ]

  const updatedLabel = lastUpdatedAt
    ? `Atualizado em ${new Date(lastUpdatedAt).toLocaleDateString("pt-BR")} às ${new Date(lastUpdatedAt).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })}`
    : "Nenhuma atualização salva ainda."

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50/70 font-sans dark:bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.12),_transparent_24%),linear-gradient(to_bottom,rgba(255,255,255,0.3),transparent_30%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(15,23,42,0.35),_transparent_28%),linear-gradient(to_bottom,rgba(15,23,42,0.16),transparent_36%)]" />
      <header className="sticky top-0 z-10 border-b border-white/60 bg-white/90 px-4 backdrop-blur-xl dark:border-border/60 dark:bg-card/85 md:px-8">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between">
          <Logo size="sm" linkTo="/dashboard" />
          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:border-border dark:bg-background/60 dark:text-slate-300 sm:flex">
            <Clock3 className="h-3.5 w-3.5" />
            Perfil base sincronizado
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="relative rounded-full text-muted-foreground hover:text-foreground"
              aria-label="Alternar tema"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard/resumes")}
              className="hidden rounded-full font-medium text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 sm:flex"
            >
              Cancelar
            </Button>
            <Button
              disabled={isLoadingProfile || isSaving}
              onClick={() => void handleSave()}
              className="rounded-full bg-blue-600 px-4 font-semibold text-white shadow-sm hover:bg-blue-700 sm:px-6"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl space-y-8 px-4 py-8 md:py-12">
        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white/90 shadow-sm backdrop-blur dark:border-border dark:bg-card/90">
          <div className="grid gap-8 px-5 py-7 md:grid-cols-[1.3fr_0.7fr] md:px-8 md:py-8">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300">
                <Sparkles className="h-3.5 w-3.5" />
                Base profissional
              </div>

              <div className="space-y-3">
                <h1 className="max-w-2xl text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-4xl">
                  Revise seu currículo sem perder a elegância do fluxo original.
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400 md:text-base">
                  Importe do LinkedIn, revise os campos manualmente e mantenha sua base pronta para
                  novas sessões automaticamente. Os blocos abaixo podem ser abertos e fechados para
                  focar no que importa.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  onClick={() => setIsImportOpen(true)}
                  className="flex h-11 items-center gap-2 rounded-full bg-blue-600 px-5 font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  <Linkedin className="h-4 w-4" />
                  Importar do LinkedIn ou PDF
                </Button>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 dark:border-border dark:bg-background/60 dark:text-slate-300">
                  {profileBadgeText}
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              {stats.map((stat) => {
                const Icon = stat.icon
                return (
                  <div
                    key={stat.label}
                    className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4 dark:border-border dark:bg-background/50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          {stat.label}
                        </p>
                        <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                          {stat.value}
                        </p>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm dark:bg-card dark:text-blue-300">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="border-t border-slate-100 px-5 py-4 text-sm text-slate-500 dark:border-border dark:text-slate-400 md:px-8">
            {updatedLabel}
          </div>
        </section>

        {isLoadingProfile ? (
          <div className="flex min-h-64 items-center justify-center rounded-[28px] border border-slate-200 bg-white/90 shadow-sm backdrop-blur dark:border-border dark:bg-card/90">
            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              Carregando perfil salvo...
            </div>
          </div>
        ) : (
          <>
            {profileSource && (
              <div className="flex items-start gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-100">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  O perfil salvo funciona como base para novas sessões. Editar e salvar aqui não altera
                  sessões antigas nem cria versões em <code>cv_versions</code>.
                </p>
              </div>
            )}

            <div className="rounded-[28px] border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-border dark:bg-card/90 md:p-6">
              <VisualResumeEditor value={resumeData} onChange={setResumeData} disabled={isSaving} />
            </div>
          </>
        )}
      </main>

      <ImportResumeModal
        isOpen={isImportOpen}
        onClose={handleImportClose}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  )
}
