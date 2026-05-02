import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

const MAX_LEGACY_ADAPTER_IMPORTS = 8
const LEGACY_ADAPTER_IMPORT = '@/lib/agent/job-targeting/compatibility/legacy-adapters'

function collectFiles(root: string): string[] {
  if (!existsSync(root)) {
    return []
  }

  const stat = statSync(root)
  if (stat.isFile()) {
    return [root]
  }

  return readdirSync(root)
    .flatMap((entry) => collectFiles(join(root, entry)))
}

describe('legacy compatibility adapter usage', () => {
  it('does not add new imports of the brownfield legacy adapter', () => {
    const importSites = collectFiles('src')
      .filter((filePath) => filePath.endsWith('.ts') || filePath.endsWith('.tsx'))
      .filter((filePath) => !filePath.includes('__tests__'))
      .filter((filePath) => !filePath.endsWith('compatibility\\legacy-adapters.ts'))
      .filter((filePath) => !filePath.endsWith('compatibility/legacy-adapters.ts'))
      .filter((filePath) => readFileSync(filePath, 'utf8').includes(LEGACY_ADAPTER_IMPORT))
      .map((filePath) => filePath.replace(/\\/gu, '/'))
      .sort()

    // When callers migrate to JobCompatibilityAssessment directly, lower this cap.
    expect(importSites.length).toBeLessThanOrEqual(MAX_LEGACY_ADAPTER_IMPORTS)
  })
})
