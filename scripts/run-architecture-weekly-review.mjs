import { spawnSync } from 'child_process'

const checks = [
  {
    label: 'Route Architecture Audit',
    command: 'npm run audit:route-architecture',
  },
  {
    label: 'Architecture Proof Pack',
    command: 'npm run test:architecture-proof-pack',
  },
  {
    label: 'Typecheck',
    command: 'npm run typecheck',
  },
]

const hotspotFiles = [
  'src/lib/routes/smart-generation/decision.ts',
  'src/lib/routes/session-generate/decision.ts',
  'src/lib/routes/file-access/response.ts',
  'src/lib/routes/session-compare/decision.ts',
  'src/lib/routes/session-versions/decision.ts',
]

const docsToReview = [
  'docs/architecture/route-policy-boundaries.md',
  'docs/architecture/route-review-checklist.md',
  'docs/architecture/review-plan.md',
  'docs/architecture/hotspot-watchlist.md',
  'docs/architecture/architecture-scorecard.md',
  'docs/architecture/approved-chokepoints.md',
  'docs/operations/signed-url-ttl-review.md',
  'docs/operations/route-architecture-incident-drill.md',
]

for (const check of checks) {
  console.log(`\n== ${check.label} ==`)
  const result = spawnSync(check.command, {
    stdio: 'inherit',
    shell: true,
  })

  if (result.error) {
    console.error(result.error)
    process.exit(1)
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

console.log('\nWeekly architecture review checklist:')
console.log('\nHotspots to inspect:')
for (const file of hotspotFiles) {
  console.log(`- ${file}`)
}

console.log('\nDocs to confirm against code:')
for (const file of docsToReview) {
  console.log(`- ${file}`)
}

console.log('\nMetrics to review:')
console.log('- architecture.file.locked_preview_responses')
console.log('- architecture.file.artifact_available_responses')
console.log('- architecture.compare.locked_responses')
console.log('- architecture.versions.locked_responses')
console.log('- architecture.smart_generation.replay_locked_after_upgrade')

console.log('\nWeekly architecture review completed successfully.')
