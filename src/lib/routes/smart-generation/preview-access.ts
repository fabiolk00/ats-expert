import { getPreviewLockSummary } from '@/lib/generated-preview/locked-preview'

export function resolvePersistedGeneratedOutput(
  generationResult: Awaited<ReturnType<typeof import('@/lib/agent/tools').dispatchToolWithContext>>,
) {
  return generationResult.generatedOutput ?? generationResult.persistedPatch?.generatedOutput
}

export function assertPreviewAccessConsistency(input: {
  generationResult: Awaited<ReturnType<typeof import('@/lib/agent/tools').dispatchToolWithContext>>
}) {
  const outputPreviewAccess = input.generationResult.generatedOutput?.previewAccess
  const patchPreviewAccess = input.generationResult.persistedPatch?.generatedOutput?.previewAccess

  if (!outputPreviewAccess || !patchPreviewAccess) {
    return
  }

  if (JSON.stringify(outputPreviewAccess) !== JSON.stringify(patchPreviewAccess)) {
    throw new Error('Generated output previewAccess must match the persisted patch previewAccess.')
  }
}

export function resolvePreviewLockSummary(
  generationResult: Awaited<ReturnType<typeof import('@/lib/agent/tools').dispatchToolWithContext>>,
) {
  return getPreviewLockSummary(resolvePersistedGeneratedOutput(generationResult))
}
