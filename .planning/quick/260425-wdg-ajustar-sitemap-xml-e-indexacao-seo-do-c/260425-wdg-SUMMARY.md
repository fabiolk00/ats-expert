# Quick Task 260425-wdg Summary

## Delivered

- Added a dedicated SEO site URL helper that always canonicalizes public metadata surfaces to `https://www.curria.com.br` unless `NEXT_PUBLIC_SITE_URL` explicitly overrides it.
- Reworked the sitemap to use a stable `SEO_LAST_MODIFIED` timestamp and to include only strategic public SEO routes plus the role landing pages.
- Removed auth and functional routes from the sitemap output, specifically `/entrar`, `/criar-conta`, and the existing checkout/auth callback exclusions.
- Kept `robots.txt` pointing at `https://www.curria.com.br/sitemap.xml`.
- Extended tests to cover canonical absolute URLs, auth-route exclusion, stable `lastModified`, and robots sitemap exposure.

## Notes

- I did not add `/precos` back into the sitemap because this workspace already removed the standalone `/precos` page and now uses the landing `/#pricing` section instead. Listing a non-existent route in the sitemap would be a technical SEO regression.

## Verification

- `npm run lint`
- `npm run typecheck`
- `npm test -- src/app/sitemap.test.ts src/app/robots.test.ts`
- `npm run build`
- Local `next start` check:
  - `GET /sitemap.xml` returned 200 with 12 absolute `https://www.curria.com.br/...` URLs
  - `/entrar` absent
  - `/criar-conta` absent
  - `lastmod` stable at `2026-04-26T00:00:00.000Z`
  - `GET /robots.txt` includes `Sitemap: https://www.curria.com.br/sitemap.xml`

## Repo-wide Test Status

- `npm test` still fails outside this task in existing unrelated areas, including `src/lib/agent/tools/index.test.ts` and `src/app/api/preview-lock-transverse.test.ts`.
