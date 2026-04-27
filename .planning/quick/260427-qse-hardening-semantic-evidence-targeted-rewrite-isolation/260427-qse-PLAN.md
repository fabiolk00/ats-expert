# Quick Task 260427-qse

## Goal

Harden Phase 108 semantic evidence so it executes only for `job_targeting` targeted rewrite, never for legacy targeting-plan consumers or non-targeted surfaces.

## Scope

- split legacy targeting plan from targeted rewrite enrichment
- prevent `targetEvidence` / `rewritePermissions` from being produced outside targeted rewrite
- harden ambiguous acronym aliasing
- harden bridge grounding and seniority inflation rules
- add explicit isolation and cross-domain regression coverage

## Non-Goals

- no ATS behavior changes
- no generic rewrite changes
- no non-target highlight changes
