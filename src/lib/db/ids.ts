import { randomUUID } from 'node:crypto'

/**
 * Standard surrogate key for generic text-id rows persisted in Postgres.
 * Domain identifiers with business meaning keep their own format.
 */
export function createDatabaseId(): string {
  return randomUUID()
}
