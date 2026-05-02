export type JobCompatibilityAssessmentMode = {
  enabled: boolean
  shadowMode: boolean
  sourceOfTruth: boolean
}

function readBooleanFlag(
  value: string | undefined,
  defaultValue: boolean,
): boolean {
  if (value === undefined || value.trim() === '') {
    return defaultValue
  }

  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase())
}

export function getJobCompatibilityAssessmentMode(
  env: Partial<NodeJS.ProcessEnv> = process.env,
): JobCompatibilityAssessmentMode {
  const enabled = readBooleanFlag(env.JOB_COMPATIBILITY_ASSESSMENT_ENABLED, true)
  const shadowMode = readBooleanFlag(env.JOB_COMPATIBILITY_ASSESSMENT_SHADOW_MODE, true)
  const sourceOfTruth = readBooleanFlag(env.JOB_COMPATIBILITY_ASSESSMENT_SOURCE_OF_TRUTH, false)

  return {
    enabled,
    shadowMode: enabled && shadowMode && !sourceOfTruth,
    sourceOfTruth: enabled && sourceOfTruth && !shadowMode,
  }
}
