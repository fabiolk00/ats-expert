# Quick Task Summary

Task: Ajustar cards de pricing para sinalizar recursos incluidos/excluidos como a tabela e esconder tabela no mobile.

Changes:
- Updated landing pricing cards to render the same comparison rows used by the pricing table.
- Added explicit included/excluded signaling with green `Check` and red `X` states for boolean features.
- Hid the landing pricing comparison table on mobile with `hidden md:block`.
- Added a focused component test for the landing pricing section.

Validation:
- `npx vitest run "src/components/landing/pricing-section.test.tsx" "src/app/(public)/precos/page.test.tsx" "src/components/pricing/pricing-cards.test.tsx"`
