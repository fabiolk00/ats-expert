# Job Targeting Catalog Governance

Catalog packs are versioned knowledge data. They may contain concrete tools, platforms, business systems, and domain terms, but the compatibility core must not hardcode those terms.

## Required Metadata

Every pack, term, alias, category, category relationship, and anti-equivalence must include governance metadata:

- `validatedBy`
- `validatedAt`
- `reviewRequired: true`
- `semanticRiskLevel`
- `rationale`
- `goldenCaseIds`

High-risk rules also require at least two reviewers in `reviewers`.

## Review Policy

1. No rule enters the catalog without `goldenCaseIds`.
2. No rule enters without `rationale`.
3. No rule enters without `validatedBy`.
4. Anti-equivalence changes require review by another person.
5. `semanticRiskLevel=high` requires at least two reviewers.
6. Removing or changing a rule must update dependent golden cases.
7. Every rule should have a positive and negative test case.

## Runtime Boundary

The compatibility core may import catalog types and the catalog loader. It must not import files under `catalog/domain-packs/**` or embed domain-specific terms in matching, scoring, claim policy, extraction, decomposition, or validation logic.
