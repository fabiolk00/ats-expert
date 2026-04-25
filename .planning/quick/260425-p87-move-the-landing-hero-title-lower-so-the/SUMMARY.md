# Quick Task 260425-p87

## Task

Move the landing hero title lower so the fixed navbar no longer overlaps it on mobile.

## Outcome

- Increased the mobile top spacing in `src/components/landing/hero-section.tsx` so the hero content starts below the fixed navbar.
- Kept the existing desktop spacing unchanged from `md` upward.
- Extended `src/components/landing/hero-section.test.tsx` to assert the new mobile-first top padding classes.

## Verification

- `npx vitest run "src/components/landing/hero-section.test.tsx"`
- `npx eslint "src/components/landing/hero-section.tsx" "src/components/landing/hero-section.test.tsx"`
