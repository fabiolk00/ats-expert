import { MAX_TARGETING_PLAN_ITEMS, shapeTargetJobDescription } from '@/lib/agent/job-targeting-retry'
import type { GapAnalysisResult, CVState } from '@/types/cv'
import type { TargetingPlan } from '@/types/agent'

function normalize(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase()
}

function toTitleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function cleanExtractedRole(value: string): string {
  return value
    .replace(/\s+(para\s+atuar|para\s+liderar|para\s+trabalhar|com\s+foco|atuando\s+em|working\s+on|to\s+work).*/i, '')
    .replace(/[|:;-]+$/g, '')
    .trim()
}

function isSectionHeading(line: string): boolean {
  const normalized = normalize(line).replace(/[:\-]+$/g, '').trim()

  return /^(requisitos(?:\s+obrigatorios)?|responsabilidades|qualificacoes|desejavel|diferenciais|beneficios|sobre\s+a?\s*vaga|sobre\s+o\s+time|descricao|resumo|atividades)$/i.test(normalized)
}

function extractTargetRole(targetJobDescription: string): string {
  const shapedTargetJob = shapeTargetJobDescription(targetJobDescription).content
  const lines = shapedTargetJob
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const explicitRoleLine = lines.find((line) =>
    /^(cargo|position|role|vaga|titulo|title)\s*:/i.test(line),
  )
  if (explicitRoleLine) {
    return explicitRoleLine.replace(/^[^:]+:\s*/i, '').trim()
  }

  const rolePattern = /\b(analista|engenheir[oa]|developer|desenvolvedor(?:a)?|cientista|gerente|coordenador(?:a)?|consultor(?:a)?|product manager|designer|arquiteto(?:a)?|devops|sre|qa|analytics engineer|data engineer|data analyst|business intelligence|bi)\b[^,\n|]*/i
  const candidateLines = lines.filter((line) => !isSectionHeading(line))

  for (const line of candidateLines) {
    const roleMatch = line.match(rolePattern)
    if (roleMatch?.[0]) {
      return cleanExtractedRole(roleMatch[0])
    }
  }

  return cleanExtractedRole(candidateLines[0] || lines[0] || 'Target role')
}

function extractJobKeywords(targetJobDescription: string): string[] {
  const text = shapeTargetJobDescription(targetJobDescription).content.toLowerCase()
  const matches = text.match(/[a-z0-9+#.]{3,}/gi) ?? []
  const stopWords = new Set([
    'para', 'com', 'uma', 'das', 'dos', 'que', 'and', 'the', 'this', 'role',
    'vaga', 'sera', 'will', 'you', 'your', 'para', 'como', 'mais', 'sobre',
    'responsabilidades', 'requisitos', 'qualificacoes', 'experience', 'experiencia',
  ])

  return Array.from(new Set(matches.filter((token) => !stopWords.has(token))))
}

function takeRelevant(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).slice(0, MAX_TARGETING_PLAN_ITEMS)
}

export function buildTargetingPlan(params: {
  cvState: CVState
  targetJobDescription: string
  gapAnalysis: GapAnalysisResult
}): TargetingPlan {
  const { cvState, targetJobDescription, gapAnalysis } = params
  const targetRole = toTitleCase(extractTargetRole(targetJobDescription))
  const jobKeywords = extractJobKeywords(targetJobDescription)

  const mustEmphasize = takeRelevant([
    ...cvState.skills.filter((skill) => jobKeywords.includes(normalize(skill))),
    ...cvState.experience
      .flatMap((entry) => [entry.title, ...entry.bullets])
      .filter((value) => jobKeywords.some((keyword) => normalize(value).includes(keyword))),
  ])

  const shouldDeemphasize = takeRelevant(
    cvState.skills.filter((skill) => !jobKeywords.includes(normalize(skill))),
  )

  const missingButCannotInvent = takeRelevant([
    ...gapAnalysis.missingSkills,
  ])

  return {
    targetRole,
    mustEmphasize,
    shouldDeemphasize,
    missingButCannotInvent,
    sectionStrategy: {
      summary: [
        `Posicione o candidato para ${targetRole} sem alegar experiencia nao comprovada.`,
        mustEmphasize.length > 0
          ? `Priorize ${mustEmphasize.join(', ')} quando houver suporte factual.`
          : 'Priorize termos e contextos da vaga que ja aparecem no curriculo.',
        missingButCannotInvent.length > 0
          ? `Nao esconda gaps como ${missingButCannotInvent.join(', ')}.`
          : 'Evite parecer um encaixe perfeito quando houver lacunas reais.',
      ],
      experience: [
        'Reordene a narrativa dos bullets para destacar contexto, stack e impacto mais proximos da vaga.',
        'Mantenha empresas, cargos, datas e escopo factual intactos.',
        shouldDeemphasize.length > 0
          ? `Reduza enfase em ${shouldDeemphasize.join(', ')} quando nao forem centrais para a vaga.`
          : 'Remova redundancias e preserve apenas o que ajuda na leitura ATS.',
      ],
      skills: [
        mustEmphasize.length > 0
          ? `Suba para o topo skills aderentes como ${mustEmphasize.join(', ')}.`
          : 'Ordene skills pela relevancia para a vaga.',
        'Nao adicione skills ausentes do curriculo original.',
      ],
      education: [
        'Mantenha formacao totalmente factual.',
        'Apenas padronize formato e leitura ATS.',
      ],
      certifications: [
        'Destaque certificacoes mais proximas da vaga, mantendo nomes, emissores e anos.',
        'Nao crie alinhamento artificial com certificacoes inexistentes.',
      ],
    },
  }
}
