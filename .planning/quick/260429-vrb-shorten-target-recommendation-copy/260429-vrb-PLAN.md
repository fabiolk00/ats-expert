# Quick Task 260429-vrb: Shorten Target Recommendation Copy

## Goal

Make Job Targeting recommendation cards read like concise review bullets instead of repeating raw job-description fragments.

## Scope

- Normalize verbose requirement labels before showing them in the UI.
- Remove repeated "A vaga pede..." sentence openings from recommendation copy.
- Fix punctuation artifacts such as spaces before commas.
- Deduplicate narrower recommendations covered by broader requirements.
- Keep the safety instruction: users should add claims only when true.

## Validation

- `npm test -- src/lib/agent/job-targeting/target-recommendations.test.ts src/components/resume/target-recommendations-card.test.tsx`
- `npm run typecheck`
- `npm run lint`
- `npm run audit:copy-regression`
