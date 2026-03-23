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
  rawText?: string        // original extracted text, not persisted long-term
  targetJobDescription?: string
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
