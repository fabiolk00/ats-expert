import { describe, expect, it } from 'vitest'

import { auditDatabaseConventions, formatAuditFindings } from './schema-guardrails'

describe('database schema guardrails', () => {
  it('keeps managed tables and SQL functions aligned with id and timestamp conventions', () => {
    const findings = auditDatabaseConventions(process.cwd())

    expect(findings, formatAuditFindings(findings)).toEqual([])
  })
})
