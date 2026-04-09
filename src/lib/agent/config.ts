export const AGENT_CONFIG = {
  maxTokens: 2500,
  rewriterMaxTokens: 1200,
  ocrMaxTokens: 2000,
  timeout: 45_000,
  maxToolIterations: 10,
  rateLimitPerMinute: 30,
  maxHistoryMessages: 24,
  maxMessagesPerSession: 15,
  /** Max system prompt length in characters (~6000 tokens). Truncates user-provided sections when exceeded. */
  maxSystemPromptChars: 24_000,
} as const

/** Per-tool timeout configuration (in milliseconds) */
export const TOOL_TIMEOUTS = {
  parse_file: 20_000,     // File parsing can be slow (OCR, large documents)
  analyze_gap: 15_000,    // Gap analysis API calls
  rewrite_section: 12_000, // LLM-based rewriting
  score_ats: 12_000,      // ATS scoring
  set_phase: 3_000,       // Quick database operation
  generate_file: 20_000,  // File generation can be slow (docx/pdf rendering)
  create_target_resume: 15_000, // Target-specific generation
  default: 10_000,        // Fallback for any unlisted tool
} as const

export type ToolName = keyof typeof TOOL_TIMEOUTS

export function getToolTimeout(toolName: string): number {
  if (toolName in TOOL_TIMEOUTS) {
    return TOOL_TIMEOUTS[toolName as ToolName]
  }
  return TOOL_TIMEOUTS.default
}

export const DEFAULT_OPENAI_MODEL = 'gpt-5-nano' as const

const SUPPORTED_OPENAI_MODELS = [
  DEFAULT_OPENAI_MODEL,
  'gpt-5.4-nano',
  'gpt-5-mini',
  'gpt-5',
  'gpt-5.4',
  'gpt-5.4-mini',
] as const

type OpenAIModelName = typeof SUPPORTED_OPENAI_MODELS[number]

function createUniformModelConfig(model: OpenAIModelName) {
  return {
    agent: model,
    structured: model,
    vision: model,
  } as const
}

export const MODEL_COMBINATIONS = {
  combo_a: createUniformModelConfig(DEFAULT_OPENAI_MODEL),
  combo_b: createUniformModelConfig(DEFAULT_OPENAI_MODEL),
  combo_c: createUniformModelConfig(DEFAULT_OPENAI_MODEL),
} as const

export type ModelComboName = keyof typeof MODEL_COMBINATIONS

export function resolveModelCombo(value: string | undefined): ModelComboName {
  const normalized = value?.trim().toLowerCase()

  if (normalized && normalized in MODEL_COMBINATIONS) {
    return normalized as ModelComboName
  }

  return 'combo_a'
}

export const ACTIVE_MODEL_COMBO = resolveModelCombo(process.env.OPENAI_MODEL_COMBO)

export function resolveOpenAIModel(
  value: string | undefined,
  fallback: OpenAIModelName = DEFAULT_OPENAI_MODEL,
): OpenAIModelName {
  const normalized = value?.trim()

  if (!normalized) {
    return fallback
  }

  if (SUPPORTED_OPENAI_MODELS.includes(normalized as OpenAIModelName)) {
    return normalized as OpenAIModelName
  }

  return fallback
}

export const ACTIVE_OPENAI_MODEL = resolveOpenAIModel(
  process.env.OPENAI_MODEL,
  MODEL_COMBINATIONS[ACTIVE_MODEL_COMBO].agent,
)
export const MODEL_CONFIG = createUniformModelConfig(ACTIVE_OPENAI_MODEL)

type AgentConfig = typeof AGENT_CONFIG
type ModelConfig = typeof MODEL_CONFIG
