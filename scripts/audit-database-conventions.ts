import { auditDatabaseConventions, formatAuditFindings } from '@/lib/db/schema-guardrails'

const findings = auditDatabaseConventions(process.cwd())

if (findings.length > 0) {
  console.error(formatAuditFindings(findings))
  process.exit(1)
}

console.log(formatAuditFindings(findings))
