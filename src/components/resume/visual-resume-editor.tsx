"use client"

import { useEffect, useState, type ChangeEvent, type ReactNode } from "react"
import {
  BadgeCheck,
  BriefcaseBusiness,
  ChevronDown,
  FileText,
  GraduationCap,
  Plus,
  Trash2,
  UserRound,
  Wrench,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { CertificationEntry, CVState, EducationEntry, ExperienceEntry } from "@/types/cv"

import type { ResumeData } from "./resume-builder"

type VisualResumeEditorProps = {
  value: CVState
  onChange: (nextValue: CVState) => void
  disabled?: boolean
  onAllSectionsClosedChange?: (allClosed: boolean) => void
  compactMode?: boolean
}

type SectionId =
  | "personal"
  | "summary"
  | "experience"
  | "skills"
  | "education"
  | "certifications"

const emptyExperience = (): ExperienceEntry => ({
  title: "",
  company: "",
  location: "",
  startDate: "",
  endDate: "",
  bullets: [],
})

const emptyEducation = (): EducationEntry => ({
  degree: "",
  institution: "",
  year: "",
  gpa: "",
})

const emptyCertification = (): CertificationEntry => ({
  name: "",
  issuer: "",
  year: "",
})

export function normalizeResumeData(initialData?: ResumeData | null): CVState {
  return {
    fullName: initialData?.fullName ?? "",
    email: initialData?.email ?? "",
    phone: initialData?.phone ?? "",
    linkedin: initialData?.linkedin ?? "",
    location: initialData?.location ?? "",
    summary: initialData?.summary ?? "",
    skills: initialData?.skills ?? [],
    experience: initialData?.experience?.length ? initialData.experience : [emptyExperience()],
    education: initialData?.education?.length ? initialData.education : [emptyEducation()],
    certifications: initialData?.certifications?.length
      ? initialData.certifications
      : [emptyCertification()],
  }
}

function SectionCard({
  title,
  description,
  icon,
  isOpen,
  onToggle,
  compactMode = false,
  children,
}: {
  title: string
  description: string
  icon: ReactNode
  isOpen: boolean
  onToggle: () => void
  compactMode?: boolean
  children: ReactNode
}) {
  const isDistributedLayout = compactMode && !isOpen

  return (
    <Card
      className={cn(
        "gap-0 overflow-hidden rounded-[22px] border border-border bg-card py-0 shadow-none transition-[border-color,box-shadow] duration-200",
        isDistributedLayout && "h-full min-h-[126px] shadow-sm",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-muted/50",
          isDistributedLayout && "h-full items-start py-5",
        )}
        aria-expanded={isOpen}
      >
        <div className={cn("flex min-w-0 items-start gap-4", isDistributedLayout && "flex-1")}>
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-muted/70 text-muted-foreground",
              isDistributedLayout && "h-12 w-12",
            )}
          >
            {icon}
          </div>
          <div className="min-w-0 space-y-1.5">
            <h2 className="text-base font-medium text-foreground">
              {title}
            </h2>
            <p
              className={cn(
                "text-sm leading-6 text-muted-foreground",
                isDistributedLayout ? "line-clamp-3" : "truncate",
              )}
            >
              {description}
            </p>
          </div>
        </div>

        <div
          className={cn(
            "ml-auto flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-full text-muted-foreground",
            isDistributedLayout && "self-start",
          )}
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
        </div>
      </button>

      {isOpen ? (
        <CardContent className="border-t border-border px-5 pb-5 pt-0">
          <div className="pt-5">{children}</div>
        </CardContent>
      ) : null}
    </Card>
  )
}

function ItemCard({
  title,
  onDelete,
  disabled,
  children,
}: {
  title: string
  onDelete: () => void
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          onClick={onDelete}
          className="rounded-full text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-300"
          aria-label={`Excluir ${title.toLowerCase()}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      {children}
    </div>
  )
}

function updateExperienceEntry(
  value: CVState,
  index: number,
  patch: Partial<ExperienceEntry>,
): ExperienceEntry[] {
  return value.experience.map((entry, entryIndex) =>
    entryIndex === index ? { ...entry, ...patch } : entry,
  )
}

function updateEducationEntry(
  value: CVState,
  index: number,
  patch: Partial<EducationEntry>,
): EducationEntry[] {
  return value.education.map((entry, entryIndex) =>
    entryIndex === index ? { ...entry, ...patch } : entry,
  )
}

function updateCertificationEntry(
  value: CVState,
  index: number,
  patch: Partial<CertificationEntry>,
): CertificationEntry[] {
  return (value.certifications ?? []).map((entry, entryIndex) =>
    entryIndex === index ? { ...entry, ...patch } : entry,
  )
}

function removeExperienceEntry(value: CVState, index: number): ExperienceEntry[] {
  const nextEntries = value.experience.filter((_, entryIndex) => entryIndex !== index)
  return nextEntries.length > 0 ? nextEntries : [emptyExperience()]
}

function removeEducationEntry(value: CVState, index: number): EducationEntry[] {
  const nextEntries = value.education.filter((_, entryIndex) => entryIndex !== index)
  return nextEntries.length > 0 ? nextEntries : [emptyEducation()]
}

function removeCertificationEntry(value: CVState, index: number): CertificationEntry[] {
  const nextEntries = (value.certifications ?? []).filter((_, entryIndex) => entryIndex !== index)
  return nextEntries.length > 0 ? nextEntries : [emptyCertification()]
}

function buildSkillsDraft(skills: string[]): string {
  return skills.join("\n")
}

function parseSkillsDraft(draft: string): string[] {
  return draft
    .split("\n")
    .map((skill) => skill.trim())
    .filter(Boolean)
}

export function VisualResumeEditor({
  value,
  onChange,
  disabled = false,
  onAllSectionsClosedChange,
  compactMode = false,
}: VisualResumeEditorProps) {
  const [openSections, setOpenSections] = useState<Record<SectionId, boolean>>({
    personal: true,
    summary: true,
    experience: false,
    skills: true,
    education: false,
    certifications: false,
  })
  const [skillsDraft, setSkillsDraft] = useState(() => buildSkillsDraft(value.skills))
  const [isEditingSkills, setIsEditingSkills] = useState(false)
  const areAllSectionsCollapsed = Object.values(openSections).every((isOpen) => !isOpen)
  const isDistributedLayout = compactMode && areAllSectionsCollapsed

  useEffect(() => {
    onAllSectionsClosedChange?.(areAllSectionsCollapsed)
  }, [areAllSectionsCollapsed, onAllSectionsClosedChange])

  useEffect(() => {
    if (!isEditingSkills) {
      setSkillsDraft(buildSkillsDraft(value.skills))
    }
  }, [isEditingSkills, value.skills])

  const toggleSection = (section: SectionId) => {
    setOpenSections((current) => ({
      ...current,
      [section]: !current[section],
    }))
  }

  const handleSkillsChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const nextDraft = event.target.value
    setSkillsDraft(nextDraft)
    onChange({
      ...value,
      skills: parseSkillsDraft(nextDraft),
    })
  }

  const handleSkillsBlur = () => {
    setIsEditingSkills(false)
    setSkillsDraft(buildSkillsDraft(parseSkillsDraft(skillsDraft)))
  }

  return (
    <div className={cn(isDistributedLayout ? "grid h-full auto-rows-fr gap-4 lg:grid-cols-2" : "space-y-4")}>
      <SectionCard
        title="Dados pessoais"
        description="Estrutura visual pronta para receber seus dados manuais ou importados."
        icon={<UserRound className="h-5 w-5" />}
        isOpen={openSections.personal}
        onToggle={() => toggleSection("personal")}
        compactMode={isDistributedLayout}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            value={value.fullName}
            placeholder="Nome completo"
            disabled={disabled}
            onChange={(event) => onChange({ ...value, fullName: event.target.value })}
          />
          <Input
            value={value.email}
            placeholder="Email"
            disabled={disabled}
            onChange={(event) => onChange({ ...value, email: event.target.value })}
          />
          <Input
            value={value.phone}
            placeholder="Telefone"
            disabled={disabled}
            onChange={(event) => onChange({ ...value, phone: event.target.value })}
          />
          <Input
            value={value.linkedin ?? ""}
            placeholder="LinkedIn"
            disabled={disabled}
            onChange={(event) => onChange({ ...value, linkedin: event.target.value })}
          />
          <Input
            value={value.location ?? ""}
            placeholder="Localização"
            className="md:col-span-2"
            disabled={disabled}
            onChange={(event) => onChange({ ...value, location: event.target.value })}
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Resumo profissional"
        description="Use este espaço para apresentar sua proposta de valor."
        icon={<FileText className="h-5 w-5" />}
        isOpen={openSections.summary}
        onToggle={() => toggleSection("summary")}
        compactMode={isDistributedLayout}
      >
        <Textarea
          value={value.summary}
          rows={6}
          disabled={disabled}
          placeholder="Escreva um resumo curto sobre sua experiência, foco e resultados."
          onChange={(event) => onChange({ ...value, summary: event.target.value })}
        />
      </SectionCard>

      <SectionCard
        title="Skills"
        description="Liste habilidades, ferramentas e tecnologias relevantes."
        icon={<Wrench className="h-5 w-5" />}
        isOpen={openSections.skills}
        onToggle={() => toggleSection("skills")}
        compactMode={isDistributedLayout}
      >
        <Textarea
          value={skillsDraft}
          rows={6}
          disabled={disabled}
          placeholder={"Uma skill por linha\nEx.: TypeScript\nReact\nProduct Design"}
          onFocus={() => setIsEditingSkills(true)}
          onBlur={handleSkillsBlur}
          onChange={handleSkillsChange}
        />
      </SectionCard>

      <SectionCard
        title="Experiência"
        description="Cada bloco representa uma experiência profissional."
        icon={<BriefcaseBusiness className="h-5 w-5" />}
        isOpen={openSections.experience}
        onToggle={() => toggleSection("experience")}
        compactMode={isDistributedLayout}
      >
        <div className="space-y-4">
          {value.experience.map((item, index) => (
            <ItemCard
              key={`experience-${index}`}
              title={`Experiência ${index + 1}`}
              disabled={disabled}
              onDelete={() =>
                onChange({
                  ...value,
                  experience: removeExperienceEntry(value, index),
                })
              }
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  value={item.title}
                  placeholder="Cargo"
                  disabled={disabled}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      experience: updateExperienceEntry(value, index, {
                        title: event.target.value,
                      }),
                    })
                  }
                />
                <Input
                  value={item.company}
                  placeholder="Empresa"
                  disabled={disabled}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      experience: updateExperienceEntry(value, index, {
                        company: event.target.value,
                      }),
                    })
                  }
                />
                <Input
                  value={item.location ?? ""}
                  placeholder="Localização"
                  disabled={disabled}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      experience: updateExperienceEntry(value, index, {
                        location: event.target.value,
                      }),
                    })
                  }
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    value={item.startDate}
                    placeholder="Início"
                    disabled={disabled}
                    onChange={(event) =>
                      onChange({
                        ...value,
                        experience: updateExperienceEntry(value, index, {
                          startDate: event.target.value,
                        }),
                      })
                    }
                  />
                  <Input
                    value={item.endDate}
                    placeholder="Fim"
                    disabled={disabled}
                    onChange={(event) =>
                      onChange({
                        ...value,
                        experience: updateExperienceEntry(value, index, {
                          endDate: event.target.value,
                        }),
                      })
                    }
                  />
                </div>
                <Textarea
                  value={item.bullets.join("\n")}
                  rows={5}
                  className="md:col-span-2"
                  disabled={disabled}
                  placeholder={"Uma conquista por linha\nEx.: Liderei uma migração que reduziu custos em 20%."}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      experience: updateExperienceEntry(value, index, {
                        bullets: event.target.value
                          .split("\n")
                          .map((bullet) => bullet.trim())
                          .filter(Boolean),
                      }),
                    })
                  }
                />
              </div>
            </ItemCard>
          ))}

          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={disabled}
            onClick={() =>
              onChange({
                ...value,
                experience: [...value.experience, emptyExperience()],
              })
            }
          >
            <Plus className="h-4 w-4" />
            Adicionar experiência
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        title="Educação"
        description="Adicione formações acadêmicas e cursos relevantes."
        icon={<GraduationCap className="h-5 w-5" />}
        isOpen={openSections.education}
        onToggle={() => toggleSection("education")}
        compactMode={isDistributedLayout}
      >
        <div className="space-y-4">
          {value.education.map((item, index) => (
            <ItemCard
              key={`education-${index}`}
              title={`Formação ${index + 1}`}
              disabled={disabled}
              onDelete={() =>
                onChange({
                  ...value,
                  education: removeEducationEntry(value, index),
                })
              }
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  value={item.degree}
                  placeholder="Curso ou graduação"
                  disabled={disabled}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      education: updateEducationEntry(value, index, {
                        degree: event.target.value,
                      }),
                    })
                  }
                />
                <Input
                  value={item.institution}
                  placeholder="Instituição"
                  disabled={disabled}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      education: updateEducationEntry(value, index, {
                        institution: event.target.value,
                      }),
                    })
                  }
                />
                <Input
                  value={item.year}
                  placeholder="Ano"
                  disabled={disabled}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      education: updateEducationEntry(value, index, {
                        year: event.target.value,
                      }),
                    })
                  }
                />
                <Input
                  value={item.gpa ?? ""}
                  placeholder="Informação complementar"
                  disabled={disabled}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      education: updateEducationEntry(value, index, {
                        gpa: event.target.value,
                      }),
                    })
                  }
                />
              </div>
            </ItemCard>
          ))}

          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={disabled}
            onClick={() =>
              onChange({
                ...value,
                education: [...value.education, emptyEducation()],
              })
            }
          >
            <Plus className="h-4 w-4" />
            Adicionar formação
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        title="Certificações"
        description="Mantenha esta seção pronta para certificados e credenciais."
        icon={<BadgeCheck className="h-5 w-5" />}
        isOpen={openSections.certifications}
        onToggle={() => toggleSection("certifications")}
        compactMode={isDistributedLayout}
      >
        <div className="space-y-4">
          {(value.certifications ?? []).map((item, index) => (
            <ItemCard
              key={`certification-${index}`}
              title={`Certificação ${index + 1}`}
              disabled={disabled}
              onDelete={() =>
                onChange({
                  ...value,
                  certifications: removeCertificationEntry(value, index),
                })
              }
            >
              <div className="grid gap-4 md:grid-cols-3">
                <Input
                  value={item.name}
                  placeholder="Certificação"
                  disabled={disabled}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      certifications: updateCertificationEntry(value, index, {
                        name: event.target.value,
                      }),
                    })
                  }
                />
                <Input
                  value={item.issuer}
                  placeholder="Emissor"
                  disabled={disabled}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      certifications: updateCertificationEntry(value, index, {
                        issuer: event.target.value,
                      }),
                    })
                  }
                />
                <Input
                  value={item.year ?? ""}
                  placeholder="Ano"
                  disabled={disabled}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      certifications: updateCertificationEntry(value, index, {
                        year: event.target.value,
                      }),
                    })
                  }
                />
              </div>
            </ItemCard>
          ))}

          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={disabled}
            onClick={() =>
              onChange({
                ...value,
                certifications: [...(value.certifications ?? []), emptyCertification()],
              })
            }
          >
            <Plus className="h-4 w-4" />
            Adicionar certificação
          </Button>
        </div>
      </SectionCard>
    </div>
  )
}
