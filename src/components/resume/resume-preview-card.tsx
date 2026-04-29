"use client"

import { cn } from "@/lib/utils"
import type { CVState } from "@/types/cv"

type ResumePreviewCardProps = {
  cvState: CVState
  variant?: "optimized" | "original"
  className?: string
}

export function ResumePreviewCard({
  cvState,
  variant = "optimized",
  className,
}: ResumePreviewCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-white p-8 shadow-sm",
        variant === "optimized" ? "border-emerald-200" : "border-neutral-200",
        className,
      )}
    >
      {/* Header */}
      <div className="mb-6 border-b border-neutral-100 pb-6">
        <h2 className="text-2xl font-bold text-neutral-900">
          {cvState.fullName || "Seu nome"}
        </h2>
        <div className="mt-3 flex flex-col gap-1 text-sm text-neutral-600">
          {cvState.email && <span>{cvState.email}</span>}
          {cvState.phone && <span>{cvState.phone}</span>}
          {cvState.location && <span>{cvState.location}</span>}
        </div>
      </div>

      {/* Summary */}
      {cvState.summary && (
        <div className="mb-6">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Resumo Profissional
          </h3>
          <p className="text-sm leading-relaxed text-neutral-700">
            {cvState.summary}
          </p>
        </div>
      )}

      {/* Experience */}
      {cvState.experience.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Experiência Profissional
          </h3>
          <div className="space-y-4">
            {cvState.experience.map((exp, index) => (
              <div key={index}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-neutral-900">{exp.title}</p>
                    <p className="text-sm text-neutral-600">{exp.company}</p>
                  </div>
                  <span className="shrink-0 text-sm text-neutral-500">
                    {exp.startDate} - {exp.endDate}
                  </span>
                </div>
                {exp.bullets.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {exp.bullets.map((bullet, bulletIndex) => (
                      <li
                        key={bulletIndex}
                        className="flex gap-2 text-sm text-neutral-700"
                      >
                        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-neutral-400" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {cvState.skills.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Competências
          </h3>
          <div className="flex flex-wrap gap-2">
            {cvState.skills.map((skill, index) => (
              <span
                key={index}
                className="rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-700"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {cvState.education.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Educação
          </h3>
          <div className="space-y-2">
            {cvState.education.map((edu, index) => (
              <div key={index}>
                <p className="font-medium text-neutral-900">{edu.degree}</p>
                <p className="text-sm text-neutral-600">
                  {edu.institution} {edu.year && `- ${edu.year}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {cvState.certifications && cvState.certifications.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Certificações
          </h3>
          <div className="space-y-1">
            {cvState.certifications.map((cert, index) => (
              <p key={index} className="text-sm text-neutral-700">
                {cert.name} {cert.issuer && `- ${cert.issuer}`}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
