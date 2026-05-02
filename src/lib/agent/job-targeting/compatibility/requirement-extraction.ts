import type { JobCompatibilityRequirement } from '@/lib/agent/job-targeting/compatibility/types'

import {
  decomposeJobRequirements,
  REQUIREMENT_DECOMPOSITION_VERSION,
  type RequirementDecompositionInput,
} from './requirement-decomposition'

export const REQUIREMENT_EXTRACTION_VERSION = 'requirement-extraction-v1'

export type RequirementExtractionInput = RequirementDecompositionInput

export function extractJobRequirements(input: RequirementExtractionInput): JobCompatibilityRequirement[] {
  return decomposeJobRequirements(input).map((requirement) => ({
    ...requirement,
    audit: {
      extractorVersion: REQUIREMENT_EXTRACTION_VERSION,
      signalIds: [
        `decomposition.${REQUIREMENT_DECOMPOSITION_VERSION}`,
        ...(requirement.audit?.signalIds ?? []),
      ],
    },
  }))
}
