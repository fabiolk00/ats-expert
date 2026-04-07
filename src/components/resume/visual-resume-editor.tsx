"use client"

import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { CertificationEntry, CVState, EducationEntry, ExperienceEntry } from "@/types/cv"

import type { ResumeData } from "./resume-builder"

type VisualResumeEditorProps = {
  value: CVState
  onChange: (nextValue: CVState) => void
  disabled?: boolean
}

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
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-border dark:bg-card md:p-8">
      <div className="mb-6 space-y-1">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      {children}
    </section>
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

export function VisualResumeEditor({
  value,
  onChange,
  disabled = false,
}: VisualResumeEditorProps) {
  return (
    <div className="space-y-6">
      <SectionCard
        title="Dados pessoais"
        description="Estrutura visual pronta para receber seus dados manuais ou importados."
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
            placeholder="Localiza\u00e7\u00e3o"
            className="md:col-span-2"
            disabled={disabled}
            onChange={(event) => onChange({ ...value, location: event.target.value })}
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Resumo profissional"
        description="Use este espa\u00e7o para apresentar sua proposta de valor."
      >
        <Textarea
          value={value.summary}
          rows={6}
          disabled={disabled}
          placeholder="Escreva um resumo curto sobre sua experi\u00eancia, foco e resultados."
          onChange={(event) => onChange({ ...value, summary: event.target.value })}
        />
      </SectionCard>

      <SectionCard
        title="Experi\u00eancia"
        description="Cada bloco representa uma experi\u00eancia profissional."
      >
        <div className="space-y-4">
          {value.experience.map((item, index) => (
            <div
              key={`experience-${index}`}
              className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-border dark:bg-background/40"
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
                  placeholder="Localiza\u00e7\u00e3o"
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
                    placeholder="In\u00edcio"
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
                  placeholder={"Uma conquista por linha\nEx.: Liderei uma migra\u00e7\u00e3o que reduziu custos em 20%."}
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
            </div>
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
            Adicionar experi\u00eancia
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Skills" description="Liste habilidades, ferramentas e tecnologias relevantes.">
        <Textarea
          value={value.skills.join("\n")}
          rows={6}
          disabled={disabled}
          placeholder={"Uma skill por linha\nEx.: TypeScript\nReact\nProduct Design"}
          onChange={(event) =>
            onChange({
              ...value,
              skills: event.target.value
                .split("\n")
                .map((skill) => skill.trim())
                .filter(Boolean),
            })
          }
        />
      </SectionCard>

      <SectionCard title="Educa\u00e7\u00e3o" description="Adicione forma\u00e7\u00f5es acad\u00eamicas e cursos relevantes.">
        <div className="space-y-4">
          {value.education.map((item, index) => (
            <div
              key={`education-${index}`}
              className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-border dark:bg-background/40 md:grid-cols-2"
            >
              <Input
                value={item.degree}
                placeholder="Curso ou gradua\u00e7\u00e3o"
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
                placeholder="Institui\u00e7\u00e3o"
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
                placeholder="Informa\u00e7\u00e3o complementar"
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
            Adicionar forma\u00e7\u00e3o
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        title="Certifica\u00e7\u00f5es"
        description="Mantenha esta se\u00e7\u00e3o pronta para certificados e credenciais."
      >
        <div className="space-y-4">
          {(value.certifications ?? []).map((item, index) => (
            <div
              key={`certification-${index}`}
              className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-border dark:bg-background/40 md:grid-cols-3"
            >
              <Input
                value={item.name}
                placeholder="Certifica\u00e7\u00e3o"
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
            Adicionar certifica\u00e7\u00e3o
          </Button>
        </div>
      </SectionCard>
    </div>
  )
}
