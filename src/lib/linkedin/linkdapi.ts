import type { CVState, ExperienceEntry, EducationEntry, CertificationEntry } from '@/types/cv'

const LINKDAPI_KEY = process.env.LINKDAPI_API_KEY

if (!LINKDAPI_KEY) {
  console.warn('LINKDAPI_API_KEY is not set in environment')
}

type LinkdAPIExperience = {
  title?: string
  company?: string
  location?: string
  startDate?: string
  endDate?: string
  description?: string
}

type LinkdAPIEducation = {
  school?: string
  degree?: string
  field?: string
  startDate?: string
  endDate?: string
}

type LinkdAPIProfile = {
  success?: boolean
  message?: string
  data?: {
    fullName?: string
    email?: string
    phone?: string
    profileUrl?: string
    location?: {
      full?: string
    }
    summary?: string
    experience?: LinkdAPIExperience[]
    education?: LinkdAPIEducation[]
    skills?: Array<{ name?: string } | string>
    certifications?: Array<{ name?: string; issuer?: string; date?: string }>
  }
}

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

export function mapLinkdAPIToCvState(data: LinkdAPIProfile['data']): CVState {
  if (!data) {
    throw new Error('No profile data to map')
  }

  const experience: ExperienceEntry[] = (data.experience ?? [])
    .filter((exp): exp is Required<LinkdAPIExperience> => !!(exp.title && exp.company))
    .map((exp) => ({
      title: exp.title,
      company: exp.company,
      location: exp.location ?? '',
      startDate: exp.startDate ?? '',
      endDate: exp.endDate ?? '',
      bullets: exp.description
        ? exp.description
            .split('\n')
            .map((b) => b.trim())
            .filter((b) => b.length > 0)
        : [],
    }))

  const education: EducationEntry[] = (data.education ?? [])
    .filter((edu): edu is Required<Pick<LinkdAPIEducation, 'school'>> & LinkdAPIEducation => !!edu.school)
    .map((edu) => ({
      degree: edu.degree ?? '',
      institution: edu.school,
      year: edu.endDate ?? edu.startDate ?? '',
      gpa: undefined,
    }))

  const skills: string[] = (data.skills ?? [])
    .map((skill) => {
      if (typeof skill === 'string') {
        return skill.trim()
      }
      return (skill as any)?.name?.trim() ?? ''
    })
    .filter((skill) => skill.length > 0)

  const certifications: CertificationEntry[] = (data.certifications ?? [])
    .filter((cert): cert is Required<Pick<typeof cert, 'name'>> & typeof cert => !!cert.name)
    .map((cert) => ({
      name: cert.name,
      issuer: cert.issuer ?? '',
      year: cert.date ?? undefined,
    }))

  return {
    fullName: data.fullName ?? '',
    email: data.email ?? '',
    phone: data.phone ?? '',
    linkedin: data.profileUrl ?? undefined,
    location: data.location?.full ?? undefined,
    summary: data.summary ?? '',
    experience,
    skills,
    education,
    certifications: certifications.length > 0 ? certifications : undefined,
  }
}
