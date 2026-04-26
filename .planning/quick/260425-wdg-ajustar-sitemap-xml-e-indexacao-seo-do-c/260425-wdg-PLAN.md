# Quick Task 260425-wdg: Ajustar sitemap.xml e indexacao SEO do CurrIA

## Scope

1. Canonicalize SEO site URL handling with a stable production fallback for sitemap, robots, and metadata surfaces.
2. Restrict the sitemap to strategic public SEO pages and replace per-request `new Date()` usage with a stable `lastModified`.
3. Add regression coverage for sitemap stability, auth-route exclusion, canonical absolute URLs, and robots sitemap exposure.
