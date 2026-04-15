import type { AtsAnalysisResult, RewriteSectionInput } from '@/types/agent'
import type { CVState } from '@/types/cv'

type RewriteSectionName = RewriteSectionInput['section']

export type RewritePlanSection = {
  section: RewriteSectionName
  goal: string
  keywordFocus: string[]
  factualAnchors: string[]
  instructions: string[]
}

export type ResumeRewritePlan = {
  keywordFocus: string[]
  sharedNarrative: string
  sections: Record<RewriteSectionName, RewritePlanSection>
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}

function buildSharedNarrative(cvState: CVState): string {
  const titles = unique(cvState.experience.map((entry) => entry.title)).slice(0, 3)
  const companies = unique(cvState.experience.map((entry) => entry.company)).slice(0, 3)
  const skills = unique(cvState.skills).slice(0, 8)

  return [
    `Maintain one factual narrative across sections for ${cvState.fullName || 'the candidate'}.`,
    titles.length > 0 ? `Ground seniority and positioning in these roles: ${titles.join(', ')}.` : '',
    companies.length > 0 ? `Do not introduce employers beyond: ${companies.join(', ')}.` : '',
    skills.length > 0 ? `Prefer evidence-backed keywords from this stack: ${skills.join(', ')}.` : '',
  ].filter(Boolean).join(' ')
}

export function buildRewritePlan(
  cvState: CVState,
  atsAnalysis: AtsAnalysisResult,
): ResumeRewritePlan {
  const keywordFocus = unique([
    ...cvState.skills,
    ...atsAnalysis.recommendations.flatMap((item) => item.split(/[|,]/)),
  ]).slice(0, 12)

  const factualAnchors = {
    summary: unique([
      ...cvState.skills.slice(0, 8),
      ...cvState.experience.map((entry) => entry.title),
    ]),
    experience: unique([
      ...cvState.experience.map((entry) => `${entry.title} at ${entry.company}`),
    ]),
    skills: unique(cvState.skills),
    education: unique(cvState.education.map((entry) => `${entry.degree} - ${entry.institution}`)),
    certifications: unique((cvState.certifications ?? []).map((entry) => `${entry.name} - ${entry.issuer}`)),
  } satisfies Record<RewriteSectionName, string[]>

  const sharedNarrative = buildSharedNarrative(cvState)

  return {
    keywordFocus,
    sharedNarrative,
    sections: {
      summary: {
        section: 'summary',
        goal: 'Clarify positioning and ATS readability without overstating scope.',
        keywordFocus,
        factualAnchors: factualAnchors.summary,
        instructions: [
          sharedNarrative,
          'Keep the summary aligned with real roles, tools, and outcomes already present elsewhere in the resume.',
        ],
      },
      experience: {
        section: 'experience',
        goal: 'Rewrite bullets with clearer impact and ATS readability while preserving dates and scope.',
        keywordFocus,
        factualAnchors: factualAnchors.experience,
        instructions: [
          sharedNarrative,
          'Do not add metrics or projects that do not already appear in the original experience.',
        ],
      },
      skills: {
        section: 'skills',
        goal: 'Reorder and group only evidenced skills.',
        keywordFocus,
        factualAnchors: factualAnchors.skills,
        instructions: [
          sharedNarrative,
          'Only include skills that are already present or directly evidenced by the original resume.',
        ],
      },
      education: {
        section: 'education',
        goal: 'Keep education formatting consistent and factual.',
        keywordFocus: [],
        factualAnchors: factualAnchors.education,
        instructions: [
          'Preserve degree, institution, and year exactly.',
        ],
      },
      certifications: {
        section: 'certifications',
        goal: 'Keep certifications factual and consistently ordered.',
        keywordFocus: [],
        factualAnchors: factualAnchors.certifications,
        instructions: [
          'Preserve certification, issuer, and year exactly.',
        ],
      },
    },
  }
}
