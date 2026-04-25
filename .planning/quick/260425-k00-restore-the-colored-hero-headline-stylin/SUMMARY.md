# Quick Task 260425-k00

## Task

Remove the hero scroll indicator and move the hero CTA buttons below the before/after block on mobile, while preserving the colored headline styling.

## Outcome

- Removed the `Scroll para explorar` indicator from `src/components/landing/hero-section.tsx`.
- Reordered the hero DOM so the CTA block now comes after the `BeforeAfterComparison` block on mobile.
- Preserved the colored gradient treatment on each hero headline line.
- Fixed visible mojibake in the hero description and primary CTA copy.
- Added `src/components/landing/hero-section.test.tsx` to verify CTA DOM order and the absence of the scroll indicator.

## Verification

- `npx vitest run "src/components/landing/hero-section.test.tsx"`
- `npx eslint "src/components/landing/hero-section.tsx" "src/components/landing/hero-section.test.tsx"`
- `npm run audit:copy-regression`
