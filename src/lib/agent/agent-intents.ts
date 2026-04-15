export type RewriteFocus = 'summary' | 'experience' | 'skills'

export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function isGenerationApproval(message: string): boolean {
  const normalized = normalizeText(message)

  if (!normalized || /\b(nao|not|cancel|depois)\b/.test(normalized)) {
    return false
  }

  return /\b(aceito|aceito gerar|aceito a geracao|confirmo a geracao)\b/.test(normalized)
}

export function isGenerationRequest(message: string): boolean {
  const normalized = normalizeText(message)

  if (!normalized || /\b(nao|not|cancel|depois)\b/.test(normalized)) {
    return false
  }

  return (
    /\b(pode gerar|gerar agora|gere o arquivo|gere os arquivos|gere o curriculo|gere meu curriculo)\b/.test(normalized)
    || (
      /\b(gere|gerar|gera|exporte|exportar|baixar|baixe|download)\b/.test(normalized)
      && /\b(arquivo|arquivos|curriculo|pdf|docx|versao final)\b/.test(normalized)
    )
  )
}

export function isDialogContinuationApproval(message: string): boolean {
  const normalized = normalizeText(message)

  if (!normalized || /\b(nao|not|cancel|depois)\b/.test(normalized)) {
    return false
  }

  return /^(sim|ok|okay|pode|pode fazer|pode seguir|segue|continue|continua|vai|manda ver|bora)$/.test(normalized)
}

export function resolveRewriteFocus(message: string): RewriteFocus | null {
  const normalized = normalizeText(message)

  if (!normalized) {
    return null
  }

  if (/\b(resumo|summary|perfil profissional)\b/.test(normalized)) {
    return 'summary'
  }

  if (/\b(experiencia|experience|historico)\b/.test(normalized)) {
    return 'experience'
  }

  if (/\b(competencia|competencias|skills|habilidades)\b/.test(normalized)) {
    return 'skills'
  }

  return null
}

function normalizeForJobDetection(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function looksLikeJobDescription(text: string): boolean {
  const trimmed = text.trim()
  if (trimmed.length < 140) {
    return false
  }

  const normalized = normalizeForJobDetection(trimmed)
  const sectionSignals = [
    'responsabilidades',
    'responsibility',
    'responsibilities',
    'requisitos',
    'requirements',
    'resumo dos requisitos',
    'requisitos desejaveis',
    'qualificacoes',
    'qualifications',
    'diferenciais',
    'nice to have',
    'o que oferecemos',
    'o que procuramos',
    'we are looking for',
    'job description',
  ]

  const sectionHits = sectionSignals.filter((signal) => normalized.includes(signal)).length
  const roleHit = /\b(analista|engenheiro|developer|desenvolvedor|cientista|gerente|coordenador|consultor|product|designer|arquiteto|devops|sre|qa|bi|dados|data)\b/.test(normalized)
  const hiringIntentHit = /\b(vaga|cargo|posicao|position|role|opportunity|buscamos|contratando)\b/.test(normalized)
  const summarizedRequirementsHit = normalized.includes('resumo dos requisitos') || normalized.includes('requisitos desejaveis')
  const keywordListHit = /(?:sql|python|r|looker|bigquery|google analytics|google tag manager|appsflyer|github|machine learning|etl|power bi|tableau|dbt|airflow|google sheets|sql server).*(?:,|\n).*(?:sql|python|r|looker|bigquery|google analytics|google tag manager|appsflyer|github|machine learning|etl|power bi|tableau|dbt|airflow|google sheets|sql server).*(?:,|\n).*(?:sql|python|r|looker|bigquery|google analytics|google tag manager|appsflyer|github|machine learning|etl|power bi|tableau|dbt|airflow|google sheets|sql server)/.test(normalized)

  return (
    sectionHits >= 2
    || (roleHit && hiringIntentHit && trimmed.length >= 220)
    || (summarizedRequirementsHit && keywordListHit && trimmed.length >= 180)
  )
}

export function isDialogRewriteRequest(message: string): boolean {
  const normalized = normalizeText(message)

  if (!normalized || looksLikeJobDescription(message)) {
    return false
  }

  if (resolveRewriteFocus(message)) {
    return true
  }

  return /\b(reescreva|reescrever|reescreve|rewrite|adapte|adaptar|ajuste|ajustar|melhore|melhorar|refaca|refazer)\b/.test(normalized)
}

export function isCareerFitOverrideConfirmation(message: string): boolean {
  const normalized = normalizeText(message)

  if (!normalized) {
    return false
  }

  return (
    /\b(entendo|compreendo|eu entendo)\b/.test(normalized)
    && /\b(quero continuar|quero prosseguir|mesmo assim quero continuar|ainda assim quero continuar|prosseguir mesmo assim|continuar mesmo assim)\b/.test(normalized)
  )
}
