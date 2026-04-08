import type { CVState, ExperienceEntry, EducationEntry, CertificationEntry } from '@/types/cv'

const LINKDAPI_KEY = process.env.LINKDAPI_API_KEY

if (!LINKDAPI_KEY) {
  console.warn('LINKDAPI_API_KEY is not set in environment')
}

type LinkdAPIExperience = {
  title?: string
  company?: string | { name?: string }
  companyName?: string
  location?: string
  startDate?: string
  endDate?: string
  description?: string
  start?: {
    year?: number
    month?: number
  }
  end?: {
    year?: number
    month?: number
  }
}

type LinkdAPIEducation = {
  school?: string | { name?: string }
  schoolName?: string
  degree?: string
  field?: string
  fieldOfStudy?: string
  startDate?: string
  endDate?: string
  start?: {
    year?: number
    month?: number
  }
  end?: {
    year?: number
    month?: number
  }
}

type LinkdAPIProfile = {
  success?: boolean
  message?: string
  data?: {
    fullName?: string
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    profileUrl?: string
    username?: string
    location?: {
      full?: string
    }
    geo?: {
      full?: string
    }
    summary?: string
    experience?: LinkdAPIExperience[]
    position?: LinkdAPIExperience[]
    currentPositions?: LinkdAPIExperience[]
    fullPositions?: LinkdAPIExperience[]
    education?: LinkdAPIEducation[]
    educations?: LinkdAPIEducation[]
    currentEducation?: LinkdAPIEducation[]
    skills?: Array<{ name?: string } | string>
    certifications?: Array<{
      name?: string
      issuer?: string
      authority?: string
      date?: string
      start?: {
        year?: number
        month?: number
      }
      end?: {
        year?: number
        month?: number
      }
    }>
  }
}

type LinkdAPISkill = NonNullable<NonNullable<LinkdAPIProfile['data']>['skills']>[number]
type LinkdAPICertification = NonNullable<NonNullable<LinkdAPIProfile['data']>['certifications']>[number]

export async function fetchLinkedInProfile(linkedinUrl: string): Promise<LinkdAPIProfile['data']> {
  if (!LINKDAPI_KEY) {
    throw new Error('LINKDAPI_API_KEY is not configured')
  }

  const username = linkedinUrl.split('/in/')[1]?.replace(/\/$/, '')
  if (!username) {
    throw new Error('Invalid LinkedIn URL format')
  }

  const res = await fetch(
    `https://linkdapi.com/api/v1/profile/full?username=${encodeURIComponent(username)}`,
    {
      headers: {
        'X-linkdapi-apikey': LINKDAPI_KEY,
      },
    }
  )

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`LinkdAPI error: ${res.status} - ${errorText}`)
  }

  const json: LinkdAPIProfile = await res.json()

  if (!json.success || !json.data) {
    throw new Error(`LinkdAPI failed: ${json.message || 'Unknown error'}`)
  }

  return json.data
}

function formatPartialDate(date?: { year?: number; month?: number }): string {
  if (!date?.year) {
    return ''
  }

  if (date.month && date.month >= 1 && date.month <= 12) {
    return `${String(date.month).padStart(2, '0')}/${date.year}`
  }

  return String(date.year)
}

function firstNonEmpty(...values: Array<string | undefined>): string | undefined {
  return values.find((value) => Boolean(value && value.trim()))
}

function deriveProfileUrl(data: NonNullable<LinkdAPIProfile['data']>): string | undefined {
  if (data.profileUrl?.trim()) {
    return data.profileUrl.trim()
  }

  if (data.username?.trim()) {
    return `https://www.linkedin.com/in/${data.username.trim()}/`
  }

  return undefined
}

function deriveFullName(data: NonNullable<LinkdAPIProfile['data']>): string {
  if (data.fullName?.trim()) {
    return data.fullName.trim()
  }

  return [data.firstName?.trim(), data.lastName?.trim()].filter(Boolean).join(' ')
}

function containsCyrillic(value: string): boolean {
  return /[\u0400-\u04FF]/.test(value)
}

function normalizeExperienceLocation(
  location: string | undefined,
  profileLocation: string | undefined,
): string {
  const trimmedLocation = location?.trim() ?? ''
  if (!trimmedLocation) {
    return ''
  }

  if (!containsCyrillic(trimmedLocation)) {
    return trimmedLocation
  }

  const profileCity = profileLocation?.split(',')[0]?.trim()
  if (!profileCity) {
    return trimmedLocation
  }

  const suffix = trimmedLocation
    .split(',')
    .slice(1)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .join(', ')

  return suffix ? `${profileCity}, ${suffix}` : profileCity
}

function getNamedValue(value?: string | { name?: string }): string | undefined {
  if (typeof value === 'string') {
    return value
  }

  return value?.name
}

function getSkillName(skill: LinkdAPISkill): string {
  if (typeof skill === 'string') {
    return skill.trim()
  }

  return skill.name?.trim() ?? ''
}

function hasCertificationName(
  cert: LinkdAPICertification,
): cert is LinkdAPICertification & { name: string } {
  return Boolean(cert.name)
}

export function mapLinkdAPIToCvState(data: LinkdAPIProfile['data']): CVState {
  if (!data) {
    throw new Error('No profile data to map')
  }

  const profileLocation = data.location?.full ?? data.geo?.full ?? undefined
  const rawExperience = data.fullPositions ?? data.position ?? data.currentPositions ?? data.experience ?? []
  const experience: ExperienceEntry[] = rawExperience
    .filter((exp) => Boolean(exp.title && (exp.companyName || getNamedValue(exp.company))))
    .map((exp) => ({
      title: exp.title ?? '',
      company: getNamedValue(exp.company) ?? exp.companyName ?? '',
      location: normalizeExperienceLocation(exp.location, profileLocation),
      startDate: firstNonEmpty(exp.startDate, formatPartialDate(exp.start)) ?? '',
      endDate: firstNonEmpty(exp.endDate, formatPartialDate(exp.end)) ?? '',
      bullets: exp.description
        ? exp.description
            .split('\n')
            .map((b) => b.trim())
            .filter((b) => b.length > 0)
        : [],
    }))

  const rawEducation = data.educations ?? data.education ?? data.currentEducation ?? []
  const education: EducationEntry[] = rawEducation
    .filter((edu) => Boolean(edu.schoolName || getNamedValue(edu.school)))
    .map((edu) => ({
      degree: [edu.degree, edu.fieldOfStudy ?? edu.field].filter(Boolean).join(' - '),
      institution: getNamedValue(edu.school) ?? edu.schoolName ?? '',
      year: firstNonEmpty(
        edu.endDate,
        formatPartialDate(edu.end),
        edu.startDate,
        formatPartialDate(edu.start),
      ) ?? '',
      gpa: undefined,
    }))

  const skills: string[] = (data.skills ?? [])
    .map(getSkillName)
    .filter((skill) => skill.length > 0)

  const certifications: CertificationEntry[] = (data.certifications ?? [])
    .filter(hasCertificationName)
    .map((cert) => ({
      name: cert.name,
      issuer: cert.issuer ?? cert.authority ?? '',
      year: firstNonEmpty(
        cert.date,
        formatPartialDate(cert.end),
        formatPartialDate(cert.start),
      ),
    }))

  return {
    fullName: deriveFullName(data),
    email: data.email ?? '',
    phone: data.phone ?? '',
    linkedin: deriveProfileUrl(data),
    location: profileLocation,
    summary: data.summary ?? '',
    experience,
    skills,
    education,
    certifications: certifications.length > 0 ? certifications : undefined,
  }
}
