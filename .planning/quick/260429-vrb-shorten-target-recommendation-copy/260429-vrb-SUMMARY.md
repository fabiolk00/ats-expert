# Quick Task 260429-vrb: Shorten Target Recommendation Copy

## Completed

- Added requirement-label normalization for verbose job-description fragments.
- Replaced repeated "A vaga pede..." recommendation text with shorter, action-oriented copy.
- Shortened the card intro and safety badge.
- Added semantic dedupe so narrower gaps like "Forecast e budget" are hidden when a broader requirement already covers them.
- Added tests for normalization, dedupe, and the shorter card copy.

## Changed Files

- `src/lib/agent/job-targeting/target-recommendations.ts`
- `src/lib/agent/job-targeting/target-recommendations.test.ts`
- `src/components/resume/target-recommendations-card.tsx`
- `src/components/resume/target-recommendations-card.test.tsx`

## Validation

- `npm test -- src/lib/agent/job-targeting/target-recommendations.test.ts src/components/resume/target-recommendations-card.test.tsx`
- `npm run typecheck`
- `npm run lint`
- `npm run audit:copy-regression`
