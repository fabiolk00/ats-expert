import type {
  JobCompatibilityEvidence,
  JobCompatibilityEvidenceSourceKind,
} from '@/lib/agent/job-targeting/compatibility/types'
import type { CVState } from '@/types/cv'

import {
  detectEvidenceQualifier,
  RESUME_EVIDENCE_SOURCE_CONFIDENCE,
} from './evidence-qualifiers'
import { normalizeCompatibilityText } from './requirement-decomposition'

export const EVIDENCE_EXTRACTION_VERSION = 'evidence-extraction-v1'

export function extractResumeEvidence(cvState: CVState): JobCompatibilityEvidence[] {
  const evidence: JobCompatibilityEvidence[] = []

  splitSentences(cvState.summary).forEach((sentence, index) => {
    addEvidence(evidence, {
      text: sentence,
      sourceKind: 'summary_sentence',
      section: 'summary',
      cvPath: index === 0 ? 'summary' : `summary.sentences[${index}]`,
    })
  })

  cvState.skills.forEach((skill, index) => {
    addEvidence(evidence, {
      text: skill,
      sourceKind: 'skill',
      section: 'skills',
      cvPath: `skills[${index}]`,
    })
  })

  cvState.experience.forEach((entry, entryIndex) => {
    addEvidence(evidence, {
      text: entry.title,
      sourceKind: 'experience_title',
      section: 'experience',
      cvPath: `experience[${entryIndex}].title`,
      entryIndex,
    })

    entry.bullets.forEach((bullet, bulletIndex) => {
      addEvidence(evidence, {
        text: bullet,
        sourceKind: 'experience_bullet',
        section: 'experience',
        cvPath: `experience[${entryIndex}].bullets[${bulletIndex}]`,
        entryIndex,
        bulletIndex,
      })
    })
  })

  cvState.education.forEach((entry, entryIndex) => {
    addEvidence(evidence, {
      text: joinEvidenceParts([entry.degree, entry.institution]),
      sourceKind: 'education_entry',
      section: 'education',
      cvPath: `education[${entryIndex}]`,
      entryIndex,
    })
  })

  cvState.certifications?.forEach((entry, entryIndex) => {
    addEvidence(evidence, {
      text: joinEvidenceParts([entry.name, entry.issuer]),
      sourceKind: 'certification_entry',
      section: 'certifications',
      cvPath: `certifications[${entryIndex}]`,
      entryIndex,
    })
  })

  return evidence
}

function addEvidence(
  evidence: JobCompatibilityEvidence[],
  item: {
    text: string
    sourceKind: JobCompatibilityEvidenceSourceKind
    section: JobCompatibilityEvidence['section']
    cvPath: string
    entryIndex?: number
    bulletIndex?: number
  },
) {
  const text = cleanEvidenceText(item.text)
  const normalizedText = normalizeCompatibilityText(text)

  if (!normalizedText) {
    return
  }

  evidence.push({
    id: buildEvidenceId(evidence.length, item.sourceKind, normalizedText),
    text,
    normalizedText,
    section: item.section,
    sourceKind: item.sourceKind,
    cvPath: item.cvPath,
    sourceConfidence: RESUME_EVIDENCE_SOURCE_CONFIDENCE[item.sourceKind],
    qualifier: detectEvidenceQualifier(text),
    ...(item.entryIndex === undefined ? {} : { entryIndex: item.entryIndex }),
    ...(item.bulletIndex === undefined ? {} : { bulletIndex: item.bulletIndex }),
  })
}

function splitSentences(value: string): string[] {
  return value
    .split(/[.!?]+/)
    .map(cleanEvidenceText)
    .filter(Boolean)
}

function joinEvidenceParts(parts: string[]): string {
  return parts.map(cleanEvidenceText).filter(Boolean).join(', ')
}

function cleanEvidenceText(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .replace(/^[\s:;,.]+|[\s:;,.]+$/g, '')
    .trim()
}

function buildEvidenceId(index: number, sourceKind: JobCompatibilityEvidenceSourceKind, normalizedText: string): string {
  const slug = normalizedText.replace(/\s+/g, '-').slice(0, 48)
  return `evidence-${index + 1}-${sourceKind}-${slug}`
}
