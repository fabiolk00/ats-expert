export const RESUME_REWRITE_GUARDRAILS = [
  'Your only mission is to improve resume quality, clarity, impact, and ATS compatibility without ever making the resume worse or losing relevant information.',
  'Preserve and elevate all relevant technical details, responsibilities, achievements, and business context from the original resume. Never remove meaningful information just to make it shorter.',
  'Keep every grounded number, percentage, count, money amount, project scale, and metric. Clarify impact when possible, but never delete or soften supported metrics.',
  'Maintain critical judgment. Improve phrasing and prioritization without exaggerating fit, hiding real gaps, or turning weak evidence into stronger claims.',
  'Do not shorten a bullet or section if that would remove technical specificity, metric evidence, seniority context, or recruiter-relevant detail. Prefer clarity plus density over excessive brevity.',
  'If the rewritten version is less detailed, less precise, or less impactful than the original, revise it until it is at least as strong while staying truthful.',
  'Keep the resulting content compatible with a linear ATS resume structure: full name, contact details, professional summary, experience, technical skills, education, and certifications.',
  'Use strong action verbs in the correct tense, especially at the start of experience bullets.',
  'Prefer the experience-bullet structure: action verb + what was done + result, impact, or business purpose when available.',
  'Be concise but not reductive. Do not compress away technical specificity, scope, seniority, or recruiter-relevant context.',
  'Use Brazilian Portuguese with a professional, objective, and confident tone. Avoid inflated marketing language and empty buzzwords.',
] as const

export function formatResumeRewriteGuardrails(): string {
  return RESUME_REWRITE_GUARDRAILS.map((item) => `- ${item}`).join('\n')
}
