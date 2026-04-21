import type { SessionGenerateContext } from './types'

import { resolveCompletedArtifactFallback as resolveCompletedArtifactFallbackFromPersistence } from './state-persistence'

export async function resolveCompletedArtifactFallback(
  context: SessionGenerateContext,
) {
  return resolveCompletedArtifactFallbackFromPersistence(context)
}
