import { readdir, readFile } from 'node:fs/promises'
import { isAbsolute, join } from 'node:path'

import type {
  JobTargetingCatalogPack,
  LoadedJobTargetingCatalog,
} from '@/lib/agent/job-targeting/catalog/catalog-types'
import {
  JobTargetingCatalogValidationError,
  validateJobTargetingCatalogPack,
} from '@/lib/agent/job-targeting/catalog/catalog-validator'

const DEFAULT_GENERIC_TAXONOMY_PATH = 'src/lib/agent/job-targeting/catalog/generic-taxonomy.json'
const DEFAULT_DOMAIN_PACKS_DIR = 'src/lib/agent/job-targeting/catalog/domain-packs'

export interface LoadJobTargetingCatalogOptions {
  genericTaxonomyPath?: string
  domainPackPaths?: string[]
}

function resolveCatalogPath(filePath: string): string {
  return isAbsolute(filePath) ? filePath : join(process.cwd(), filePath)
}

function normalizeCatalogPath(filePath: string): string {
  return filePath.replace(/\\/gu, '/')
}

async function readCatalogJson(filePath: string): Promise<unknown> {
  const resolvedPath = resolveCatalogPath(filePath)
  const rawCatalog = await readFile(resolvedPath, 'utf8')

  try {
    return JSON.parse(rawCatalog)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid JSON'
    throw new JobTargetingCatalogValidationError(filePath, [
      {
        path: '<root>',
        message,
        code: 'invalid_json',
      },
    ])
  }
}

export async function loadJobTargetingCatalogPackFromPath(
  filePath: string,
): Promise<JobTargetingCatalogPack> {
  const catalogJson = await readCatalogJson(filePath)
  return validateJobTargetingCatalogPack(catalogJson, filePath)
}

export async function getDefaultJobTargetingDomainPackPaths(): Promise<string[]> {
  const entries = await readdir(resolveCatalogPath(DEFAULT_DOMAIN_PACKS_DIR), { withFileTypes: true })

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => normalizeCatalogPath(join(DEFAULT_DOMAIN_PACKS_DIR, entry.name)))
    .sort((left, right) => left.localeCompare(right, 'en'))
}

export async function loadJobTargetingCatalog(
  options: LoadJobTargetingCatalogOptions = {},
): Promise<LoadedJobTargetingCatalog> {
  const genericTaxonomyPath = options.genericTaxonomyPath ?? DEFAULT_GENERIC_TAXONOMY_PATH
  const domainPackPaths = options.domainPackPaths ?? (await getDefaultJobTargetingDomainPackPaths())
  const genericTaxonomy = await loadJobTargetingCatalogPackFromPath(genericTaxonomyPath)
  const domainPacks = await Promise.all(domainPackPaths.map(loadJobTargetingCatalogPackFromPath))
  const catalogs = [genericTaxonomy, ...domainPacks]

  return {
    genericTaxonomy,
    domainPacks,
    metadata: {
      catalogIds: catalogs.map((catalog) => catalog.id),
      catalogVersions: Object.fromEntries(catalogs.map((catalog) => [catalog.id, catalog.version])),
    },
  }
}
