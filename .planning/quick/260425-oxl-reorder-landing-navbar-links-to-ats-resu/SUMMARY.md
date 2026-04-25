# Quick Task 260425-oxl

## Task

Reorder the landing navbar links to: `O que é ATS?`, `Currículos por área`, `Preços`.

## Outcome

- Reordered the desktop navbar in `src/components/landing/header.tsx` to show ATS first, the area dropdown second, and pricing third.
- Reordered the mobile menu to match the same sequence.
- Normalized the touched header labels/copy to proper pt-BR accents on the edited lines.
- Added a focused header test asserting the navigation order.

## Verification

- `npx vitest run "src/components/landing/header.test.tsx"`
- `npx eslint "src/components/landing/header.tsx" "src/components/landing/header.test.tsx"`
