# Phase 63 Migration Audit

## Legacy Shapes Encountered

- Sessions with `atsScore` only and no `agentState.atsReadiness`
- Sessions with an early Phase 62 `atsReadiness` payload that lacked a contract-version marker
- Sessions with ATS enhancement workflow metadata but no persisted optimized readiness snapshot

## Fallback Strategy

1. If persisted canonical `atsReadiness` exists, normalize it to the current contract version and use it.
2. If canonical readiness is missing but the session is an ATS enhancement session, derive fallback readiness only through the canonical ATS scoring module:
   - post-enhancement contract when optimized CV state exists
   - baseline-only contract when no optimized CV state exists yet
3. Do not treat legacy raw `atsScore` as the product-facing ATS Readiness score directly.

## Why Raw ATS Score Is Not Canonical Readiness

- `atsScore` remains a heuristic engineering score used for diagnostics and compatibility.
- ATS Readiness is a product contract with monotonic display, confidence, quality gates, withholding, and a versioned contract surface.
- Reusing raw `atsScore` directly in product UI would bypass the floor-89 policy, withholding rules, and migration-safe contract semantics.

## Current Limitations

- Compatibility-only payloads may still expose raw `atsScore` for internal or legacy consumers, but main product surfaces must ignore it in favor of canonical readiness.
- Internal agent-context prompts and diagnostics still reference raw ATS score intentionally because that path remains engineering-facing rather than user-facing product UI.
