import { describe, expect, it } from 'vitest'

import { getJobCompatibilityAssessmentMode } from '@/lib/agent/job-targeting/compatibility/feature-flags'

describe('job compatibility assessment feature flags', () => {
  it('defaults to enabled shadow mode without source-of-truth cutover', () => {
    expect(getJobCompatibilityAssessmentMode({})).toEqual({
      enabled: true,
      shadowMode: true,
      sourceOfTruth: false,
    })
  })

  it('disables all assessment work when disabled', () => {
    expect(getJobCompatibilityAssessmentMode({
      JOB_COMPATIBILITY_ASSESSMENT_ENABLED: 'false',
    })).toEqual({
      enabled: false,
      shadowMode: false,
      sourceOfTruth: false,
    })
  })

  it('activates source-of-truth only when shadow mode is off', () => {
    expect(getJobCompatibilityAssessmentMode({
      JOB_COMPATIBILITY_ASSESSMENT_ENABLED: 'true',
      JOB_COMPATIBILITY_ASSESSMENT_SHADOW_MODE: 'false',
      JOB_COMPATIBILITY_ASSESSMENT_SOURCE_OF_TRUTH: 'true',
    })).toEqual({
      enabled: true,
      shadowMode: false,
      sourceOfTruth: true,
    })
  })
})
