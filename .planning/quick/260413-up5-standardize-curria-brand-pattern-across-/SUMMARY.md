Standardized the `CurrIA` wordmark across the landing page and other public-facing pages.

What changed:
- Added a reusable `BrandWordmark` / `BrandText` component in `src/components/brand-wordmark.tsx`.
- Refactored `src/components/logo.tsx` to reuse the same brand treatment as the rest of the public UI.
- Applied the standardized wordmark in the landing hero, ATS explainer, FAQ, social proof, ATS explainer page, pricing page, footer, privacy page, and terms page.
- Preserved existing layout and copy structure while making the `CurrIA` brand rendering consistent.

Verification:
- `npm run typecheck`
