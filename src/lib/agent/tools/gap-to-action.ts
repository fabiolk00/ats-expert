import type {
  ApplyGapActionInput,
  ApplyGapActionOutput,
  RewriteSectionInput,
  Session,
  ToolPatch,
} from '@/types/agent'
import type { GapAnalysisResult } from '@/types/cv'

import { rewriteSection } from './rewrite-section'

type GapActionExecutionResult = {
  output: ApplyGapActionOutput
  patch?: ToolPatch
}

const SECTION_KEYWORDS: Array<{
  section: RewriteSectionInput['section']
  patterns: RegExp[]
}> = [
  {
    section: 'summary',
    patterns: [/\bsummary\b/i, /\bprofile\b/i, /\bobjective\b/i, /\bheadline\b/i],
  },
  {
    section: 'experience',
    patterns: [/\bexperience\b/i, /\bachievement/i, /\bimpact\b/i, /\bmetric/i, /\bbullet/i],
  },
  {
    section: 'skills',
    patterns: [/\bskill/i, /\bkeyword/i, /\btechnology\b/i, /\btooling\b/i],
  },
  {
    section: 'education',
    patterns: [/\beducation\b/i, /\bdegree\b/i, /\bacademic\b/i],
  },
  {
    section: 'certifications',
    patterns: [/\bcertification/i, /\blicense/i, /\bcredential/i],
  },
]

function getGapItemsByType(
  gapAnalysis: GapAnalysisResult,
  itemType: ApplyGapActionInput['item_type'],
): string[] {
  switch (itemType) {
    case 'missing_skill':
      return gapAnalysis.missingSkills
    case 'weak_area':
      return gapAnalysis.weakAreas
    case 'suggestion':
      return gapAnalysis.improvementSuggestions
  }
}

function getCurrentSectionContent(
  cvState: Session['cvState'],
  section: RewriteSectionInput['section'],
): string {
  switch (section) {
    case 'summary':
      return cvState.summary
    case 'skills':
      return cvState.skills.join(', ')
    case 'experience':
      return JSON.stringify(cvState.experience)
    case 'education':
      return JSON.stringify(cvState.education)
    case 'certifications':
      return JSON.stringify(cvState.certifications ?? [])
  }
}

function inferSectionFromText(text: string): RewriteSectionInput['section'] | null {
  for (const candidate of SECTION_KEYWORDS) {
    if (candidate.patterns.some((pattern) => pattern.test(text))) {
      return candidate.section
    }
  }

  return null
}

export function mapGapItemToSection(
  itemType: ApplyGapActionInput['item_type'],
  itemValue: string,
  cvState: Session['cvState'],
): RewriteSectionInput['section'] {
  if (itemType === 'missing_skill') {
    return cvState.skills.some((skill) => skill.toLowerCase() === itemValue.toLowerCase())
      ? 'experience'
      : 'skills'
  }

  const inferredSection = inferSectionFromText(itemValue)
  if (inferredSection) {
    return inferredSection
  }

  return itemType === 'suggestion' ? 'experience' : 'summary'
}

function buildGapRewriteInput(
  input: ApplyGapActionInput,
  session: Session,
): RewriteSectionInput | { error: string } {
  const gapAnalysis = session.agentState.gapAnalysis?.result
  if (!gapAnalysis) {
    return { error: 'No structured gap analysis is available for this session.' }
  }

  const validItems = getGapItemsByType(gapAnalysis, input.item_type)
  if (!validItems.includes(input.item_value)) {
    return { error: 'Selected gap item was not found in the current structured gap analysis.' }
  }

  const section = mapGapItemToSection(input.item_type, input.item_value, session.cvState)
  const currentContent = getCurrentSectionContent(session.cvState, section)
  const relatedSuggestions = gapAnalysis.improvementSuggestions.filter((suggestion) =>
    suggestion === input.item_value || inferSectionFromText(suggestion) === section,
  )
  const relatedWeakAreas = gapAnalysis.weakAreas.filter((weakArea) =>
    weakArea === input.item_value || inferSectionFromText(weakArea) === section,
  )
  const targetKeywords = input.item_type === 'missing_skill'
    ? [input.item_value]
    : gapAnalysis.missingSkills.slice(0, 3)

  const instructions = [
    `Improve only the ${section} section using the stored structured gap analysis.`,
    `Selected ${input.item_type.replace('_', ' ')}: ${input.item_value}.`,
    relatedWeakAreas.length > 0 ? `Related weak areas: ${relatedWeakAreas.join('; ')}.` : undefined,
    relatedSuggestions.length > 0 ? `Related suggestions: ${relatedSuggestions.join('; ')}.` : undefined,
    session.agentState.targetJobDescription
      ? `Target job description context: ${session.agentState.targetJobDescription}.`
      : undefined,
    'Do not modify unrelated resume sections.',
  ].filter((value): value is string => value !== undefined)

  return {
    section,
    current_content: currentContent,
    instructions: instructions.join(' '),
    target_keywords: targetKeywords.length > 0 ? targetKeywords : undefined,
  }
}

export async function applyGapAction(
  input: ApplyGapActionInput,
  session: Session,
): Promise<GapActionExecutionResult> {
  const rewriteInput = buildGapRewriteInput(input, session)
  if ('error' in rewriteInput) {
    return {
      output: {
        success: false,
        error: rewriteInput.error,
      },
    }
  }

  const rewriteResult = await rewriteSection(rewriteInput, session.userId, session.id)

  if (!rewriteResult.output.success) {
    return {
      output: {
        success: false,
        error: rewriteResult.output.error,
      },
    }
  }

  return {
    output: {
      success: true,
      section: rewriteInput.section,
      item_type: input.item_type,
      item_value: input.item_value,
      rewritten_content: rewriteResult.output.rewritten_content,
      section_data: rewriteResult.output.section_data,
      keywords_added: rewriteResult.output.keywords_added,
      changes_made: rewriteResult.output.changes_made,
    },
    patch: rewriteResult.patch,
  }
}

export { buildGapRewriteInput }
