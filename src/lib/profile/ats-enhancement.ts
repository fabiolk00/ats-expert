import type { CVState } from '@/types/cv'

export type AtsBaseReadiness = {
  isReady: boolean
  reasons: string[]
}

function hasAnyExperienceEntryData(entry: CVState['experience'][number]): boolean {
  return Boolean(
    entry.title.trim()
    || entry.company.trim()
    || entry.location?.trim()
    || entry.startDate.trim()
    || entry.endDate.trim()
    || entry.bullets.some((bullet) => bullet.trim()),
  )
}

function hasAnyEducationEntryData(entry: CVState['education'][number]): boolean {
  return Boolean(
    entry.degree.trim()
    || entry.institution.trim()
    || entry.year.trim()
    || entry.gpa?.trim(),
  )
}

function hasAnyCertificationEntryData(entry: NonNullable<CVState['certifications']>[number]): boolean {
  return Boolean(
    entry.name.trim()
    || entry.issuer.trim()
    || entry.year?.trim(),
  )
}

function getExperienceEntries(cvState: CVState): CVState['experience'] {
  return cvState.experience.filter(hasAnyExperienceEntryData)
}

function getEducationEntries(cvState: CVState): CVState['education'] {
  return cvState.education.filter(hasAnyEducationEntryData)
}

function getCertificationEntries(cvState: CVState): NonNullable<CVState['certifications']> {
  return (cvState.certifications ?? []).filter(hasAnyCertificationEntryData)
}

export function assessAtsEnhancementReadiness(cvState: CVState): AtsBaseReadiness {
  const hasPersonalData = Boolean(
    cvState.fullName.trim()
    && (cvState.email.trim() || cvState.phone.trim() || cvState.linkedin?.trim() || cvState.location?.trim()),
  )
  const hasSummary = Boolean(cvState.summary.trim())
  const hasExperience = getExperienceEntries(cvState).length > 0
  const hasSkills = cvState.skills.filter((skill) => skill.trim().length > 0).length >= 3
  const hasEducation = getEducationEntries(cvState).length > 0

  const reasons: string[] = []

  if (!hasPersonalData) {
    reasons.push('Adicione seus dados pessoais basicos.')
  }

  if (!hasSummary) {
    reasons.push('Preencha o resumo profissional.')
  }

  if (!hasExperience) {
    reasons.push('Inclua pelo menos uma experiencia.')
  }

  if (!hasSkills) {
    reasons.push('Adicione pelo menos algumas skills relevantes.')
  }

  if (!hasEducation) {
    reasons.push('Adicione pelo menos uma formacao.')
  }

  return {
    isReady: reasons.length === 0,
    reasons,
  }
}

export function getAtsEnhancementBlockingItems(cvState: CVState): string[] {
  const items: string[] = []

  if (!cvState.fullName.trim()) {
    items.push('Dados pessoais: adicione seu nome completo.')
  }

  if (!cvState.email.trim() && !cvState.phone.trim() && !cvState.linkedin?.trim() && !cvState.location?.trim()) {
    items.push('Dados pessoais: informe pelo menos email, telefone, LinkedIn ou localizacao.')
  }

  if (!cvState.summary.trim()) {
    items.push('Resumo profissional: escreva um resumo curto com seu posicionamento e seus principais resultados.')
  }

  const experienceEntries = getExperienceEntries(cvState)

  if (experienceEntries.length === 0) {
    items.push('Experiencia: inclua pelo menos uma experiencia profissional.')
  }

  for (const [index, entry] of experienceEntries.entries()) {
    const itemNumber = index + 1

    if (!entry.title.trim()) {
      items.push(`Experiencia ${itemNumber}: adicione o cargo.`)
    }

    if (!entry.company.trim()) {
      items.push(`Experiencia ${itemNumber}: adicione a empresa.`)
    }

    if (!entry.startDate.trim()) {
      items.push(`Experiencia ${itemNumber}: adicione a data de inicio.`)
    }

    if (!entry.endDate.trim()) {
      items.push(`Experiencia ${itemNumber}: adicione a data de termino ou marque como atual.`)
    }

    if (!entry.bullets.some((bullet) => bullet.trim())) {
      items.push(`Experiencia ${itemNumber}: adicione pelo menos um resultado ou responsabilidade.`)
    }
  }

  if (cvState.skills.filter((skill) => skill.trim().length > 0).length < 3) {
    items.push('Skills: adicione pelo menos 3 skills relevantes.')
  }

  const educationEntries = getEducationEntries(cvState)

  if (educationEntries.length === 0) {
    items.push('Educacao: adicione pelo menos uma formacao academica.')
  }

  for (const [index, entry] of educationEntries.entries()) {
    const itemNumber = index + 1

    if (!entry.degree.trim()) {
      items.push(`Formacao ${itemNumber}: adicione o curso ou graduacao.`)
    }

    if (!entry.institution.trim()) {
      items.push(`Formacao ${itemNumber}: adicione a instituicao.`)
    }

    if (!entry.year.trim()) {
      items.push(`Formacao ${itemNumber}: adicione o ano principal.`)
    }
  }

  const certificationEntries = getCertificationEntries(cvState)

  for (const [index, entry] of certificationEntries.entries()) {
    const itemNumber = index + 1

    if (!entry.name.trim()) {
      items.push(`Certificacao ${itemNumber}: adicione o nome.`)
    }

    if (!entry.issuer.trim()) {
      items.push(`Certificacao ${itemNumber}: adicione o emissor.`)
    }
  }

  return Array.from(new Set(items))
}

export function buildResumeTextFromCvState(cvState: CVState): string {
  const lines: string[] = []

  if (cvState.fullName.trim()) {
    lines.push(cvState.fullName.trim())
  }

  const contactLine = [
    cvState.email?.trim(),
    cvState.phone?.trim(),
    cvState.linkedin?.trim(),
    cvState.location?.trim(),
  ].filter((value): value is string => Boolean(value))

  if (contactLine.length > 0) {
    lines.push(contactLine.join(' | '))
  }

  if (cvState.summary.trim()) {
    lines.push('Resumo')
    lines.push(cvState.summary.trim())
  }

  if (cvState.skills.length > 0) {
    lines.push('Skills')
    lines.push(cvState.skills.join(', '))
  }

  if (cvState.experience.length > 0) {
    lines.push('Experiencia')
    for (const experience of cvState.experience) {
      lines.push(`${experience.title} - ${experience.company}`)
      for (const bullet of experience.bullets) {
        if (bullet.trim()) {
          lines.push(`- ${bullet.trim()}`)
        }
      }
    }
  }

  if (cvState.education.length > 0) {
    lines.push('Educacao')
    for (const education of cvState.education) {
      lines.push(`${education.degree} - ${education.institution} (${education.year})`)
    }
  }

  const certifications = cvState.certifications ?? []
  if (certifications.length > 0) {
    lines.push('Certificacoes')
    for (const certification of certifications) {
      lines.push(
        certification.year?.trim()
          ? `${certification.name} - ${certification.issuer} (${certification.year})`
          : `${certification.name} - ${certification.issuer}`,
      )
    }
  }

  return lines.join('\n').trim()
}
