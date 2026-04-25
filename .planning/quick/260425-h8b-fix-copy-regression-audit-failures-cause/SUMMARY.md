# Quick Task 260425-h8b

## Task

Fix the new mojibake regressions that caused `npm run audit:copy-regression` to fail.

## Outcome

- Corrected the broken `experiência` string in `src/app/api/profile/smart-generation/route.test.ts`.
- Corrected the broken `currículo` string in `src/components/dashboard/resume-workspace.test.tsx`.
- Corrected the broken `Sessões` label in `src/components/dashboard/sidebar.test.tsx`.
- Left the older baseline-approved mojibake debt untouched so this quick task only removes the new regression.

## Verification

- `npm run audit:copy-regression`
- `npx vitest run "src/app/api/profile/smart-generation/route.test.ts" "src/components/dashboard/resume-workspace.test.tsx" "src/components/dashboard/sidebar.test.tsx"`
