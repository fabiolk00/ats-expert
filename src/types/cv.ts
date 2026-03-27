export type Phase = 'intake' | 'analysis' | 'dialog' | 'confirm' | 'generation'

export type ExperienceEntry = {
  title: string
  company: string
  location?: string
  startDate: string
  endDate: string | 'present'
  bullets: string[]
}

export type EducationEntry = {
  degree: string
  institution: string
  year: string
  gpa?: string
}

export type CertificationEntry = {
  name: string
  issuer: string
  year?: string
}

export type CVState = {
  fullName: string
  email: string
  phone: string
  linkedin?: string
  location?: string
  summary: string
  experience: ExperienceEntry[]
  skills: string[]
  education: EducationEntry[]
  certifications?: CertificationEntry[]
}

export type ATSIssue = {
  severity: 'critical' | 'warning' | 'info'
  section: string
  message: string
}

export type ATSScoreResult = {
  total: number
  breakdown: {
    format: number
    structure: number
    keywords: number
    contact: number
    impact: number
  }
  issues: ATSIssue[]
  suggestions: string[]
}

export type GapAnalysisResult = {
  matchScore: number
  missingSkills: string[]
  weakAreas: string[]
  improvementSuggestions: string[]
}

export type CVContactDiff = {
  before: Pick<CVState, 'fullName' | 'email' | 'phone' | 'linkedin' | 'location'>
  after: Pick<CVState, 'fullName' | 'email' | 'phone' | 'linkedin' | 'location'>
  changedFields: Array<'fullName' | 'email' | 'phone' | 'linkedin' | 'location'>
}

export type CVSummaryDiff = {
  before: string
  after: string
  changed: boolean
}

export type CVSkillsDiff = {
  added: string[]
  removed: string[]
  unchangedCount: number
}

export type CVListItemDiff<T> = {
  added: T[]
  removed: T[]
  changed: Array<{
    before: T
    after: T
  }>
  unchangedCount: number
}

export type CVStateDiff = {
  contact?: CVContactDiff
  summary?: CVSummaryDiff
  skills?: CVSkillsDiff
  experience?: CVListItemDiff<ExperienceEntry>
  education?: CVListItemDiff<EducationEntry>
  certifications?: CVListItemDiff<CertificationEntry>
}
