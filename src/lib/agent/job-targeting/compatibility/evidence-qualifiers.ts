import type { EvidenceQualifier } from '@/lib/agent/job-targeting/compatibility/types'

export const RESUME_EVIDENCE_SOURCE_CONFIDENCE = {
  experience_bullet: 1,
  experience_title: 0.8,
  certification_entry: 0.9,
  education_entry: 0.9,
  skill: 0.65,
  summary_sentence: 0.55,
} as const

const QUALIFIER_PATTERNS: Array<{
  qualifier: EvidenceQualifier
  pattern: RegExp
}> = [
  {
    qualifier: 'negative',
    pattern: /\b(?:sem\s+experi[eê]ncia|no\s+experience|without\s+experience|n[aã]o\s+tenho\s+experi[eê]ncia)\b/iu,
  },
  {
    qualifier: 'introductory',
    pattern: /\b(?:curso\s+introdut[oó]rio|introductory\s+course|introductory)\b/iu,
  },
  {
    qualifier: 'learning',
    pattern: /\b(?:aprendendo|learning|studying|estudando)\b/iu,
  },
  {
    qualifier: 'basic',
    pattern: /\b(?:b[aá]sico|b[aá]sica|basic|beginner|iniciante)\b/iu,
  },
  {
    qualifier: 'familiarity',
    pattern: /\b(?:no[cç][oõ]es|familiarity|familiarizado|familiarizada)\b/iu,
  },
  {
    qualifier: 'expired',
    pattern: /\b(?:expirad[ao]s?|expired)\b/iu,
  },
  {
    qualifier: 'strong',
    pattern: /\b(?:avan[cç]ad[ao]s?|advanced|profici[eê]ncia|proficiency|experi[eê]ncia\s+(?:s[oó]lida|comprovada|pr[aá]tica)|hands-on)\b/iu,
  },
]

export function detectEvidenceQualifier(value: string): EvidenceQualifier {
  const match = QUALIFIER_PATTERNS.find(({ pattern }) => pattern.test(value))
  return match?.qualifier ?? 'unknown'
}

export function isWeakEvidenceQualifier(qualifier: EvidenceQualifier): boolean {
  return qualifier === 'basic'
    || qualifier === 'introductory'
    || qualifier === 'learning'
    || qualifier === 'familiarity'
    || qualifier === 'expired'
}

