export type JobCompatibilityAssessmentMode = {
  enabled: boolean
  shadowMode: boolean
  sourceOfTruth: boolean
  sourceOfTruthRequested: boolean
  cutoverApproved: boolean
  sourceOfTruthBlocked: boolean
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
  const sourceOfTruthRequested = readBooleanFlag(env.JOB_COMPATIBILITY_ASSESSMENT_SOURCE_OF_TRUTH, false)
  const cutoverApproved = readBooleanFlag(env.JOB_COMPATIBILITY_ASSESSMENT_CUTOVER_APPROVED, false)
  const sourceOfTruth = enabled && sourceOfTruthRequested && cutoverApproved && !shadowMode
  const sourceOfTruthBlocked = enabled && sourceOfTruthRequested && !cutoverApproved

  return {
    enabled,
    shadowMode: enabled && (shadowMode || sourceOfTruthBlocked) && !sourceOfTruth,
    sourceOfTruth,
    sourceOfTruthRequested: enabled && sourceOfTruthRequested,
    cutoverApproved,
    sourceOfTruthBlocked,
  }
}
